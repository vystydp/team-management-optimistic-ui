/**
 * Kubernetes API Type Definitions
 * Types for Helm Releases and related Crossplane resources
 */

export type ConditionStatus = 'True' | 'False' | 'Unknown';

export type ConditionType = 'Synced' | 'Ready';

export interface KubernetesCondition {
  type: ConditionType;
  status: ConditionStatus;
  reason?: string;
  message?: string;
  lastTransitionTime: string;
  observedGeneration?: number;
}

export interface HelmReleaseAtProvider {
  state?: 'deployed' | 'pending' | 'failed' | 'superseded' | 'uninstalling' | 'uninstalled';
  revision?: number;
  releaseDescription?: string;
}

export interface HelmReleaseStatus {
  conditions?: KubernetesCondition[];
  atProvider?: HelmReleaseAtProvider;
  observedGeneration?: number;
}

export interface KubernetesMetadata {
  name: string;
  namespace: string;
  uid?: string;
  resourceVersion?: string;
  generation?: number;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface HelmReleaseSpec {
  forProvider: {
    chart: {
      name: string;
      repository?: string;
      version?: string;
    };
    namespace: string;
    values?: Record<string, unknown>;
  };
  providerConfigRef?: {
    name: string;
  };
}

export interface HelmRelease {
  apiVersion: string;
  kind: string;
  metadata: KubernetesMetadata;
  spec: HelmReleaseSpec;
  status?: HelmReleaseStatus;
}

export interface K8sListMetadata {
  resourceVersion: string;
  continue?: string;
  remainingItemCount?: number;
}

export interface K8sListResponse<T> {
  apiVersion: string;
  kind: string;
  metadata: K8sListMetadata;
  items: T[];
}

export interface K8sCustomObjectResponse {
  response: {
    statusCode: number;
    body: unknown;
  };
  body: HelmRelease | K8sListResponse<HelmRelease>;
}

/**
 * JSON Patch operation for Kubernetes resources
 */
export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: unknown;
  from?: string;
}

/**
 * Type guard to check if a response is a list
 */
export function isK8sListResponse<T>(obj: unknown): obj is K8sListResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'items' in obj &&
    Array.isArray((obj as { items: unknown }).items)
  );
}

/**
 * Type guard to check if a response is a single resource
 */
export function isHelmRelease(obj: unknown): obj is HelmRelease {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'apiVersion' in obj &&
    'kind' in obj &&
    'metadata' in obj &&
    (obj as { kind: string }).kind === 'Release'
  );
}
