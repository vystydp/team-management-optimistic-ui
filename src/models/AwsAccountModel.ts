import {
  AwsAccountRef,
  AwsAccountStatus,
  AccountRequest,
  AccountRequestStatus,
} from '../types/aws';

/**
 * Domain model for AWS Account Reference with validation
 */
export class AwsAccountRefModel {
  private data: AwsAccountRef;

  constructor(data: Omit<AwsAccountRef, 'createdAt' | 'updatedAt'>) {
    this.data = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Validate AWS Account Reference data
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate account ID (12 digits)
    if (!/^\d{12}$/.test(this.data.accountId)) {
      errors.push('Account ID must be exactly 12 digits');
    }

    // Validate account name
    if (!this.data.accountName || this.data.accountName.trim().length < 3) {
      errors.push('Account name must be at least 3 characters');
    }

    if (this.data.accountName && this.data.accountName.length > 100) {
      errors.push('Account name must not exceed 100 characters');
    }

    // Validate role ARN format
    const arnPattern = /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/;
    if (!arnPattern.test(this.data.roleArn)) {
      errors.push('Invalid IAM role ARN format');
    }

    // Validate owner email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.data.ownerEmail)) {
      errors.push('Invalid owner email address');
    }

    // Validate type
    if (!['linked', 'managed'].includes(this.data.type)) {
      errors.push('Account type must be either "linked" or "managed"');
    }

