import {
  AwsAccountRef,
  LinkAccountRequest,
  SecureAccountRequest,
  AssumeRoleValidation,
} from '../types/aws';
import { awsAccountStorage } from './aws-account.storage';
import { crossplaneGuardrailClient } from './crossplane-guardrail.client';

/**
 * AWS Account Service - handles account linking and guardrailing
 */
export class AwsAccountService {
  /**
   * Link an existing AWS account
   */
  async linkAccount(userId: string, request: LinkAccountRequest): Promise<AwsAccountRef> {
    // Validate input
    this.validateLinkRequest(request);

    // Check if account already linked
    const existing = awsAccountStorage.findByAccountId(request.accountId);
    if (existing) {
      throw new Error(`AWS account ${request.accountId} is already linked`);
    }

    // Validate IAM role (assume role)
    const validation = await this.validateRoleArn(request.roleArn, request.accountId);
    if (!validation.success) {
      throw new Error(`Role validation failed: ${validation.error}`);
    }

    // Create account reference
    const account = awsAccountStorage.create({
      userId,
      accountId: request.accountId,
      accountName: request.accountName,
      roleArn: request.roleArn,
      ownerEmail: request.ownerEmail,
      type: 'linked',
      status: 'linked',
    });

    return account;
  }

  /**
   * List all accounts for a user
   */
  async listAccounts(userId: string): Promise<AwsAccountRef[]> {
    return awsAccountStorage.findByUserId(userId);
  }

  /**
   * Get account by ID
   */
  async getAccount(userId: string, accountId: string): Promise<AwsAccountRef | null> {
    const account = awsAccountStorage.findById(accountId);
    
    // Verify user owns this account
    if (account && account.userId !== userId) {
      return null; // Don't reveal accounts from other users
    }

    return account || null;
  }

