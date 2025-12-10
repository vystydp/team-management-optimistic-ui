import { processAccountRequestsOnce, startAccountWorker, stopAccountWorker } from '../account-worker';
import { accountRequestStorage } from '../account-request.storage';
import { MockOrganizationsClient } from '../aws-organizations.client';

describe('Account Provisioning Worker', () => {
  let mockClient: MockOrganizationsClient;

  beforeEach(() => {
    accountRequestStorage.clear();
    mockClient = new MockOrganizationsClient();
    stopAccountWorker(); // Ensure worker is stopped before each test
  });

  afterEach(() => {
    stopAccountWorker();
  });

  describe('processAccountRequestsOnce', () => {
    it('should transition REQUESTED → VALIDATING', async () => {
      const request = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      expect(request.status).toBe('REQUESTED');

      await processAccountRequestsOnce(mockClient);

      const updated = accountRequestStorage.findById(request.id);
      expect(updated?.status).toBe('VALIDATING');
    });

    it('should transition VALIDATING → CREATING and call AWS Organizations', async () => {
      const request = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      // First pass: REQUESTED → VALIDATING
      await processAccountRequestsOnce(mockClient);

      // Second pass: VALIDATING → CREATING
      await processAccountRequestsOnce(mockClient);

      const updated = accountRequestStorage.findById(request.id);
      expect(updated?.status).toBe('CREATING');
      expect(updated?.awsRequestId).toMatch(/^mock-\d+$/);
    });

    it('should transition CREATING → GUARDRAILING when AWS account creation succeeds', async () => {
      const request = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      // REQUESTED → VALIDATING
      await processAccountRequestsOnce(mockClient);

      // VALIDATING → CREATING
      await processAccountRequestsOnce(mockClient);

      // Wait for mock AWS to "create" the account (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2100));

      // CREATING → GUARDRAILING
      await processAccountRequestsOnce(mockClient);

      const updated = accountRequestStorage.findById(request.id);
      expect(updated?.status).toBe('GUARDRAILING');
      expect(updated?.awsAccountId).toMatch(/^acct-\d+$/);
    }, 10000);

    it('should stay in CREATING while AWS account creation is IN_PROGRESS', async () => {
      const request = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      // REQUESTED → VALIDATING → CREATING
      await processAccountRequestsOnce(mockClient);
      await processAccountRequestsOnce(mockClient);

      const creating = accountRequestStorage.findById(request.id);
      expect(creating?.status).toBe('CREATING');

      // Process again immediately (before 2s timeout)
      await processAccountRequestsOnce(mockClient);

      const stillCreating = accountRequestStorage.findById(request.id);
      expect(stillCreating?.status).toBe('CREATING'); // Should not advance yet
    });

    it('should transition GUARDRAILING → READY', async () => {
      const request = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      // Simulate full workflow
      await processAccountRequestsOnce(mockClient); // REQUESTED → VALIDATING
      await processAccountRequestsOnce(mockClient); // VALIDATING → CREATING

      // Wait for mock account creation
      await new Promise(resolve => setTimeout(resolve, 2100));

      await processAccountRequestsOnce(mockClient); // CREATING → GUARDRAILING
      await processAccountRequestsOnce(mockClient); // GUARDRAILING → READY

      const updated = accountRequestStorage.findById(request.id);
      expect(updated?.status).toBe('READY');
      expect(updated?.completedAt).toBeInstanceOf(Date);
    }, 10000);

    it('should transition to FAILED when AWS account creation fails', async () => {
      // Mock Organizations client to return FAILED state
      const failingClient = new MockOrganizationsClient();
      const originalDescribe = failingClient.describeCreateAccountStatus.bind(failingClient);
      
      failingClient.describeCreateAccountStatus = async (createRequestId: string): Promise<{ createRequestId: string; state: string; accountId?: string; failureReason?: string }> => {
        const _result = await originalDescribe(createRequestId);
        // Override to always fail
        return {
          createRequestId,
          state: 'FAILED',
          failureReason: 'Account limit exceeded',
        };
      };

      const request = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      // REQUESTED → VALIDATING → CREATING
      await processAccountRequestsOnce(failingClient);
      await processAccountRequestsOnce(failingClient);

      // Check status (should report FAILED immediately)
      await processAccountRequestsOnce(failingClient);

      const updated = accountRequestStorage.findById(request.id);
      expect(updated?.status).toBe('FAILED');
      expect(updated?.errorMessage).toContain('Account limit exceeded');
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    it('should handle errors gracefully and transition to FAILED', async () => {
      // Create a client that throws errors
      const errorClient = new MockOrganizationsClient();
      errorClient.createAccount = async (): Promise<never> => {
        throw new Error('Network error: connection timeout');
      };

      const request = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      // REQUESTED → VALIDATING
      await processAccountRequestsOnce(errorClient);

      // VALIDATING → attempt to create account (should fail)
      await processAccountRequestsOnce(errorClient);

      const updated = accountRequestStorage.findById(request.id);
      expect(updated?.status).toBe('FAILED');
      expect(updated?.errorMessage).toContain('Worker error');
      expect(updated?.errorMessage).toContain('Network error');
    });

    it('should process multiple requests in parallel', async () => {
      const req1 = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'account-1',
        ownerEmail: 'a1@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const req2 = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'account-2',
        ownerEmail: 'a2@example.com',
        purpose: 'staging',
        primaryRegion: 'us-east-1',
      });

      // Both should advance REQUESTED → VALIDATING
      await processAccountRequestsOnce(mockClient);

      const updated1 = accountRequestStorage.findById(req1.id);
      const updated2 = accountRequestStorage.findById(req2.id);

      expect(updated1?.status).toBe('VALIDATING');
      expect(updated2?.status).toBe('VALIDATING');
    });

    it('should skip READY and FAILED requests', async () => {
      const ready = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'ready-account',
        ownerEmail: 'ready@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const failed = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'failed-account',
        ownerEmail: 'failed@example.com',
        purpose: 'staging',
        primaryRegion: 'us-east-1',
      });

      accountRequestStorage.updateStatus(ready.id, 'READY');
      accountRequestStorage.updateStatus(failed.id, 'FAILED', 'Previous error');

      await processAccountRequestsOnce(mockClient);

      const readyCheck = accountRequestStorage.findById(ready.id);
      const failedCheck = accountRequestStorage.findById(failed.id);

      expect(readyCheck?.status).toBe('READY'); // Unchanged
      expect(failedCheck?.status).toBe('FAILED'); // Unchanged
    });
  });

  describe('startAccountWorker', () => {
    it('should start background worker', async () => {
      const request = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      startAccountWorker(mockClient, 100); // 100ms polling interval

      // Wait for worker to process
      await new Promise(resolve => setTimeout(resolve, 250));

      const updated = accountRequestStorage.findById(request.id);
      expect(updated?.status).not.toBe('REQUESTED'); // Should have advanced

      stopAccountWorker();
    });

    it('should not start worker if already running', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      startAccountWorker(mockClient);
      startAccountWorker(mockClient);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already running'));

      consoleSpy.mockRestore();
      stopAccountWorker();
    });
  });

  describe('stopAccountWorker', () => {
    it('should stop background worker', async () => {
      const request = accountRequestStorage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      startAccountWorker(mockClient, 100);
      await new Promise(resolve => setTimeout(resolve, 150));

      const afterStart = accountRequestStorage.findById(request.id);
      const statusAfterStart = afterStart?.status;

      stopAccountWorker();

      // Wait and verify status doesn't change after stopping
      await new Promise(resolve => setTimeout(resolve, 250));

      const afterStop = accountRequestStorage.findById(request.id);
      expect(afterStop?.status).toBe(statusAfterStart); // Should not have advanced
    });

    it('should handle multiple stop calls gracefully', () => {
      stopAccountWorker();
      stopAccountWorker(); // Should not throw
    });
  });
});
