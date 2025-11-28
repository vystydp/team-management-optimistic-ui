import { AccountRequest, CreateAccountRequestInput, AccountRequestStatus } from '../types/aws.js';

/**
 * In-memory storage for account requests
 * Follows same pattern as aws-account.storage.ts
 */
export class AccountRequestStorage {
  private requests: Map<string, AccountRequest> = new Map();
  private idCounter = 1;

  /**
   * Generate unique ID for new request
   */
  private generateId(): string {
    return `req-${Date.now()}-${this.idCounter++}`;
  }

  /**
   * Create new account request
   */
  create(input: CreateAccountRequestInput & { userId: string }): AccountRequest {
    const now = new Date();
    const newRequest: AccountRequest = {
      id: this.generateId(),
      userId: input.userId,
      status: 'REQUESTED',
      accountName: input.accountName,
      ownerEmail: input.ownerEmail,
      purpose: input.purpose,
      primaryRegion: input.primaryRegion,
      budgetAmountUSD: input.budgetAmountUSD,
      budgetThresholdPercent: input.budgetThresholdPercent,
      allowedRegions: input.allowedRegions,
      createdAt: now,
      updatedAt: now,
    };

    this.requests.set(newRequest.id, newRequest);
    return newRequest;
  }

  /**
   * Find request by ID
   */
  findById(id: string): AccountRequest | undefined {
    return this.requests.get(id);
  }

  /**
   * Find all requests for a user
   */
  findByUserId(userId: string): AccountRequest[] {
    return Array.from(this.requests.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // newest first
  }

  /**
   * Find request by AWS account ID (after account is created)
   */
  findByAwsAccountId(accountId: string): AccountRequest | undefined {
    return Array.from(this.requests.values())
      .find(req => req.awsAccountId === accountId);
  }

  /**
   * Find requests by status
   */
  findByStatus(status: AccountRequestStatus): AccountRequest[] {
    return Array.from(this.requests.values())
      .filter(req => req.status === status);
  }

  /**
   * Update existing request
   */
  update(id: string, updates: Partial<Omit<AccountRequest, 'id' | 'userId' | 'createdAt'>>): AccountRequest | undefined {
    const existing = this.requests.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: AccountRequest = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.requests.set(id, updated);
    return updated;
  }

  /**
   * Update status and optionally set error message
   */
  updateStatus(
    id: string, 
    status: AccountRequestStatus, 
    errorMessage?: string
  ): AccountRequest | undefined {
    const updates: Partial<AccountRequest> = { status };
    
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }
    
    if (status === 'READY' || status === 'FAILED') {
      updates.completedAt = new Date();
    }

    return this.update(id, updates);
  }

  /**
   * Delete request by ID
   */
  delete(id: string): boolean {
    return this.requests.delete(id);
  }

  /**
   * List all requests (with pagination)
   */
  list(options?: {
    userId?: string;
    status?: AccountRequestStatus;
    limit?: number;
    offset?: number;
  }): { requests: AccountRequest[]; total: number } {
    let filtered = Array.from(this.requests.values());

    if (options?.userId) {
      filtered = filtered.filter(req => req.userId === options.userId);
    }

    if (options?.status) {
      filtered = filtered.filter(req => req.status === options.status);
    }

    // Sort by creation date, newest first
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    const paginated = filtered.slice(offset, offset + limit);

    return { requests: paginated, total };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.requests.clear();
    this.idCounter = 1;
  }

  /**
   * Get count of requests by status (for monitoring)
   */
  getStatusCounts(): Record<AccountRequestStatus, number> {
    const counts: Record<AccountRequestStatus, number> = {
      REQUESTED: 0,
      VALIDATING: 0,
      CREATING: 0,
      GUARDRAILING: 0,
      READY: 0,
      FAILED: 0,
    };

    for (const req of this.requests.values()) {
      counts[req.status]++;
    }

    return counts;
  }
}

// Export singleton instance
export const accountRequestStorage = new AccountRequestStorage();
