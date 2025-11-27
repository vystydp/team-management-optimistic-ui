import {
  EnvironmentTemplate,
  EnvironmentType,
  EnvironmentSize,
  EnvironmentParameters,
  TeamEnvironment,
  TeamEnvironmentStatus,
} from '../types/aws';

/**
 * Domain model for Environment Template with validation
 */
export class EnvironmentTemplateModel {
  private data: EnvironmentTemplate;

  constructor(data: EnvironmentTemplate) {
    this.data = { ...data };
  }

  /**
   * Validate environment template data
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!this.data.name || this.data.name.trim().length < 3) {
      errors.push('Template name must be at least 3 characters');
    }

    if (this.data.name && this.data.name.length > 100) {
      errors.push('Template name must not exceed 100 characters');
    }

    // Validate description
    if (!this.data.description || this.data.description.trim().length < 10) {
      errors.push('Template description must be at least 10 characters');
    }

    if (this.data.description && this.data.description.length > 500) {
      errors.push('Template description must not exceed 500 characters');
    }

    // Validate type
    const validTypes: EnvironmentType[] = ['sandbox', 'development', 'staging', 'production'];
    if (!validTypes.includes(this.data.type)) {
      errors.push(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate version
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(this.data.version)) {
      errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
    }

    // Validate allowed regions
    if (!this.data.allowedRegions || this.data.allowedRegions.length === 0) {
      errors.push('At least one allowed region must be specified');
    }

    // Validate allowed sizes
    if (!this.data.allowedSizes || this.data.allowedSizes.length === 0) {
      errors.push('At least one allowed size must be specified');
    }

    const validSizes: EnvironmentSize[] = ['small', 'medium', 'large', 'xlarge'];
    const invalidSizes = this.data.allowedSizes?.filter(s => !validSizes.includes(s));
    if (invalidSizes && invalidSizes.length > 0) {
      errors.push(`Invalid sizes: ${invalidSizes.join(', ')}`);
    }

    // Validate estimated cost
    if (this.data.estimatedCost.hourly < 0 || this.data.estimatedCost.monthly < 0) {
      errors.push('Estimated costs cannot be negative');
    }

    if (this.data.estimatedCost.monthly < this.data.estimatedCost.hourly * 24 * 30 * 0.5) {
      errors.push('Monthly cost should be approximately hourly * 730');
    }

    // Validate resources
    if (!this.data.resources || this.data.resources.length === 0) {
      errors.push('At least one resource must be specified');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if template supports a specific region
   */
  supportsRegion(region: string): boolean {
    return this.data.allowedRegions.includes(region);
  }

  /**
   * Check if template supports a specific size
   */
  supportsSize(size: EnvironmentSize): boolean {
    return this.data.allowedSizes.includes(size);
  }

  /**
   * Get estimated monthly cost for a specific size
   */
  getEstimatedCost(size: EnvironmentSize): number {
    const sizeMultipliers: Record<EnvironmentSize, number> = {
      small: 1,
      medium: 2,
      large: 4,
      xlarge: 8,
    };

    return this.data.estimatedCost.monthly * (sizeMultipliers[size] || 1);
  }

  /**
   * Check if template is production-grade
   */
  isProduction(): boolean {
    return this.data.type === 'production';
  }

  /**
   * Get the underlying data
   */
  toJSON(): EnvironmentTemplate {
    return { ...this.data };
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data: EnvironmentTemplate): EnvironmentTemplateModel {
    return new EnvironmentTemplateModel(data);
  }
}

/**
 * Domain model for Team Environment with lifecycle management
 */
export class TeamEnvironmentModel {
  private data: TeamEnvironment;

