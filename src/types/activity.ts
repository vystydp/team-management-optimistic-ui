/**
 * Activity Feed Types
 * Unified event logging for user actions and system events
 */

export type ActivityEventType =
  | 'team.member.added'
  | 'team.member.updated'
  | 'team.member.removed'
  | 'environment.created'
  | 'environment.updated'
  | 'environment.scaled'
  | 'environment.cloned'
  | 'environment.paused'
  | 'environment.resumed'
  | 'environment.deleted'
  | 'aws.account.requested'
  | 'aws.account.approved'
  | 'aws.account.rejected'
  | 'aws.account.provisioning'
  | 'aws.account.active'
  | 'aws.account.failed'
  | 'crossplane.reconcile'
  | 'crossplane.error'
  | 'system.startup'
  | 'system.shutdown';

export type ActivityResourceType = 
  | 'team_member'
  | 'environment'
  | 'aws_account'
  | 'crossplane_resource'
  | 'system';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityEventType;
  resourceType: ActivityResourceType;
  resourceId: string;
  resourceName: string;
  actor: {
    id: string;
    name: string;
    email?: string;
  };
  action: string; // Human-readable action description
  metadata?: Record<string, any>; // Additional context
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface ActivityFeedFilters {
  resourceType?: ActivityResourceType;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ActivityFeedResponse {
  events: ActivityEvent[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
