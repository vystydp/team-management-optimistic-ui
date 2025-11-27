import { TeamMember, OptimisticUpdate } from '../types/team';

/**
 * Domain model for TeamMember with business logic and validation
 */
export class TeamMemberModel {
  private data: TeamMember;

  constructor(data: TeamMember) {
    this.data = data;
    this.validate();
  }

  /**
   * Validates team member data
   */
  private validate(): void {
    if (!this.data.name || this.data.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!this.isValidEmail(this.data.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.data.role || this.data.role.trim().length === 0) {
      throw new Error('Role is required');
    }

    if (!this.data.department || this.data.department.trim().length === 0) {
      throw new Error('Department is required');
    }
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Returns the team member data
   */
  getData(): TeamMember {
    return { ...this.data };
  }

  /**
   * Updates team member data
   */
  update(updates: Partial<Omit<TeamMember, 'id' | 'createdAt'>>): TeamMemberModel {
    const updatedData: TeamMember = {
      ...this.data,
      ...updates,
      id: this.data.id,
      createdAt: this.data.createdAt,
      updatedAt: new Date().toISOString(),
    };

    return new TeamMemberModel(updatedData);
  }

  /**
   * Toggles the active status
   */
  toggleStatus(): TeamMemberModel {
    return this.update({
      status: this.data.status === 'active' ? 'inactive' : 'active',
    });
  }

  /**
   * Checks if member is active
   */
  isActive(): boolean {
    return this.data.status === 'active';
  }

  /**
   * Gets member's full display name
   */
  getDisplayName(): string {
    return `${this.data.name} (${this.data.role})`;
  }

  /**
   * Checks if member belongs to a department
   */
  isInDepartment(department: string): boolean {
    return this.data.department.toLowerCase() === department.toLowerCase();
  }

  /**
   * Factory method to create a new team member
   */
  static create(
    data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>
  ): TeamMemberModel {
    const now = new Date().toISOString();
    const teamMember: TeamMember = {
      ...data,
      id: `temp-${Date.now()}`, // Temporary ID for optimistic updates
      createdAt: now,
      updatedAt: now,
    };

    return new TeamMemberModel(teamMember);
  }
}

/**
 * Domain model for managing optimistic updates
 */
export class OptimisticUpdateModel<T> {
  private update: OptimisticUpdate<T>;

  constructor(update: OptimisticUpdate<T>) {
    this.update = update;
  }

  /**
   * Returns the optimistic update data
   */
  getData(): OptimisticUpdate<T> {
    return { ...this.update };
  }

  /**
   * Calculates confidence score based on various factors
   */
  calculateConfidence(
    userSuccessRate: number,
    networkCondition: 'good' | 'fair' | 'poor'
  ): number {
    let confidence = 0.95; // Base confidence

    // Adjust based on user success rate
    confidence *= userSuccessRate;

    // Adjust based on network condition
    const networkMultiplier = {
      good: 1.0,
      fair: 0.9,
      poor: 0.7,
    };
    confidence *= networkMultiplier[networkCondition];

    return Math.max(0.5, Math.min(1.0, confidence));
  }

  /**
   * Estimates error probability
   */
  estimateErrorProbability(
    operationType: 'create' | 'update' | 'delete',
    historicalFailureRate: number
  ): number {
    // Base error rates by operation type
    const baseErrorRate = {
      create: 0.05,
      update: 0.03,
      delete: 0.04,
    };

    const probability = Math.max(
      baseErrorRate[operationType],
      historicalFailureRate
    );

    return Math.min(0.5, probability);
  }

  /**
   * Checks if update is stale (older than threshold)
   */
  isStale(thresholdMs: number = 30000): boolean {
    const age = Date.now() - this.update.timestamp;
    return age > thresholdMs;
  }

  /**
   * Creates a rollback update
   */
  createRollback(): OptimisticUpdate<T> | null {
    if (!this.update.rollbackData) {
      return null;
    }

    return {
      id: `rollback-${this.update.id}`,
      type: this.update.type,
      data: this.update.rollbackData,
      timestamp: Date.now(),
      confidence: 1.0,
    };
  }

  /**
   * Factory method to create an optimistic update
   */
  static create<T>(
    type: 'create' | 'update' | 'delete',
    data: T,
    rollbackData?: T
  ): OptimisticUpdateModel<T> {
    const update: OptimisticUpdate<T> = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      confidence: 0.95,
      rollbackData,
    };

    return new OptimisticUpdateModel(update);
  }
}
