/**
 * AWS Account types for backend
 */

/**
 * AWS Account Reference - represents a linked AWS account
 */
export interface AwsAccountRef {
  id: string;
  userId: string; // Owner of this account link
  accountId: string; // 12-digit AWS account ID
  accountName: string; // Friendly name
  roleArn: string; // IAM role ARN for cross-account access
  ownerEmail: string; // Account owner email
  type: 'linked' | 'managed'; // linked = existing account, managed = Crossplane-created
  status: AwsAccountStatus;
  errorMessage?: string;
  guardrailClaimName?: string; // Name of the GuardrailedAccountClaim in K8s
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AWS Account status lifecycle
 */
export type AwsAccountStatus = 
  | 'linked'        // Account linked, role verified, no guardrails yet
  | 'guardrailing'  // GuardrailedAccountClaim created, Crossplane reconciling
  | 'guardrailed'   // All guardrails applied successfully
  | 'error';        // Validation or guardrailing failed

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
  accountId: string; // Which account to secure
}

/**
 * Response when linking an account
 */
export interface LinkAccountResponse {
  account: AwsAccountRef;
  message: string;
}

/**
 * Response when securing an account
 */
export interface SecureAccountResponse {
  account: AwsAccountRef;
  claimName: string;
  message: string;
}

/**
 * AWS STS assume role validation result
 */
export interface AssumeRoleValidation {
  success: boolean;
  accountId?: string;
  error?: string;
}

/**
 * Account Request - represents a request to create a new AWS account
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
  awsAccountId?: string; // Set after CreateAccount succeeds
  awsRequestId?: string; // AWS Organizations CreateAccountRequestId
  guardrailClaimName?: string;
  defaultEnvironmentId?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
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
