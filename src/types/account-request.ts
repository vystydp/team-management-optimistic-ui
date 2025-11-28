/**
 * Account Request - represents a request to create a new AWS account
 * Matches backend AccountRequest interface
 */
export interface AccountRequest {
  id: string;
  userId: string;
  status: AccountRequestStatus;
  
  // User inputs
  accountName: string;
  ownerEmail: string;
  purpose: 'development' | 'staging' | 'production';
  primaryRegion: string;
  
  // Optional guardrail settings
  budgetAmountUSD?: number;
  budgetThresholdPercent?: number;
  allowedRegions?: string[];
  
  // Provisioning details (set during workflow)
  awsAccountId?: string;
  awsRequestId?: string;
  guardrailClaimName?: string;
  defaultEnvironmentId?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

/**
 * Account Request status lifecycle
 */
export type AccountRequestStatus = 
  | 'REQUESTED'     // Initial submission, queued for processing
  | 'VALIDATING'    // Pre-flight checks (uniqueness, quotas, permissions)
  | 'CREATING'      // AWS Organizations CreateAccount in progress
  | 'GUARDRAILING'  // Applying CloudTrail, Config, Budgets, SCPs
  | 'READY'         // Account fully provisioned and secured
  | 'FAILED';       // Error occurred, see errorMessage

/**
 * Input for creating a new account request
 */
export interface CreateAccountRequestInput {
  accountName: string;
  ownerEmail: string;
  purpose: 'development' | 'staging' | 'production';
  primaryRegion: string;
  budgetAmountUSD?: number;
  budgetThresholdPercent?: number;
  allowedRegions?: string[];
}

/**
 * Response from listing account requests
 */
export interface ListAccountRequestsResponse {
  requests: AccountRequest[];
  total: number;
}

/**
 * Helper to get user-friendly status labels
 */
export const getStatusLabel = (status: AccountRequestStatus): string => {
  const labels: Record<AccountRequestStatus, string> = {
    REQUESTED: 'Requested',
    VALIDATING: 'Validating',
    CREATING: 'Creating Account',
    GUARDRAILING: 'Applying Guardrails',
    READY: 'Ready',
    FAILED: 'Failed',
  };
  return labels[status];
};

/**
 * Helper to get status progress (0-100)
 */
export const getStatusProgress = (status: AccountRequestStatus): number => {
  const progress: Record<AccountRequestStatus, number> = {
    REQUESTED: 10,
    VALIDATING: 25,
    CREATING: 50,
    GUARDRAILING: 75,
    READY: 100,
    FAILED: 100,
  };
  return progress[status];
};

/**
 * Helper to check if status is terminal
 */
export const isTerminalStatus = (status: AccountRequestStatus): boolean => {
  return status === 'READY' || status === 'FAILED';
};

/**
 * Helper to get status color for UI
 */
export const getStatusColor = (status: AccountRequestStatus): string => {
  const colors: Record<AccountRequestStatus, string> = {
    REQUESTED: 'blue',
    VALIDATING: 'blue',
    CREATING: 'yellow',
    GUARDRAILING: 'yellow',
    READY: 'green',
    FAILED: 'red',
  };
  return colors[status];
};

/**
 * AWS regions available for selection
 */
export const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
] as const;

/**
 * Purpose options for account creation
 */
export const ACCOUNT_PURPOSES = [
  { value: 'development', label: 'Development', description: 'For development and testing workloads' },
  { value: 'staging', label: 'Staging', description: 'For pre-production testing and validation' },
  { value: 'production', label: 'Production', description: 'For production workloads and customer-facing services' },
] as const;