  /**
   * Unlink an account
   */
  async unlinkAccount(userId: string, accountId: string): Promise<boolean> {
    const account = awsAccountStorage.findById(accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // TODO: Delete GuardrailedAccountClaim if exists
    if (account.guardrailClaimName) {
      console.warn(`TODO: Delete Crossplane claim: ${account.guardrailClaimName}`);
    }

    return awsAccountStorage.delete(accountId);
  }

  /**
   * Apply guardrails to an account (create Crossplane GuardrailedAccountClaim)
   */
  async secureAccount(userId: string, request: SecureAccountRequest): Promise<AwsAccountRef> {
    // Find account by AWS account ID
    const account = awsAccountStorage.findByAccountId(request.accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (account.status === 'guardrailing' || account.status === 'guardrailed') {
      throw new Error('Account is already being secured or is secured');
    }

    // Create GuardrailedAccountClaim in Kubernetes
    try {
      interface ClaimRequest {
        accountId: string;
        accountName: string;
        roleArn: string;
        ownerEmail: string;
        enableCloudTrail?: boolean;
        enableConfig?: boolean;
        budgetAmountUSD?: number;
        budgetThresholdPercent?: number;
        primaryRegion?: string;
        allowedRegions?: string[];
      }
      const claimRequest: ClaimRequest = {
        accountId: account.accountId,
        accountName: account.accountName,
        roleArn: account.roleArn,
        ownerEmail: account.ownerEmail,
      };
      
      // Add optional guardrail parameters if present
      if ('enableCloudTrail' in account) claimRequest.enableCloudTrail = account.enableCloudTrail;
      if ('enableConfig' in account) claimRequest.enableConfig = account.enableConfig;
      if ('budgetAmountUSD' in account) claimRequest.budgetAmountUSD = account.budgetAmountUSD;
      if ('budgetThresholdPercent' in account) claimRequest.budgetThresholdPercent = account.budgetThresholdPercent;
      if ('primaryRegion' in account) claimRequest.primaryRegion = account.primaryRegion;
      if ('allowedRegions' in account) claimRequest.allowedRegions = account.allowedRegions;
      
      const claim = await crossplaneGuardrailClient.createClaim(claimRequest);

      const claimName = claim.metadata.name;

      // Update account status
      const updated = awsAccountStorage.update(account.id, {
        status: 'guardrailing',
        guardrailClaimName: claimName,
      });

      if (!updated) {
        throw new Error('Failed to update account');
      }

      return updated;
    } catch (error) {
      // If Crossplane claim creation fails, mark account as error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating guardrail claim';
      const updated = awsAccountStorage.update(account.id, {
        status: 'error',
        errorMessage,
      });

      if (!updated) {
        throw new Error('Failed to update account');
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Check guardrail status from Crossplane
   */
  async checkGuardrailStatus(accountId: string): Promise<{
    status: string;
    errorMessage?: string;
  }> {
    const account = awsAccountStorage.findById(accountId);
    
    if (!account || !account.guardrailClaimName) {
      return { status: 'linked' };
    }

    try {
      const claim = await crossplaneGuardrailClient.getClaim(account.guardrailClaimName);
      
      if (!claim) {
        return { status: 'error', errorMessage: 'Guardrail claim not found' };
      }

      const guardrailStatus = crossplaneGuardrailClient.getGuardrailStatus(claim);
      
      // Update account status if it has changed
      if (guardrailStatus.status !== account.status) {
        awsAccountStorage.updateStatus(
          account.id,
          guardrailStatus.status as 'linked' | 'guardrailing' | 'guardrailed' | 'error',
          guardrailStatus.errorMessage
        );
      }

      return guardrailStatus;
    } catch (error) {
      console.error('Failed to check guardrail status:', error);
      return {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync account status with Crossplane (for background polling)
   */
  async syncAccountStatus(accountId: string): Promise<void> {
    await this.checkGuardrailStatus(accountId);
  }

  /**
   * Remove guardrails from an account
   */
  async removeGuardrails(userId: string, accountId: string): Promise<boolean> {
    const account = awsAccountStorage.findById(accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (!account.guardrailClaimName) {
      return true; // No guardrails to remove
    }

    try {
      await crossplaneGuardrailClient.deleteClaim(account.guardrailClaimName);

      // Update account status back to linked
      awsAccountStorage.update(account.id, {
        status: 'linked',
        guardrailClaimName: undefined,
        errorMessage: undefined,
      });

      return true;
    } catch (error) {
      console.error('Failed to remove guardrails:', error);
      throw new Error(`Failed to remove guardrails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate link request input
   */
  private validateLinkRequest(request: LinkAccountRequest): void {
    const errors: string[] = [];

    // Validate account ID (12 digits)
    if (!/^\d{12}$/.test(request.accountId)) {
      errors.push('Account ID must be exactly 12 digits');
    }

    // Validate account name
    if (!request.accountName || request.accountName.trim().length < 3) {
      errors.push('Account name must be at least 3 characters');
    }

    // Validate role ARN format
    const arnPattern = /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/;
    if (!arnPattern.test(request.roleArn)) {
      errors.push('Invalid IAM role ARN format (expected: arn:aws:iam::123456789012:role/RoleName)');
    }

    // Validate owner email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(request.ownerEmail)) {
      errors.push('Invalid owner email address');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate IAM role by attempting assume role
   * For MVP, this is a mock. In production, use AWS STS AssumeRole API
   */
  private async validateRoleArn(roleArn: string, expectedAccountId: string): Promise<AssumeRoleValidation> {
    // Extract account ID from role ARN
    const match = roleArn.match(/^arn:aws:iam::(\d{12}):role\//);
    if (!match) {
      return {
        success: false,
        error: 'Invalid role ARN format',
      };
    }

    const arnAccountId = match[1];
    if (arnAccountId !== expectedAccountId) {
      return {
        success: false,
        error: `Role ARN account ID (${arnAccountId}) does not match provided account ID (${expectedAccountId})`,
      };
    }

    // TODO: In production, call AWS STS AssumeRole to validate
    // For MVP, we just validate format
    console.log(`TODO: Call AWS STS AssumeRole for ${roleArn}`);

    return {
      success: true,
      accountId: arnAccountId,
    };
  }

}

// Singleton instance
export const awsAccountService = new AwsAccountService();
