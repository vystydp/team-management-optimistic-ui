import { AwsAccountRef, AwsAccountStatus } from '../types/aws';

/**
 * In-memory storage for AWS account references
 * TODO: Replace with database in production
 */
class AwsAccountStorage {
  private accounts: Map<string, AwsAccountRef> = new Map();

  /**
   * Create a new account reference
   */
  create(account: Omit<AwsAccountRef, 'id' | 'createdAt' | 'updatedAt'>): AwsAccountRef {
    const newAccount: AwsAccountRef = {
      ...account,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.accounts.set(newAccount.id, newAccount);
    return newAccount;
  }

  /**
   * Find account by ID
   */
  findById(id: string): AwsAccountRef | undefined {
    return this.accounts.get(id);
  }

  /**
   * Find account by AWS account ID
   */
  findByAccountId(accountId: string): AwsAccountRef | undefined {
    return Array.from(this.accounts.values()).find(
      (acc) => acc.accountId === accountId
    );
  }

  /**
   * Find all accounts for a user
   */
  findByUserId(userId: string): AwsAccountRef[] {
    return Array.from(this.accounts.values()).filter(
      (acc) => acc.userId === userId
    );
  }

  /**
   * Find all accounts
   */
  findAll(): AwsAccountRef[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Update account with partial data
   */
  update(id: string, updates: Partial<Omit<AwsAccountRef, 'id' | 'createdAt'>>): AwsAccountRef | undefined {
    const account = this.accounts.get(id);
    if (!account) {
      return undefined;
    }

    const updated: AwsAccountRef = {
      ...account,
      ...updates,
      updatedAt: new Date(),
    };

    this.accounts.set(id, updated);
    return updated;
  }

  /**
   * Update account status
   */
  updateStatus(id: string, status: AwsAccountStatus, errorMessage?: string): AwsAccountRef | undefined {
    return this.update(id, { status, errorMessage });
  }

  /**
   * Delete account
   */
  delete(id: string): boolean {
    return this.accounts.delete(id);
  }

  /**
   * Clear all accounts (for testing)
   */
  clear(): void {
    this.accounts.clear();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `aws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const awsAccountStorage = new AwsAccountStorage();
