import { AwsAccountRef } from '../types/aws';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Request to link an existing AWS account
 */
export interface LinkAccountRequest {
  accountId: string;
  accountName: string;
  roleArn: string;
  ownerEmail: string;
}

/**
 * Request to apply guardrails to a linked account
 */
export interface SecureAccountRequest {
  accountId: string;
}

/**
 * AWS Account Service - API client for /api/aws endpoints
 */
class AwsAccountService {
  /**
   * List all AWS accounts for the authenticated user
   */
  async listAccounts(): Promise<AwsAccountRef[]> {
    const response = await fetch(`${API_BASE_URL}/api/aws/accounts`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to list accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.accounts || [];
  }

  /**
   * Get a specific AWS account
   */
  async getAccount(id: string): Promise<AwsAccountRef> {
    const response = await fetch(`${API_BASE_URL}/api/aws/accounts/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get account: ${response.statusText}`);
    }

    const data = await response.json();
    return data.account;
  }

  /**
   * Link an existing AWS account
   */
  async linkAccount(request: LinkAccountRequest): Promise<AwsAccountRef> {
    const response = await fetch(`${API_BASE_URL}/api/aws/link-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to link account');
    }

    const data = await response.json();
    return data.account;
  }

  /**
   * Apply guardrails to a linked account (create GuardrailedAccountClaim)
   */
  async secureAccount(request: SecureAccountRequest): Promise<AwsAccountRef> {
    const response = await fetch(`${API_BASE_URL}/api/aws/secure-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to secure account');
    }

    const data = await response.json();
    return data.account;
  }

  /**
   * Unlink an AWS account
   */
  async unlinkAccount(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/aws/accounts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to unlink account');
    }
  }
}

export const awsAccountService = new AwsAccountService();
