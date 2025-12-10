/**
 * Unit tests for CrossplaneGuardrailClient
 * Tests Kubernetes API interactions and status logic
 */

import { CrossplaneGuardrailClient } from '../crossplane-guardrail.client';
import * as k8s from '@kubernetes/client-node';

// Mock the Kubernetes client
jest.mock('@kubernetes/client-node');

describe('CrossplaneGuardrailClient', () => {
  let client: CrossplaneGuardrailClient;
  let mockK8sApi: jest.Mocked<k8s.CustomObjectsApi>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock KubeConfig
    const mockKubeConfig = {
      loadFromDefault: jest.fn(),
      makeApiClient: jest.fn(),
    };

    (k8s.KubeConfig as jest.Mock).mockImplementation(() => mockKubeConfig);

    // Mock CustomObjectsApi
    mockK8sApi = {
      createNamespacedCustomObject: jest.fn(),
      getNamespacedCustomObject: jest.fn(),
      listNamespacedCustomObject: jest.fn(),
      deleteNamespacedCustomObject: jest.fn(),
    } as unknown as CustomObjectsApi;

    mockKubeConfig.makeApiClient.mockReturnValue(mockK8sApi);

    // Create client instance
    client = new CrossplaneGuardrailClient();
  });

  describe('createClaim', () => {
    it('should create a GuardrailedAccountClaim successfully', async () => {
      const spec = {
        accountId: '123456789012',
        accountName: 'Test Account',
        roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
        ownerEmail: 'test@example.com',
        enableCloudTrail: true,
        enableConfig: true,
        budgetAmountUSD: 1000,
      };

      const mockClaim = {
        apiVersion: 'platform.porsche.com/v1alpha1',
        kind: 'GuardrailedAccountClaim',
        metadata: {
          name: 'guardrailed-aws-123456789012',
          namespace: 'default',
        },
        spec,
        status: {},
      };

      mockK8sApi.createNamespacedCustomObject.mockResolvedValue({
        body: mockClaim,
      } as unknown);

      const result = await client.createClaim(spec);

      expect(result).toEqual(mockClaim);
      expect(mockK8sApi.createNamespacedCustomObject).toHaveBeenCalledWith(
        'platform.porsche.com',
        'v1alpha1',
        'default',
        'guardrailedaccountclaims',
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: 'guardrailed-aws-123456789012',
          }),
        })
      );
    });

    it('should throw error when claim creation fails', async () => {
      const spec = {
        accountId: '123456789012',
        accountName: 'Test Account',
        roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
        ownerEmail: 'test@example.com',
      };

      mockK8sApi.createNamespacedCustomObject.mockRejectedValue(
        new Error('API error')
      );

      await expect(client.createClaim(spec)).rejects.toThrow(
        'Failed to create guardrail claim'
      );
    });
  });

  describe('getClaim', () => {
    it('should retrieve an existing claim', async () => {
      const claimName = 'guardrailed-aws-123456789012';
      const mockClaim = {
        apiVersion: 'platform.porsche.com/v1alpha1',
        kind: 'GuardrailedAccountClaim',
        metadata: { name: claimName, namespace: 'default' },
        spec: { accountId: '123456789012' },
        status: { guardrailsApplied: true },
      };

      mockK8sApi.getNamespacedCustomObject.mockResolvedValue({
        body: mockClaim,
      } as unknown);

      const result = await client.getClaim(claimName);

      expect(result).toEqual(mockClaim);
      expect(mockK8sApi.getNamespacedCustomObject).toHaveBeenCalledWith(
        'platform.porsche.com',
        'v1alpha1',
        'default',
        'guardrailedaccountclaims',
        claimName
      );
    });

    it('should return null for non-existent claim', async () => {
      mockK8sApi.getNamespacedCustomObject.mockRejectedValue({
        statusCode: 404,
      });

      const result = await client.getClaim('non-existent-claim');

      expect(result).toBeNull();
    });

    it('should throw error for non-404 failures', async () => {
      mockK8sApi.getNamespacedCustomObject.mockRejectedValue(
        new Error('API error')
      );

      await expect(client.getClaim('test-claim')).rejects.toThrow();
    });
  });

  describe('getClaimByAccountId', () => {
    it('should find claim by account ID label', async () => {
      const accountId = '123456789012';
      const mockClaim = {
        metadata: { name: `guardrailed-aws-${accountId}` },
        spec: { accountId },
      };

      mockK8sApi.listNamespacedCustomObject.mockResolvedValue({
        body: { items: [mockClaim] },
      } as unknown);

      const result = await client.getClaimByAccountId(accountId);

      expect(result).toEqual(mockClaim);
      expect(mockK8sApi.listNamespacedCustomObject).toHaveBeenCalledWith(
        'platform.porsche.com',
        'v1alpha1',
        'default',
        'guardrailedaccountclaims',
        undefined,
        undefined,
        undefined,
        undefined,
        `guardrail.platform.porsche.com/account-id=${accountId}`
      );
    });

    it('should return null when no claims found', async () => {
      mockK8sApi.listNamespacedCustomObject.mockResolvedValue({
        body: { items: [] },
      } as unknown);

      const result = await client.getClaimByAccountId('999999999999');

      expect(result).toBeNull();
    });
  });

  describe('deleteClaim', () => {
    it('should delete claim successfully', async () => {
      mockK8sApi.deleteNamespacedCustomObject.mockResolvedValue({} as unknown);

      const result = await client.deleteClaim('test-claim');

      expect(result).toBe(true);
      expect(mockK8sApi.deleteNamespacedCustomObject).toHaveBeenCalledWith(
        'platform.porsche.com',
        'v1alpha1',
        'default',
        'guardrailedaccountclaims',
        'test-claim'
      );
    });

    it('should return true for 404 (already deleted)', async () => {
      mockK8sApi.deleteNamespacedCustomObject.mockRejectedValue({
        statusCode: 404,
      });

      const result = await client.deleteClaim('non-existent-claim');

      expect(result).toBe(true);
    });

    it('should throw error for non-404 failures', async () => {
      mockK8sApi.deleteNamespacedCustomObject.mockRejectedValue(
        new Error('API error')
      );

      await expect(client.deleteClaim('test-claim')).rejects.toThrow();
    });
  });

  describe('getGuardrailStatus', () => {
    it('should return guardrailed when guardrailsApplied is true', () => {
      const claim = {
        status: {
          guardrailsApplied: true,
        },
      } as unknown;

      const result = client.getGuardrailStatus(claim);

      expect(result).toEqual({
        isReady: true,
        status: 'guardrailed',
      });
    });

    it('should return error when errorMessage present', () => {
      const claim = {
        status: {
          errorMessage: 'Failed to create CloudTrail',
        },
      } as unknown;

      const result = client.getGuardrailStatus(claim);

      expect(result).toEqual({
        isReady: false,
        status: 'error',
        errorMessage: 'Failed to create CloudTrail',
      });
    });

    it('should return guardrailed when SYNCED condition is True', () => {
      const claim = {
        status: {
          conditions: [
            {
              type: 'Synced',
              status: 'True',
              reason: 'Available',
            },
          ],
        },
      } as unknown;

      const result = client.getGuardrailStatus(claim);

      expect(result).toEqual({
        isReady: true,
        status: 'guardrailed',
      });
    });

    it('should return error when SYNCED is False', () => {
      const claim = {
        status: {
          conditions: [
            {
              type: 'Synced',
              status: 'False',
              reason: 'ReconcileError',
              message: 'Failed to reconcile',
            },
          ],
        },
      } as unknown;

      const result = client.getGuardrailStatus(claim);

      expect(result).toEqual({
        isReady: false,
        status: 'error',
        errorMessage: 'Crossplane reconcile error: Failed to reconcile',
      });
    });

    it('should return guardrailing when READY is False', () => {
      const claim = {
        status: {
          conditions: [
            {
              type: 'Ready',
              status: 'False',
              reason: 'Creating',
            },
          ],
        },
      } as unknown;

      const result = client.getGuardrailStatus(claim);

      expect(result).toEqual({
        isReady: false,
        status: 'guardrailing',
      });
    });

    it('should return guardrailing when no status available', () => {
      const claim = {} as unknown;

      const result = client.getGuardrailStatus(claim);

      expect(result).toEqual({
        isReady: false,
        status: 'guardrailing',
      });
    });

    it('should prioritize SYNCED over READY condition', () => {
      const claim = {
        status: {
          conditions: [
            {
              type: 'Ready',
              status: 'False',
              reason: 'Creating',
            },
            {
              type: 'Synced',
              status: 'True',
              reason: 'Available',
            },
          ],
        },
      } as unknown;

      const result = client.getGuardrailStatus(claim);

      // SYNCED=True should win
      expect(result).toEqual({
        isReady: true,
        status: 'guardrailed',
      });
    });
  });
});
