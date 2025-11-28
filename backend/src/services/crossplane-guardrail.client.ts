import * as k8s from '@kubernetes/client-node';

/**
 * GuardrailedAccountClaim specification
 */
interface GuardrailedAccountClaimSpec {
  accountId: string;
  accountName: string;
  roleArn: string;
  ownerEmail: string;
  enableCloudTrail?: boolean;
  enableConfig?: boolean;
  budgetAmountUSD?: number;
  budgetThresholdPercent?: number;
  primaryRegion?: string;
  allowedRegions?: string[];
}

/**
 * GuardrailedAccountClaim status
 */
interface GuardrailedAccountClaimStatus {
  guardrailsApplied?: boolean;
  cloudTrailStatus?: string;
  configStatus?: string;
  budgetStatus?: string;
  cloudTrailBucket?: string;
  configBucket?: string;
  budgetName?: string;
  errorMessage?: string;
  lastUpdated?: string;
  conditions?: Array<{
    type: string;
    status: string;
    reason?: string;
    message?: string;
    lastTransitionTime?: string;
  }>;
}

/**
 * GuardrailedAccountClaim custom resource
 */
interface GuardrailedAccountClaim {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: GuardrailedAccountClaimSpec;
  status?: GuardrailedAccountClaimStatus;
}

/**
 * Crossplane Client for GuardrailedAccount management operations
 */
export class CrossplaneGuardrailClient {
  private k8sApi: k8s.CustomObjectsApi;
  private namespace: string;
  
  private readonly GROUP = 'platform.porsche.com';
  private readonly VERSION = 'v1alpha1';
  private readonly PLURAL = 'guardrailedaccountclaims';

  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);
    this.namespace = process.env.APP_NAMESPACE || 'default';
  }

  /**
   * Create a GuardrailedAccountClaim
   */
  async createClaim(spec: GuardrailedAccountClaimSpec): Promise<GuardrailedAccountClaim> {
    const claimName = this.generateClaimName(spec.accountId);

    const claim: GuardrailedAccountClaim = {
      apiVersion: `${this.GROUP}/${this.VERSION}`,
      kind: 'GuardrailedAccountClaim',
      metadata: {
        name: claimName,
        namespace: this.namespace,
        labels: {
          'app.kubernetes.io/managed-by': 'team-management-platform',
          'guardrail.platform.porsche.com/account-id': spec.accountId,
        },
      },
      spec: {
        accountId: spec.accountId,
        accountName: spec.accountName,
        roleArn: spec.roleArn,
        ownerEmail: spec.ownerEmail,
        enableCloudTrail: spec.enableCloudTrail ?? true,
        enableConfig: spec.enableConfig ?? true,
        budgetAmountUSD: spec.budgetAmountUSD ?? 100,
        budgetThresholdPercent: spec.budgetThresholdPercent ?? 80,
        primaryRegion: spec.primaryRegion ?? 'us-east-1',
        allowedRegions: spec.allowedRegions ?? ['us-east-1', 'eu-west-1'],
      },
    };

    try {
      const response = await this.k8sApi.createNamespacedCustomObject(
        this.GROUP,
        this.VERSION,
        this.namespace,
        this.PLURAL,
        claim
      );

      return response.body as GuardrailedAccountClaim;
    } catch (error) {
      console.error('Failed to create GuardrailedAccountClaim:', error);
      throw new Error(`Failed to create guardrail claim: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a GuardrailedAccountClaim by name
   */
  async getClaim(claimName: string): Promise<GuardrailedAccountClaim | null> {
    try {
      const response = await this.k8sApi.getNamespacedCustomObject(
        this.GROUP,
        this.VERSION,
        this.namespace,
        this.PLURAL,
        claimName
      );

      return response.body as GuardrailedAccountClaim;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      console.error('Failed to get GuardrailedAccountClaim:', error);
      throw error;
    }
  }

  /**
   * Get a GuardrailedAccountClaim by account ID
   */
  async getClaimByAccountId(accountId: string): Promise<GuardrailedAccountClaim | null> {
    try {
      const response = await this.k8sApi.listNamespacedCustomObject(
        this.GROUP,
        this.VERSION,
        this.namespace,
        this.PLURAL,
        undefined,
        undefined,
        undefined,
        undefined,
        `guardrail.platform.porsche.com/account-id=${accountId}`
      );

      const items = (response.body as { items: GuardrailedAccountClaim[] }).items;
      return items.length > 0 ? items[0] : null;
    } catch (error) {
      console.error('Failed to list GuardrailedAccountClaims:', error);
      return null;
    }
  }

  /**
   * Delete a GuardrailedAccountClaim
   */
  async deleteClaim(claimName: string): Promise<boolean> {
    try {
      await this.k8sApi.deleteNamespacedCustomObject(
        this.GROUP,
        this.VERSION,
        this.namespace,
        this.PLURAL,
        claimName
      );

      return true;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        // Return true for 404 - the claim is already deleted (idempotent)
        return true;
      }
      console.error('Failed to delete GuardrailedAccountClaim:', error);
      throw error;
    }
  }

  /**
   * Get guardrail status from a claim
   */
  getGuardrailStatus(claim: GuardrailedAccountClaim): {
    isReady: boolean;
    status: string;
    errorMessage?: string;
  } {
    const status = claim.status;

    if (!status) {
      return { isReady: false, status: 'guardrailing' };
    }

    // Check if all guardrails are applied
    if (status.guardrailsApplied === true) {
      return { isReady: true, status: 'guardrailed' };
    }

    // Check for errors in status
    if (status.errorMessage) {
      return {
        isReady: false,
        status: 'error',
        errorMessage: status.errorMessage,
      };
    }

    // Check conditions - prioritize Synced over Ready
    // SYNCED=True means Crossplane successfully reconciled all resources
    const syncedCondition = status.conditions?.find(c => c.type === 'Synced');
    const readyCondition = status.conditions?.find(c => c.type === 'Ready');

    // If SYNCED=True, the composition has been applied successfully
    // This is the primary indicator for guardrails being in place
    if (syncedCondition?.status === 'True') {
      return { isReady: true, status: 'guardrailed' };
    }

    // If Synced=False with an error, report it
    if (syncedCondition?.status === 'False' && syncedCondition.reason === 'ReconcileError') {
      return {
        isReady: false,
        status: 'error',
        errorMessage: `Crossplane reconcile error: ${syncedCondition.message || 'Failed to reconcile guardrails'}`,
      };
    }

    // Check Ready condition as secondary signal
    if (readyCondition?.status === 'True') {
      return { isReady: true, status: 'guardrailed' };
    }

    // If Ready=False but not a hard error, still reconciling
    if (readyCondition?.status === 'False' && readyCondition.reason === 'Creating') {
      return { isReady: false, status: 'guardrailing' };
    }

    // Still in progress
    return { isReady: false, status: 'guardrailing' };
  }

  /**
   * Generate claim name from account ID
   */
  private generateClaimName(accountId: string): string {
    return `guardrailed-aws-${accountId}`;
  }

  /**
   * Check if error is a 404 Not Found
   */
  private isNotFoundError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return (error as { statusCode: number }).statusCode === 404;
    }
    return false;
  }
}

// Singleton instance
export const crossplaneGuardrailClient = new CrossplaneGuardrailClient();