  constructor(data: Omit<TeamEnvironment, 'createdAt' | 'updatedAt' | 'status'> & { status?: TeamEnvironmentStatus }) {
    this.data = {
      ...data,
      status: data.status || 'REQUESTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TeamEnvironment;
  }

  /**
   * Validate team environment data
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!this.data.name || this.data.name.trim().length < 3) {
      errors.push('Environment name must be at least 3 characters');
    }

    if (this.data.name && this.data.name.length > 100) {
      errors.push('Environment name must not exceed 100 characters');
    }

    // Validate AWS account ID
    if (!/^\d{12}$/.test(this.data.awsAccountId)) {
      errors.push('AWS account ID must be exactly 12 digits');
    }

    // Validate parameters
    const paramErrors = this.validateParameters(this.data.parameters);
    errors.push(...paramErrors);

    // Validate status
    const validStatuses: TeamEnvironmentStatus[] = [
      'REQUESTED', 'VALIDATING', 'CREATING', 'READY', 'UPDATING',
      'PAUSED', 'PAUSING', 'RESUMING', 'ERROR', 'DELETING', 'DELETED',
    ];
    if (!validStatuses.includes(this.data.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate environment parameters
   */
  private validateParameters(params: EnvironmentParameters): string[] {
    const errors: string[] = [];

    // Validate size
    const validSizes: EnvironmentSize[] = ['small', 'medium', 'large', 'xlarge'];
    if (!validSizes.includes(params.size)) {
      errors.push(`Invalid size. Must be one of: ${validSizes.join(', ')}`);
    }

    // Validate region
    const awsRegions = [
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
      'eu-west-1', 'eu-west-2', 'eu-central-1',
      'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
    ];
    if (!awsRegions.includes(params.region)) {
      errors.push(`Invalid AWS region. Must be one of: ${awsRegions.join(', ')}`);
    }

    // Validate TTL if provided
    if (params.ttl) {
      const ttlDate = new Date(params.ttl);
      if (ttlDate <= new Date()) {
        errors.push('TTL must be a future date');
      }
    }

    // Validate instance counts if auto-scaling enabled
    if (params.enableAutoScaling) {
      if (params.minInstances === undefined || params.maxInstances === undefined) {
        errors.push('Auto-scaling requires minInstances and maxInstances');
      }

      if (params.minInstances !== undefined && params.minInstances < 1) {
        errors.push('minInstances must be at least 1');
      }

      if (
        params.minInstances !== undefined &&
        params.maxInstances !== undefined &&
        params.minInstances > params.maxInstances
      ) {
        errors.push('minInstances cannot exceed maxInstances');
      }

      if (params.maxInstances !== undefined && params.maxInstances > 100) {
        errors.push('maxInstances cannot exceed 100');
      }
    }

    return errors;
  }

  /**
   * State machine transitions
   */
  private canTransitionTo(newStatus: TeamEnvironmentStatus): boolean {
    const transitions: Record<TeamEnvironmentStatus, TeamEnvironmentStatus[]> = {
      REQUESTED: ['VALIDATING', 'ERROR'],
      VALIDATING: ['CREATING', 'ERROR'],
      CREATING: ['READY', 'ERROR'],
      READY: ['UPDATING', 'PAUSING', 'DELETING', 'ERROR'],
      UPDATING: ['READY', 'ERROR'],
      PAUSED: ['RESUMING', 'DELETING'],
      PAUSING: ['PAUSED', 'ERROR'],
      RESUMING: ['READY', 'ERROR'],
      ERROR: ['UPDATING', 'DELETING'], // Can retry or delete
      DELETING: ['DELETED', 'ERROR'],
      DELETED: [], // Terminal state
    };

    return transitions[this.data.status]?.includes(newStatus) || false;
  }

  /**
   * Update environment status
   */
  updateStatus(newStatus: TeamEnvironmentStatus, errorMessage?: string): TeamEnvironmentModel {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.data.status} to ${newStatus}`);
    }

    const updates: Partial<TeamEnvironment> = {
      status: newStatus,
      errorMessage: newStatus === 'ERROR' ? errorMessage : undefined,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt: _c, updatedAt: _u, ...rest } = { ...this.data, ...updates };
    const model = new TeamEnvironmentModel({ ...rest, status: newStatus });
    model.data.createdAt = this.data.createdAt;
    model.data.updatedAt = new Date();
    return model;
  }

  /**
   * Start validation
   */
  startValidation(): TeamEnvironmentModel {
    return this.updateStatus('VALIDATING');
  }

  /**
   * Start creation
   */
  startCreation(): TeamEnvironmentModel {
    return this.updateStatus('CREATING');
  }

  /**
   * Mark as ready
   */
  markAsReady(endpoints?: Record<string, string>): TeamEnvironmentModel {
    const updated = this.updateStatus('READY');
    if (endpoints) {
      updated.data.endpoints = endpoints;
    }
    updated.data.health = 'healthy';
    updated.data.lastReconciled = new Date();
    return updated;
  }

  /**
   * Start update
   */
  startUpdate(newParameters: Partial<EnvironmentParameters>): TeamEnvironmentModel {
    const updated = this.updateStatus('UPDATING');
    updated.data.parameters = { ...this.data.parameters, ...newParameters };
    return updated;
  }

  /**
   * Pause environment
   */
  pause(): TeamEnvironmentModel {
    return this.updateStatus('PAUSING');
  }

  /**
   * Mark as paused
   */
  markAsPaused(): TeamEnvironmentModel {
    const updated = this.updateStatus('PAUSED');
    updated.data.health = undefined; // No health when paused
    return updated;
  }

  /**
   * Resume environment
   */
  resume(): TeamEnvironmentModel {
    return this.updateStatus('RESUMING');
  }

  /**
   * Mark as error
   */
  markAsError(errorMessage: string): TeamEnvironmentModel {
    const updated = this.updateStatus('ERROR', errorMessage);
    updated.data.health = 'unhealthy';
    return updated;
  }

  /**
   * Start deletion
   */
  startDeletion(): TeamEnvironmentModel {
    return this.updateStatus('DELETING');
  }

  /**
   * Mark as deleted
   */
  markAsDeleted(): TeamEnvironmentModel {
    return this.updateStatus('DELETED');
  }

  /**
   * Update reconciliation timestamp
   */
  updateReconciliation(health: 'healthy' | 'degraded' | 'unhealthy'): TeamEnvironmentModel {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt: _c, updatedAt: _u, ...rest } = this.data;
    const model = new TeamEnvironmentModel({ ...rest, status: this.data.status });
    model.data = { ...this.data };
    model.data.lastReconciled = new Date();
    model.data.health = health;
    model.data.updatedAt = new Date();
    return model;
  }

  /**
   * Check if environment is ready
   */
  isReady(): boolean {
    return this.data.status === 'READY';
  }

  /**
   * Check if environment is paused
   */
  isPaused(): boolean {
    return this.data.status === 'PAUSED';
  }

  /**
   * Check if environment has error
   */
  hasError(): boolean {
    return this.data.status === 'ERROR';
  }

  /**
   * Check if environment is deleted
   */
  isDeleted(): boolean {
    return this.data.status === 'DELETED';
  }

  /**
   * Check if environment can be modified
   */
  canModify(): boolean {
    return this.data.status === 'READY' || this.data.status === 'ERROR';
  }

  /**
   * Calculate progress percentage
   */
  getProgress(): number {
    const statusProgress: Record<TeamEnvironmentStatus, number> = {
      REQUESTED: 0,
      VALIDATING: 10,
      CREATING: 50,
      READY: 100,
      UPDATING: 75,
      PAUSED: 100,
      PAUSING: 90,
      RESUMING: 50,
      ERROR: 0,
      DELETING: 50,
      DELETED: 100,
    };
    return statusProgress[this.data.status];
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage(): string {
    const messages: Record<TeamEnvironmentStatus, string> = {
      REQUESTED: 'Environment requested, waiting for validation...',
      VALIDATING: 'Validating environment configuration...',
      CREATING: 'Creating AWS resources...',
      READY: 'Environment is ready and healthy',
      UPDATING: 'Updating environment configuration...',
      PAUSED: 'Environment is paused (scaled to zero)',
      PAUSING: 'Pausing environment...',
      RESUMING: 'Resuming environment...',
      ERROR: this.data.errorMessage || 'Environment error',
      DELETING: 'Deleting environment resources...',
      DELETED: 'Environment has been deleted',
    };
    return messages[this.data.status];
  }

  /**
   * Get the underlying data
   */
  toJSON(): TeamEnvironment {
    return { ...this.data };
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data: TeamEnvironment): TeamEnvironmentModel {
    const { createdAt, updatedAt, status, lastReconciled, ...rest } = data;
    const model = new TeamEnvironmentModel({ ...rest, status });
    model.data.createdAt = new Date(createdAt);
    model.data.updatedAt = new Date(updatedAt);
    if (lastReconciled) {
      model.data.lastReconciled = new Date(lastReconciled);
    }
    return model;
  }
}