    // Validate status
    const validStatuses: AwsAccountStatus[] = ['linked', 'guardrailing', 'guardrailed', 'error'];
    if (!validStatuses.includes(this.data.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update account status
   */
  updateStatus(status: AwsAccountStatus, errorMessage?: string): AwsAccountRefModel {
    const updated = { ...this.data, status, errorMessage };
    delete (updated as Partial<AwsAccountRef>).createdAt;
    delete (updated as Partial<AwsAccountRef>).updatedAt;
    return new AwsAccountRefModel(updated);
  }

  /**
   * Mark account as ready (guardrailed)
   */
  markAsGuardrailed(): AwsAccountRefModel {
    return this.updateStatus('guardrailed');
  }

  /**
   * Mark account as having an error
   */
  markAsError(errorMessage: string): AwsAccountRefModel {
    return this.updateStatus('error', errorMessage);
  }

  /**
   * Check if account is ready for use
   */
  isReady(): boolean {
    return this.data.status === 'guardrailed';
  }

  /**
   * Check if account has an error
   */
  hasError(): boolean {
    return this.data.status === 'error';
  }

  /**
   * Get the underlying data
   */
  toJSON(): AwsAccountRef {
    return { ...this.data };
  }

  /**
   * Create from existing account data
   */
  static fromJSON(data: AwsAccountRef): AwsAccountRefModel {
    const { createdAt, updatedAt, ...rest } = data;
    const model = new AwsAccountRefModel(rest);
    model.data.createdAt = new Date(createdAt);
    model.data.updatedAt = new Date(updatedAt);
    return model;
  }
}

/**
 * Domain model for AWS Account Request with state machine
 */
export class AccountRequestModel {
  private data: AccountRequest;

  constructor(data: Omit<AccountRequest, 'createdAt' | 'updatedAt' | 'status'> & { status?: AccountRequestStatus }) {
    this.data = {
      ...data,
      status: data.status || 'REQUESTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Validate account request data
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate account name
    if (!this.data.accountName || this.data.accountName.trim().length < 3) {
      errors.push('Account name must be at least 3 characters');
    }

    if (this.data.accountName && this.data.accountName.length > 100) {
      errors.push('Account name must not exceed 100 characters');
    }

    // Validate account email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.data.accountEmail)) {
      errors.push('Invalid account email address');
    }

    // Validate purpose
    if (!this.data.purpose || this.data.purpose.trim().length < 10) {
      errors.push('Purpose must be at least 10 characters');
    }

    if (this.data.purpose && this.data.purpose.length > 500) {
      errors.push('Purpose must not exceed 500 characters');
    }

    // Validate region
    const awsRegions = [
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
      'eu-west-1', 'eu-west-2', 'eu-central-1',
      'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
    ];
    if (!awsRegions.includes(this.data.region)) {
      errors.push(`Invalid AWS region. Must be one of: ${awsRegions.join(', ')}`);
    }

    // Validate TTL if provided
    if (this.data.ttl) {
      const ttlDate = new Date(this.data.ttl);
      if (ttlDate <= new Date()) {
        errors.push('TTL must be a future date');
      }
      // Max 90 days in the future
      const maxTTL = new Date();
      maxTTL.setDate(maxTTL.getDate() + 90);
      if (ttlDate > maxTTL) {
        errors.push('TTL cannot be more than 90 days in the future');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * State machine transitions
   */
  private canTransitionTo(newStatus: AccountRequestStatus): boolean {
    const transitions: Record<AccountRequestStatus, AccountRequestStatus[]> = {
      REQUESTED: ['VALIDATING', 'FAILED'],
      VALIDATING: ['CREATING', 'FAILED'],
      CREATING: ['GUARDRAILING', 'FAILED'],
      GUARDRAILING: ['READY', 'FAILED'],
      READY: [], // Terminal state
      FAILED: [], // Terminal state
    };

    return transitions[this.data.status]?.includes(newStatus) || false;
  }

  /**
   * Update request status with validation
   */
  updateStatus(newStatus: AccountRequestStatus, errorMessage?: string): AccountRequestModel {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.data.status} to ${newStatus}`);
    }

    const updates: Partial<AccountRequest> = {
      status: newStatus,
      updatedAt: new Date(),
      errorMessage,
    };

    if (newStatus === 'READY' || newStatus === 'FAILED') {
      updates.completedAt = new Date();
    }

    return new AccountRequestModel({
      ...this.data,
      ...updates,
    } as AccountRequest);
  }

  /**
   * Mark as validating
   */
  startValidation(): AccountRequestModel {
    return this.updateStatus('VALIDATING');
  }

  /**
   * Mark as creating (validation passed)
   */
  startCreation(): AccountRequestModel {
    return this.updateStatus('CREATING');
  }

  /**
   * Set AWS account ID after creation
   */
  setAwsAccountId(accountId: string): AccountRequestModel {
    if (!/^\d{12}$/.test(accountId)) {
      throw new Error('Invalid AWS account ID format');
    }

    return new AccountRequestModel({
      ...this.data,
      awsAccountId: accountId,
      updatedAt: new Date(),
    } as AccountRequest);
  }

  /**
   * Mark as guardrailing
   */
  startGuardrailing(): AccountRequestModel {
    if (!this.data.awsAccountId) {
      throw new Error('Cannot start guardrailing without AWS account ID');
    }
    return this.updateStatus('GUARDRAILING');
  }

  /**
   * Mark as ready (complete)
   */
  markAsReady(awsAccountRef: AwsAccountRef): AccountRequestModel {
    return new AccountRequestModel({
      ...this.data,
      status: 'READY',
      awsAccountRef,
      completedAt: new Date(),
      updatedAt: new Date(),
    } as AccountRequest);
  }

  /**
   * Mark as failed
   */
  markAsFailed(errorMessage: string): AccountRequestModel {
    return this.updateStatus('FAILED', errorMessage);
  }

  /**
   * Check if request is complete
   */
  isComplete(): boolean {
    return this.data.status === 'READY' || this.data.status === 'FAILED';
  }

  /**
   * Check if request is successful
   */
  isSuccessful(): boolean {
    return this.data.status === 'READY';
  }

  /**
   * Check if request failed
   */
  hasFailed(): boolean {
    return this.data.status === 'FAILED';
  }

  /**
   * Calculate progress percentage
   */
  getProgress(): number {
    const statusProgress: Record<AccountRequestStatus, number> = {
      REQUESTED: 0,
      VALIDATING: 20,
      CREATING: 40,
      GUARDRAILING: 70,
      READY: 100,
      FAILED: 0,
    };
    return statusProgress[this.data.status];
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage(): string {
    const messages: Record<AccountRequestStatus, string> = {
      REQUESTED: 'Request submitted, waiting for validation...',
      VALIDATING: 'Validating request parameters...',
      CREATING: 'Creating AWS account via Organizations...',
      GUARDRAILING: 'Applying security guardrails and configurations...',
      READY: 'AWS account is ready to use!',
      FAILED: this.data.errorMessage || 'Request failed',
    };
    return messages[this.data.status];
  }

  /**
   * Get the underlying data
   */
  toJSON(): AccountRequest {
    return { ...this.data };
  }

  /**
   * Create from existing request data
   */
  static fromJSON(data: AccountRequest): AccountRequestModel {
    const { createdAt, updatedAt, status, ...rest } = data;
    const model = new AccountRequestModel({ ...rest, status });
    model.data.createdAt = new Date(createdAt);
    model.data.updatedAt = new Date(updatedAt);
    if (data.completedAt) {
      model.data.completedAt = new Date(data.completedAt);
    }
    if (data.ttl) {
      model.data.ttl = new Date(data.ttl);
    }
    return model;
  }
}
