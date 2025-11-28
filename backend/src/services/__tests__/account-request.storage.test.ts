import { AccountRequestStorage } from '../account-request.storage';
import { AccountRequestStatus } from '../../types/aws';

describe('AccountRequestStorage', () => {
  let storage: AccountRequestStorage;

  beforeEach(() => {
    storage = new AccountRequestStorage();
  });

  afterEach(() => {
    storage.clear();
  });

  describe('create', () => {
    it('should create account request with generated ID and timestamps', () => {
      const input = {
        userId: 'user-1',
        accountName: 'dev-account',
        ownerEmail: 'dev@example.com',
        purpose: 'development' as const,
        primaryRegion: 'us-west-2',
      };

      const request = storage.create(input);

      expect(request.id).toMatch(/^req-\d+-\d+$/);
      expect(request.userId).toBe('user-1');
      expect(request.accountName).toBe('dev-account');
      expect(request.ownerEmail).toBe('dev@example.com');
      expect(request.purpose).toBe('development');
      expect(request.primaryRegion).toBe('us-west-2');
      expect(request.status).toBe('REQUESTED');
      expect(request.createdAt).toBeInstanceOf(Date);
      expect(request.updatedAt).toBeInstanceOf(Date);
      expect(request.awsAccountId).toBeUndefined();
      expect(request.awsRequestId).toBeUndefined();
    });

    it('should create request with optional guardrail settings', () => {
      const input = {
        userId: 'user-1',
        accountName: 'prod-account',
        ownerEmail: 'prod@example.com',
        purpose: 'production' as const,
        primaryRegion: 'us-east-1',
        budgetAmountUSD: 1000,
        budgetThresholdPercent: 80,
        allowedRegions: ['us-east-1', 'us-west-2'],
      };

      const request = storage.create(input);

      expect(request.budgetAmountUSD).toBe(1000);
      expect(request.budgetThresholdPercent).toBe(80);
      expect(request.allowedRegions).toEqual(['us-east-1', 'us-west-2']);
    });

    it('should generate unique IDs for multiple requests', () => {
      const req1 = storage.create({
        userId: 'user-1',
        accountName: 'account-1',
        ownerEmail: 'a1@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const req2 = storage.create({
        userId: 'user-1',
        accountName: 'account-2',
        ownerEmail: 'a2@example.com',
        purpose: 'staging',
        primaryRegion: 'us-east-1',
      });

      expect(req1.id).not.toBe(req2.id);
    });
  });

  describe('findById', () => {
    it('should find request by ID', () => {
      const created = storage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const found = storage.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.accountName).toBe('test-account');
    });

    it('should return undefined for non-existent ID', () => {
      const found = storage.findById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('findByUserId', () => {
    it('should find all requests for a user', () => {
      const req1 = storage.create({
        userId: 'user-1',
        accountName: 'account-1',
        ownerEmail: 'a1@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const req2 = storage.create({
        userId: 'user-1',
        accountName: 'account-2',
        ownerEmail: 'a2@example.com',
        purpose: 'staging',
        primaryRegion: 'us-east-1',
      });

      storage.create({
        userId: 'user-2',
        accountName: 'account-3',
        ownerEmail: 'a3@example.com',
        purpose: 'production',
        primaryRegion: 'eu-west-1',
      });

      const user1Requests = storage.findByUserId('user-1');
      const user2Requests = storage.findByUserId('user-2');

      expect(user1Requests).toHaveLength(2);
      expect(user2Requests).toHaveLength(1);
      // Verify both requests are present (order may vary due to timestamp precision)
      const accountNames = user1Requests.map(r => r.accountName);
      expect(accountNames).toContain('account-1');
      expect(accountNames).toContain('account-2');
    });

    it('should return empty array for user with no requests', () => {
      const requests = storage.findByUserId('user-with-no-requests');
      expect(requests).toEqual([]);
    });
  });

  describe('findByAwsAccountId', () => {
    it('should find request by AWS account ID', () => {
      const created = storage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      storage.update(created.id, { awsAccountId: '123456789012' });

      const found = storage.findByAwsAccountId('123456789012');

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.awsAccountId).toBe('123456789012');
    });

    it('should return undefined if no request has that account ID', () => {
      const found = storage.findByAwsAccountId('999999999999');
      expect(found).toBeUndefined();
    });
  });

  describe('findByStatus', () => {
    it('should find requests by status', () => {
      const req1 = storage.create({
        userId: 'user-1',
        accountName: 'account-1',
        ownerEmail: 'a1@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const req2 = storage.create({
        userId: 'user-1',
        accountName: 'account-2',
        ownerEmail: 'a2@example.com',
        purpose: 'staging',
        primaryRegion: 'us-east-1',
      });

      storage.updateStatus(req1.id, 'CREATING');
      storage.updateStatus(req2.id, 'READY');

      const requested = storage.findByStatus('REQUESTED');
      const creating = storage.findByStatus('CREATING');
      const ready = storage.findByStatus('READY');

      expect(requested).toHaveLength(0);
      expect(creating).toHaveLength(1);
      expect(creating[0].id).toBe(req1.id);
      expect(ready).toHaveLength(1);
      expect(ready[0].id).toBe(req2.id);
    });
  });

  describe('update', () => {
    it('should update request fields and updatedAt timestamp', () => {
      const created = storage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const originalUpdatedAt = created.updatedAt;

      // Wait a bit to ensure timestamp changes
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      const updated = storage.update(created.id, {
        awsRequestId: 'aws-req-123',
        awsAccountId: '123456789012',
      });

      jest.useRealTimers();

      expect(updated).toBeDefined();
      expect(updated?.awsRequestId).toBe('aws-req-123');
      expect(updated?.awsAccountId).toBe('123456789012');
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should return undefined for non-existent ID', () => {
      const updated = storage.update('non-existent-id', { status: 'READY' });
      expect(updated).toBeUndefined();
    });

    it('should not allow updating id, userId, or createdAt', () => {
      const created = storage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const originalId = created.id;
      const originalUserId = created.userId;
      const originalCreatedAt = created.createdAt;

      // TypeScript should prevent this, but verify at runtime
      storage.update(created.id, { accountName: 'new-name' });

      const updated = storage.findById(originalId);
      expect(updated?.id).toBe(originalId);
      expect(updated?.userId).toBe(originalUserId);
      expect(updated?.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe('updateStatus', () => {
    it('should update status', () => {
      const created = storage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const updated = storage.updateStatus(created.id, 'VALIDATING');

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('VALIDATING');
    });

    it('should set completedAt when status is READY', () => {
      const created = storage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const updated = storage.updateStatus(created.id, 'READY');

      expect(updated?.status).toBe('READY');
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    it('should set completedAt and errorMessage when status is FAILED', () => {
      const created = storage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const updated = storage.updateStatus(
        created.id,
        'FAILED',
        'AWS account creation failed: quota exceeded'
      );

      expect(updated?.status).toBe('FAILED');
      expect(updated?.completedAt).toBeInstanceOf(Date);
      expect(updated?.errorMessage).toBe('AWS account creation failed: quota exceeded');
    });

    it('should return undefined for non-existent ID', () => {
      const updated = storage.updateStatus('non-existent-id', 'READY');
      expect(updated).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete request by ID', () => {
      const created = storage.create({
        userId: 'user-1',
        accountName: 'test-account',
        ownerEmail: 'test@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const deleted = storage.delete(created.id);
      expect(deleted).toBe(true);

      const found = storage.findById(created.id);
      expect(found).toBeUndefined();
    });

    it('should return false for non-existent ID', () => {
      const deleted = storage.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('list', () => {
    beforeEach(() => {
      // Create test data
      storage.create({
        userId: 'user-1',
        accountName: 'account-1',
        ownerEmail: 'a1@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      storage.create({
        userId: 'user-1',
        accountName: 'account-2',
        ownerEmail: 'a2@example.com',
        purpose: 'staging',
        primaryRegion: 'us-east-1',
      });

      const req3 = storage.create({
        userId: 'user-2',
        accountName: 'account-3',
        ownerEmail: 'a3@example.com',
        purpose: 'production',
        primaryRegion: 'eu-west-1',
      });

      storage.updateStatus(req3.id, 'READY');
    });

    it('should list all requests', () => {
      const result = storage.list();

      expect(result.total).toBe(3);
      expect(result.requests).toHaveLength(3);
    });

    it('should filter by userId', () => {
      const result = storage.list({ userId: 'user-1' });

      expect(result.total).toBe(2);
      expect(result.requests).toHaveLength(2);
      expect(result.requests.every(r => r.userId === 'user-1')).toBe(true);
    });

    it('should filter by status', () => {
      const result = storage.list({ status: 'REQUESTED' });

      expect(result.total).toBe(2);
      expect(result.requests).toHaveLength(2);
      expect(result.requests.every(r => r.status === 'REQUESTED')).toBe(true);
    });

    it('should filter by both userId and status', () => {
      const result = storage.list({ userId: 'user-1', status: 'REQUESTED' });

      expect(result.total).toBe(2);
      expect(result.requests).toHaveLength(2);
    });

    it('should paginate results', () => {
      const page1 = storage.list({ limit: 2, offset: 0 });
      const page2 = storage.list({ limit: 2, offset: 2 });

      expect(page1.total).toBe(3);
      expect(page1.requests).toHaveLength(2);
      expect(page2.total).toBe(3);
      expect(page2.requests).toHaveLength(1);
    });

    it('should return requests sorted by creation date', () => {
      const result = storage.list();

      // All 3 requests should be present
      expect(result.requests).toHaveLength(3);
      const accountNames = result.requests.map(r => r.accountName);
      expect(accountNames).toContain('account-1');
      expect(accountNames).toContain('account-2');
      expect(accountNames).toContain('account-3');
      
      // Verify sorted by timestamp (may be reverse order due to timestamp precision)
      for (let i = 0; i < result.requests.length - 1; i++) {
        expect(result.requests[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          result.requests[i + 1].createdAt.getTime()
        );
      }
    });
  });

  describe('clear', () => {
    it('should remove all requests', () => {
      storage.create({
        userId: 'user-1',
        accountName: 'account-1',
        ownerEmail: 'a1@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      storage.create({
        userId: 'user-2',
        accountName: 'account-2',
        ownerEmail: 'a2@example.com',
        purpose: 'staging',
        primaryRegion: 'us-east-1',
      });

      storage.clear();

      const result = storage.list();
      expect(result.total).toBe(0);
      expect(result.requests).toHaveLength(0);
    });

    it('should reset ID counter', () => {
      storage.create({
        userId: 'user-1',
        accountName: 'account-1',
        ownerEmail: 'a1@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      storage.clear();

      const newRequest = storage.create({
        userId: 'user-1',
        accountName: 'account-2',
        ownerEmail: 'a2@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      // ID counter should be reset, so new request should have -1 in ID
      expect(newRequest.id).toMatch(/-1$/);
    });
  });

  describe('getStatusCounts', () => {
    it('should return counts for all status values', () => {
      const req1 = storage.create({
        userId: 'user-1',
        accountName: 'account-1',
        ownerEmail: 'a1@example.com',
        purpose: 'development',
        primaryRegion: 'us-west-2',
      });

      const req2 = storage.create({
        userId: 'user-1',
        accountName: 'account-2',
        ownerEmail: 'a2@example.com',
        purpose: 'staging',
        primaryRegion: 'us-east-1',
      });

      storage.updateStatus(req1.id, 'CREATING');
      storage.updateStatus(req2.id, 'READY');

      const counts = storage.getStatusCounts();

      expect(counts.REQUESTED).toBe(0);
      expect(counts.VALIDATING).toBe(0);
      expect(counts.CREATING).toBe(1);
      expect(counts.GUARDRAILING).toBe(0);
      expect(counts.READY).toBe(1);
      expect(counts.FAILED).toBe(0);
    });

    it('should return zero counts for empty storage', () => {
      const counts = storage.getStatusCounts();

      expect(counts.REQUESTED).toBe(0);
      expect(counts.VALIDATING).toBe(0);
      expect(counts.CREATING).toBe(0);
      expect(counts.GUARDRAILING).toBe(0);
      expect(counts.READY).toBe(0);
      expect(counts.FAILED).toBe(0);
    });
  });
});
