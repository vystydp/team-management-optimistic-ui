/**
 * Unit tests for AwsAccountService
 * Tests account linking, validation, and guardrail operations
 */

import { AwsAccountService } from '../aws-account.service';
import { awsAccountStorage } from '../aws-account.storage';
import { crossplaneGuardrailClient } from '../crossplane-guardrail.client';

// Mock dependencies
jest.mock('../aws-account.storage');
jest.mock('../crossplane-guardrail.client');

describe('AwsAccountService', () => {
  let service: AwsAccountService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AwsAccountService();
  });

  describe('linkAccount', () => {
    const validRequest = {
      accountId: '123456789012',
      accountName: 'Test Account',
      roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
      ownerEmail: 'test@example.com',
    };

    it('should link account with valid data', async () => {
      const mockAccount = {
        id: 'acc-123',
        userId: mockUserId,
        ...validRequest,
        type: 'linked' as const,
        status: 'linked' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (awsAccountStorage.findByAccountId as jest.Mock).mockReturnValue(null);
      (awsAccountStorage.create as jest.Mock).mockReturnValue(mockAccount);

      const result = await service.linkAccount(mockUserId, validRequest);

      expect(result).toEqual(mockAccount);
      expect(awsAccountStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          accountId: validRequest.accountId,
          accountName: validRequest.accountName,
          roleArn: validRequest.roleArn,
          ownerEmail: validRequest.ownerEmail,
          type: 'linked',
          status: 'linked',
        })
      );
    });

    it('should reject duplicate account ID', async () => {
      (awsAccountStorage.findByAccountId as jest.Mock).mockReturnValue({
        id: 'acc-existing',
        accountId: '123456789012',
      });

      await expect(
        service.linkAccount(mockUserId, validRequest)
      ).rejects.toThrow('already linked');
    });

    it('should reject invalid account ID format', async () => {
      const invalidRequest = {
        ...validRequest,
        accountId: '12345', // Too short
      };

      await expect(
        service.linkAccount(mockUserId, invalidRequest)
      ).rejects.toThrow('Validation failed');
    });

    it('should reject invalid role ARN format', async () => {
      const invalidRequest = {
        ...validRequest,
        roleArn: 'invalid-arn',
      };

      await expect(
        service.linkAccount(mockUserId, invalidRequest)
      ).rejects.toThrow('Validation failed');
    });

    it('should reject invalid email format', async () => {
      const invalidRequest = {
        ...validRequest,
        ownerEmail: 'not-an-email',
      };

      await expect(
        service.linkAccount(mockUserId, invalidRequest)
      ).rejects.toThrow('Validation failed');
    });

    it('should reject role ARN with mismatched account ID', async () => {
      (awsAccountStorage.findByAccountId as jest.Mock).mockReturnValue(null); // Ensure no existing account
      
      const invalidRequest = {
        ...validRequest,
        roleArn: 'arn:aws:iam::999999999999:role/CrossplaneRole', // Different account ID
      };

      await expect(
        service.linkAccount(mockUserId, invalidRequest)
      ).rejects.toThrow('Role validation failed');
    });
  });

  describe('secureAccount', () => {
    const mockAccount = {
      id: 'acc-123',
      userId: mockUserId,
      accountId: '123456789012',
      accountName: 'Test Account',
      roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
      ownerEmail: 'test@example.com',
      type: 'linked' as const,
      status: 'linked' as const,
      enableCloudTrail: true,
      enableConfig: true,
      budgetAmountUSD: 1000,
      budgetThresholdPercent: 80,
      primaryRegion: 'us-east-1',
      allowedRegions: ['us-east-1'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create guardrail claim and update account status', async () => {
      const mockClaim = {
        metadata: {
          name: 'guardrailed-aws-123456789012',
          namespace: 'default',
        },
        spec: {},
        status: {},
      };

      (awsAccountStorage.findByAccountId as jest.Mock).mockReturnValue(mockAccount);
      (crossplaneGuardrailClient.createClaim as jest.Mock).mockResolvedValue(mockClaim);
      (awsAccountStorage.update as jest.Mock).mockReturnValue({
        ...mockAccount,
        status: 'guardrailing',
        guardrailClaimName: 'guardrailed-aws-123456789012',
      });

      const result = await service.secureAccount(mockUserId, {
        accountId: '123456789012',
      });

      expect(result.status).toBe('guardrailing');
      expect(result.guardrailClaimName).toBe('guardrailed-aws-123456789012');
      expect(crossplaneGuardrailClient.createClaim).toHaveBeenCalledWith({
        accountId: '123456789012',
        accountName: 'Test Account',
        roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
        ownerEmail: 'test@example.com',
        enableCloudTrail: true,
        enableConfig: true,
        budgetAmountUSD: 1000,
        budgetThresholdPercent: 80,
        primaryRegion: 'us-east-1',
        allowedRegions: ['us-east-1'],
      });
    });

    it('should reject securing non-existent account', async () => {
      (awsAccountStorage.findByAccountId as jest.Mock).mockReturnValue(null);

      await expect(
        service.secureAccount(mockUserId, { accountId: '999999999999' })
      ).rejects.toThrow('Account not found');
    });

    it('should reject securing account owned by different user', async () => {
      (awsAccountStorage.findByAccountId as jest.Mock).mockReturnValue({
        ...mockAccount,
        userId: 'other-user',
      });

      await expect(
        service.secureAccount(mockUserId, { accountId: '123456789012' })
      ).rejects.toThrow('Unauthorized');
    });

    it('should reject securing already guardrailed account', async () => {
      (awsAccountStorage.findByAccountId as jest.Mock).mockReturnValue({
        ...mockAccount,
        status: 'guardrailed',
      });

      await expect(
        service.secureAccount(mockUserId, { accountId: '123456789012' })
      ).rejects.toThrow('already being secured or is secured');
    });

    it('should mark account as error if Crossplane claim creation fails', async () => {
      (awsAccountStorage.findByAccountId as jest.Mock).mockReturnValue(mockAccount);
      (crossplaneGuardrailClient.createClaim as jest.Mock).mockRejectedValue(
        new Error('Kubernetes API error')
      );
      (awsAccountStorage.update as jest.Mock).mockReturnValue({
        ...mockAccount,
        status: 'error',
        errorMessage: 'Kubernetes API error',
      });

      await expect(
        service.secureAccount(mockUserId, { accountId: '123456789012' })
      ).rejects.toThrow('Kubernetes API error');

      expect(awsAccountStorage.update).toHaveBeenCalledWith(
        mockAccount.id,
        expect.objectContaining({
          status: 'error',
          errorMessage: 'Kubernetes API error',
        })
      );
    });
  });

  describe('checkGuardrailStatus', () => {
    const mockAccount = {
      id: 'acc-123',
      userId: mockUserId,
      accountId: '123456789012',
      guardrailClaimName: 'guardrailed-aws-123456789012',
      status: 'guardrailing' as const,
    };

    it('should return guardrailed status when claim is ready', async () => {
      (awsAccountStorage.findById as jest.Mock).mockReturnValue(mockAccount);
      (crossplaneGuardrailClient.getClaim as jest.Mock).mockResolvedValue({
        metadata: { name: 'guardrailed-aws-123456789012' },
        status: {
          conditions: [
            { type: 'Synced', status: 'True', reason: 'Available' },
          ],
        },
      });
      (crossplaneGuardrailClient.getGuardrailStatus as jest.Mock).mockReturnValue({
        isReady: true,
        status: 'guardrailed',
      });
      (awsAccountStorage.updateStatus as jest.Mock).mockReturnValue(undefined);

      const result = await service.checkGuardrailStatus('acc-123');

      expect(result.status).toBe('guardrailed');
      expect(awsAccountStorage.updateStatus).toHaveBeenCalledWith(
        'acc-123',
        'guardrailed',
        undefined
      );
    });

    it('should return error status when claim has error', async () => {
      (awsAccountStorage.findById as jest.Mock).mockReturnValue(mockAccount);
      (crossplaneGuardrailClient.getClaim as jest.Mock).mockResolvedValue({
        metadata: { name: 'guardrailed-aws-123456789012' },
        status: { errorMessage: 'Failed to create CloudTrail' },
      });
      (crossplaneGuardrailClient.getGuardrailStatus as jest.Mock).mockReturnValue({
        isReady: false,
        status: 'error',
        errorMessage: 'Failed to create CloudTrail',
      });

      const result = await service.checkGuardrailStatus('acc-123');

      expect(result.status).toBe('error');
      expect(result.errorMessage).toBe('Failed to create CloudTrail');
    });

    it('should return linked status when no claim exists', async () => {
      (awsAccountStorage.findById as jest.Mock).mockReturnValue({
        ...mockAccount,
        guardrailClaimName: undefined,
      });

      const result = await service.checkGuardrailStatus('acc-123');

      expect(result.status).toBe('linked');
    });

    it('should return error if claim not found in Kubernetes', async () => {
      (awsAccountStorage.findById as jest.Mock).mockReturnValue(mockAccount);
      (crossplaneGuardrailClient.getClaim as jest.Mock).mockResolvedValue(null);

      const result = await service.checkGuardrailStatus('acc-123');

      expect(result.status).toBe('error');
      expect(result.errorMessage).toBe('Guardrail claim not found');
    });
  });

  describe('unlinkAccount', () => {
    const mockAccount = {
      id: 'acc-123',
      userId: mockUserId,
      accountId: '123456789012',
      status: 'linked' as const,
    };

    it('should unlink account successfully', async () => {
      (awsAccountStorage.findById as jest.Mock).mockReturnValue(mockAccount);
      (awsAccountStorage.delete as jest.Mock).mockReturnValue(true);

      const result = await service.unlinkAccount(mockUserId, 'acc-123');

      expect(result).toBe(true);
      expect(awsAccountStorage.delete).toHaveBeenCalledWith('acc-123');
    });

    it('should reject unlinking non-existent account', async () => {
      (awsAccountStorage.findById as jest.Mock).mockReturnValue(null);

      await expect(
        service.unlinkAccount(mockUserId, 'acc-999')
      ).rejects.toThrow('Account not found');
    });

    it('should reject unlinking account owned by different user', async () => {
      (awsAccountStorage.findById as jest.Mock).mockReturnValue({
        ...mockAccount,
        userId: 'other-user',
      });

      await expect(
        service.unlinkAccount(mockUserId, 'acc-123')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('removeGuardrails', () => {
    const mockAccount = {
      id: 'acc-123',
      userId: mockUserId,
      accountId: '123456789012',
      status: 'guardrailed' as const,
      guardrailClaimName: 'guardrailed-aws-123456789012',
    };

    it('should remove guardrails successfully', async () => {
      (awsAccountStorage.findById as jest.Mock).mockReturnValue(mockAccount);
      (crossplaneGuardrailClient.deleteClaim as jest.Mock).mockResolvedValue(true);
      (awsAccountStorage.update as jest.Mock).mockReturnValue({
        ...mockAccount,
        status: 'linked',
        guardrailClaimName: undefined,
      });

      const result = await service.removeGuardrails(mockUserId, '123456789012');

      expect(result).toBe(true);
      expect(crossplaneGuardrailClient.deleteClaim).toHaveBeenCalledWith(
        'guardrailed-aws-123456789012'
      );
      expect(awsAccountStorage.update).toHaveBeenCalledWith(
        'acc-123',
        expect.objectContaining({
          status: 'linked',
          guardrailClaimName: undefined,
        })
      );
    });

    it('should return true if no guardrails to remove', async () => {
      (awsAccountStorage.findById as jest.Mock).mockReturnValue({
        ...mockAccount,
        guardrailClaimName: undefined,
      });

      const result = await service.removeGuardrails(mockUserId, '123456789012');

      expect(result).toBe(true);
      expect(crossplaneGuardrailClient.deleteClaim).not.toHaveBeenCalled();
    });
  });

  describe('listAccounts', () => {
    it('should return all accounts for user', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          userId: mockUserId,
          accountId: '111111111111',
          status: 'linked' as const,
        },
        {
          id: 'acc-2',
          userId: mockUserId,
          accountId: '222222222222',
          status: 'guardrailed' as const,
        },
      ];

      (awsAccountStorage.findByUserId as jest.Mock).mockReturnValue(mockAccounts);

      const result = await service.listAccounts(mockUserId);

      expect(result).toEqual(mockAccounts);
      expect(awsAccountStorage.findByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array when no accounts found', async () => {
      (awsAccountStorage.findByUserId as jest.Mock).mockReturnValue([]);

      const result = await service.listAccounts(mockUserId);

      expect(result).toEqual([]);
    });
  });
});
