/**
 * AWS Account Reference Types
 */

export type AwsAccountType = 'linked' | 'managed';

export type AwsAccountStatus = 'linked' | 'guardrailing' | 'guardrailed' | 'error';

export interface AwsAccountRef {
  id: string;
  accountId: string; // AWS 12-digit account ID
  accountName: string;
  roleArn: string; // Cross-account role ARN for Crossplane
  type: AwsAccountType; // linked (user owns) or managed (created by us)
  status: AwsAccountStatus;
  ownerEmail: string;
  createdAt: Date;
  updatedAt: Date;
  errorMessage?: string;
  tags?: Record<string, string>;
}

export type AccountRequestStatus = 'REQUESTED' | 'VALIDATING' | 'CREATING' | 'GUARDRAILING' | 'READY' | 'FAILED';

export interface AccountRequest {
  id: string;
  requestedBy: string; // User ID
  accountName: string;
  accountEmail: string;
  purpose: string;
  region: string;
  status: AccountRequestStatus;
  awsAccountId?: string; // Set when account is created
  awsAccountRef?: AwsAccountRef; // Set when fully ready
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  ttl?: Date; // Optional time-to-live for temporary accounts
  estimatedCostPerMonth?: number;
}

/**
 * Environment Types
 */

export type EnvironmentType = 'sandbox' | 'development' | 'staging' | 'production';

export type EnvironmentSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface EnvironmentParameters {
  size: EnvironmentSize;
  region: string;
  ttl?: Date; // Auto-delete after this date
  enableAutoScaling?: boolean;
  minInstances?: number;
  maxInstances?: number;
  enableMonitoring?: boolean;
  enableBackups?: boolean;
  customTags?: Record<string, string>;
}

export interface EnvironmentTemplate {
  id: string;
  name: string;
  description: string;
  type: EnvironmentType;
  version: string;
  parameters: Partial<EnvironmentParameters>;
  allowedRegions: string[];
  allowedSizes: EnvironmentSize[];
  estimatedCost: {
    hourly: number;
    monthly: number;
  };
  resources: string[]; // List of AWS resources (VPC, ECS, RDS, etc.)
  icon?: string;
  tags: string[];
}

export type TeamEnvironmentStatus = 
  | 'REQUESTED' 
  | 'VALIDATING' 
  | 'CREATING' 
  | 'READY' 
  | 'UPDATING' 
  | 'PAUSED' 
  | 'PAUSING'
  | 'RESUMING'
  | 'ERROR' 
  | 'DELETING' 
  | 'DELETED';

export interface TeamEnvironment {
  id: string;
  name: string;
  teamId: string;
  templateId: string;
  template?: EnvironmentTemplate; // Populated when fetched
  awsAccountId: string;
  awsAccount?: AwsAccountRef; // Populated when fetched
  parameters: EnvironmentParameters;
  status: TeamEnvironmentStatus;
  health?: 'healthy' | 'degraded' | 'unhealthy';
  resourcesProvisioned: string[]; // List of actual AWS resource IDs
  endpoints?: Record<string, string>; // Service endpoints (API, DB, etc.)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  lastReconciled?: Date; // When Crossplane last reconciled
  errorMessage?: string;
  costToDate?: number;
  estimatedMonthlyCost?: number;
}

/**
 * Activity/Event Types for Audit Trail
 */

export type ActivityType = 
  | 'team.created'
  | 'team.updated'
  | 'team.deleted'
  | 'member.added'
  | 'member.removed'
  | 'member.updated'
  | 'aws.account.linked'
  | 'aws.account.requested'
  | 'aws.account.created'
  | 'aws.account.guardrailed'
  | 'aws.account.error'
  | 'environment.requested'
  | 'environment.created'
  | 'environment.updated'
  | 'environment.paused'
  | 'environment.resumed'
  | 'environment.deleted'
  | 'environment.error';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  resourceType: 'team' | 'member' | 'aws-account' | 'environment';
  resourceId: string;
  resourceName: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}
