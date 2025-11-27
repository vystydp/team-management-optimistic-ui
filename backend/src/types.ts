// Shared types matching frontend domain models
export type TeamEnvironmentStatus = 
  | 'CREATING' 
  | 'READY' 
  | 'PAUSED' 
  | 'PAUSING' 
  | 'RESUMING' 
  | 'ERROR' 
  | 'DELETING';

export interface TeamEnvironment {
  id: string;
  name: string;
  teamId: string;
  templateType: 'sandbox' | 'development' | 'staging' | 'production';
  status: TeamEnvironmentStatus;
  size: 'small' | 'medium' | 'large';
  awsAccountId?: string;
  ttlDays?: number;
  createdAt: string;
  updatedAt: string;
  enableDatabase: boolean;
  databaseEngine?: 'postgres' | 'mysql';
  enableCache: boolean;
  // Crossplane-specific fields
  databaseReady?: boolean;
  cacheReady?: boolean;
  apiReady?: boolean;
  databaseHost?: string;
  cacheHost?: string;
  apiUrl?: string;
  errorMessage?: string;
}

export interface CreateEnvironmentRequest {
  name: string;
  teamId: string;
  templateType: 'sandbox' | 'development' | 'staging' | 'production';
  size?: 'small' | 'medium' | 'large';
  ttlDays?: number;
  enableDatabase?: boolean;
  databaseEngine?: 'postgres' | 'mysql';
  enableCache?: boolean;
}

export interface UpdateEnvironmentRequest {
  status?: TeamEnvironmentStatus;
  size?: 'small' | 'medium' | 'large';
}

export interface EnvironmentListResponse {
  environments: TeamEnvironment[];
  total: number;
}
