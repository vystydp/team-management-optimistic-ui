/**
 * Activity Logging Service
 * Tracks all user actions and system events for the activity feed
 */

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  actor: {
    id: string;
    name: string;
    email?: string;
  };
  action: string;
  metadata?: Record<string, any>;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

interface ActivityFilters {
  resourceType?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

class ActivityService {
  private events: ActivityEvent[] = [];

  /**
   * Log a new activity event
   */
  logEvent(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
    const newEvent: ActivityEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.events.unshift(newEvent); // Add to beginning for reverse chronological
    
    // Keep only last 1000 events in memory (in production, this would be database)
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }

    return newEvent;
  }

  /**
   * Get paginated activity feed
   */
  getActivityFeed(
    page: number = 1,
    pageSize: number = 20,
    filters?: ActivityFilters
  ): {
    events: ActivityEvent[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  } {
    let filtered = [...this.events];

    // Apply filters
    if (filters) {
      if (filters.resourceType) {
        filtered = filtered.filter(e => e.resourceType === filters.resourceType);
      }
      if (filters.actorId) {
        filtered = filtered.filter(e => e.actor.id === filters.actorId);
      }
      if (filters.startDate) {
        filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(e =>
          e.action.toLowerCase().includes(searchLower) ||
          e.resourceName.toLowerCase().includes(searchLower) ||
          e.actor.name.toLowerCase().includes(searchLower)
        );
      }
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const events = filtered.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    return {
      events,
      total,
      page,
      pageSize,
      hasMore,
    };
  }

  /**
   * Get all events (for testing/debugging)
   */
  getAllEvents(): ActivityEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events (for testing)
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Initialize with some mock events for demo
   */
  initializeMockEvents(): void {
    const mockUser = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    // Add some historical events
    const now = Date.now();
    
    // System startup
    this.events.push({
      id: 'evt-init-1',
      timestamp: new Date(now - 3600000).toISOString(), // 1 hour ago
      type: 'system.startup',
      resourceType: 'system',
      resourceId: 'system',
      resourceName: 'CloudOps Platform',
      actor: { id: 'system', name: 'System' },
      action: 'Platform initialized successfully',
    });

    // Team member added
    this.events.push({
      id: 'evt-team-1',
      timestamp: new Date(now - 3000000).toISOString(), // 50 min ago
      type: 'team.member.added',
      resourceType: 'team_member',
      resourceId: 'member-1',
      resourceName: 'Alice Smith',
      actor: mockUser,
      action: 'Added team member Alice Smith',
      metadata: { role: 'Developer', email: 'alice@example.com' },
    });

    // Environment created
    this.events.push({
      id: 'evt-env-1',
      timestamp: new Date(now - 2400000).toISOString(), // 40 min ago
      type: 'environment.created',
      resourceType: 'environment',
      resourceId: 'env-dev-001',
      resourceName: 'Development Environment',
      actor: mockUser,
      action: 'Created development environment',
      metadata: { template: 'Development', size: 'medium', region: 'us-east-1' },
    });

    // Environment scaled
    this.events.push({
      id: 'evt-env-2',
      timestamp: new Date(now - 1800000).toISOString(), // 30 min ago
      type: 'environment.scaled',
      resourceType: 'environment',
      resourceId: 'env-dev-001',
      resourceName: 'Development Environment',
      actor: mockUser,
      action: 'Scaled environment from medium to large',
      changes: [
        { field: 'size', oldValue: 'medium', newValue: 'large' },
      ],
    });

    // AWS Account requested
    this.events.push({
      id: 'evt-aws-1',
      timestamp: new Date(now - 1200000).toISOString(), // 20 min ago
      type: 'aws.account.requested',
      resourceType: 'aws_account',
      resourceId: 'req-aws-001',
      resourceName: 'Production Account Request',
      actor: mockUser,
      action: 'Requested new AWS account for production',
      metadata: { accountName: 'Prod Account', environment: 'production' },
    });

    // Environment cloned
    this.events.push({
      id: 'evt-env-3',
      timestamp: new Date(now - 600000).toISOString(), // 10 min ago
      type: 'environment.cloned',
      resourceType: 'environment',
      resourceId: 'env-staging-001',
      resourceName: 'Staging Environment',
      actor: mockUser,
      action: 'Cloned Development Environment to Staging Environment',
      metadata: { sourceId: 'env-dev-001', sourceName: 'Development Environment' },
    });

    // Crossplane reconcile
    this.events.push({
      id: 'evt-xp-1',
      timestamp: new Date(now - 300000).toISOString(), // 5 min ago
      type: 'crossplane.reconcile',
      resourceType: 'crossplane_resource',
      resourceId: 'xr-helm-release-1',
      resourceName: 'helm-release-app',
      actor: { id: 'crossplane', name: 'Crossplane Controller' },
      action: 'Successfully reconciled Helm release',
      metadata: { status: 'SYNCED', ready: true },
    });

    // Environment paused
    this.events.push({
      id: 'evt-env-4',
      timestamp: new Date(now - 60000).toISOString(), // 1 min ago
      type: 'environment.paused',
      resourceType: 'environment',
      resourceId: 'env-dev-001',
      resourceName: 'Development Environment',
      actor: mockUser,
      action: 'Paused development environment to save costs',
    });
  }
}

// Singleton instance
export const activityService = new ActivityService();

// Initialize with mock data
activityService.initializeMockEvents();
