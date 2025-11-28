import { v4 as uuidv4 } from 'uuid';
import { k8sCustomApi, config } from './k8s';
import type {
  TeamEnvironment,
  TeamEnvironmentStatus,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
} from './types';
import type {
  HelmRelease,
  JsonPatchOperation,
} from './types/kubernetes';
import { isK8sListResponse } from './types/kubernetes';

/**
 * Maps Helm Release status to TeamEnvironment status
 */
function mapHelmReleaseToStatus(release: HelmRelease): TeamEnvironmentStatus {
  const conditions = release.status?.conditions || [];
  const syncedCondition = conditions.find(c => c.type === 'Synced');
  const readyCondition = conditions.find(c => c.type === 'Ready');

  // Check for errors
  if (syncedCondition?.status === 'False' && syncedCondition?.reason === 'ReconcileError') {
    return 'ERROR';
  }

  // Check if ready
  if (readyCondition?.status === 'True' && syncedCondition?.status === 'True') {
    const state = release.status?.atProvider?.state;
    if (state === 'deployed') {
      return 'READY';
    }
  }

  // Check if synced but not ready yet
  if (syncedCondition?.status === 'True') {
    return 'CREATING';
  }

  // Default to creating
  return 'CREATING';
}

/**
 * Gets all environments by listing Helm Releases with our label
 */
export async function listEnvironments(): Promise<TeamEnvironment[]> {
  try {
    const response = await k8sCustomApi.listClusterCustomObject(
      config.helmReleaseGroup,
      config.helmReleaseVersion,
      config.helmReleasePlural,
      undefined,
      undefined,
      undefined,
      undefined,
      'app.porsche.com/managed-by=team-management'
    );

    const body = response.body;
    if (!isK8sListResponse<HelmRelease>(body)) {
      throw new Error('Invalid Kubernetes API response: expected list');
    }
    const releases = body.items;

    return releases.map((release: HelmRelease) => {
      const metadata = release.metadata || {};
      const labels = metadata.labels || {};
      const annotations = metadata.annotations || {};

      // Check if environment is paused (annotation-based)
      const isPaused = annotations['app.porsche.com/paused'] === 'true';
      
      let status = mapHelmReleaseToStatus(release);
      
      // Override status if paused
      if (isPaused && status === 'READY') {
        status = 'PAUSED';
        console.log(`[listEnvironments] ${metadata.name}: Overriding to PAUSED`);
      }
      
      const errorMessage = status === 'ERROR' 
        ? release.status?.conditions?.find(c => c.type === 'Synced')?.message 
        : undefined;

      const env: TeamEnvironment = {
        id: metadata.name,
        name: annotations['app.porsche.com/environment-name'] || metadata.name,
        teamId: labels['app.porsche.com/team-id'] || 'unknown',
        templateType: (labels['app.porsche.com/template-type'] || 'development') as 'sandbox' | 'development' | 'staging' | 'production',
        status: status,
        size: (labels['app.porsche.com/size'] || 'small') as 'small' | 'medium' | 'large',
        ttlDays: annotations['app.porsche.com/ttl-days'] 
          ? parseInt(annotations['app.porsche.com/ttl-days'], 10) 
          : undefined,
        createdAt: metadata.creationTimestamp || new Date().toISOString(),
        updatedAt: metadata.creationTimestamp || new Date().toISOString(),
        enableDatabase: labels['app.porsche.com/enable-database'] === 'true',
        databaseEngine: (labels['app.porsche.com/database-engine'] || 'postgres') as 'postgres' | 'mysql',
        enableCache: labels['app.porsche.com/enable-cache'] === 'true',
        // Crossplane status
        databaseReady: release.status?.atProvider?.state === 'deployed',
        databaseHost: release.status?.atProvider?.state === 'deployed' 
          ? `${metadata.name}-postgresql.${config.appNamespace}.svc.cluster.local` 
          : undefined,
        errorMessage,
      };
      
      console.log(`[listEnvironments] ${env.id}: Returning status=${env.status}`);
      return env;
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
      // No releases found, return empty array
      return [];
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error listing environments:', message);
    throw error;
  }
}

/**
 * Gets a single environment by ID (Release name)
 */
export async function getEnvironment(id: string): Promise<TeamEnvironment | null> {
  try {
    const response = await k8sCustomApi.getClusterCustomObject(
      config.helmReleaseGroup,
      config.helmReleaseVersion,
      config.helmReleasePlural,
      id
    );

    const release = response.body as HelmRelease;
    const metadata = release.metadata || {};
    const labels = metadata.labels || {};
    const annotations = metadata.annotations || {};

    // Check if environment is paused (annotation-based)
    const isPaused = annotations['app.porsche.com/paused'] === 'true';
    
    let status = mapHelmReleaseToStatus(release);
    
    console.log(`[Debug] ${id}: isPaused=${isPaused}, baseStatus=${status}, annotations=`, annotations);
    
    // Override status if paused
    if (isPaused && status === 'READY') {
      status = 'PAUSED';
      console.log(`[Debug] ${id}: Overriding status to PAUSED`);
    }
    
    const errorMessage = status === 'ERROR' 
      ? release.status?.conditions?.find(c => c.type === 'Synced')?.message 
      : undefined;

    const env: TeamEnvironment = {
      id: metadata.name,
      name: annotations['app.porsche.com/environment-name'] || metadata.name,
      teamId: labels['app.porsche.com/team-id'] || 'unknown',
      templateType: (labels['app.porsche.com/template-type'] || 'development') as 'sandbox' | 'development' | 'staging' | 'production',
      status: status,
      size: (labels['app.porsche.com/size'] || 'small') as 'small' | 'medium' | 'large',
      ttlDays: annotations['app.porsche.com/ttl-days'] 
        ? parseInt(annotations['app.porsche.com/ttl-days'], 10) 
        : undefined,
      createdAt: metadata.creationTimestamp || new Date().toISOString(),
      updatedAt: metadata.creationTimestamp || new Date().toISOString(),
      enableDatabase: labels['app.porsche.com/enable-database'] === 'true',
      databaseEngine: (labels['app.porsche.com/database-engine'] || 'postgres') as 'postgres' | 'mysql',
      enableCache: labels['app.porsche.com/enable-cache'] === 'true',
      databaseReady: release.status?.atProvider?.state === 'deployed',
      databaseHost: release.status?.atProvider?.state === 'deployed' 
        ? `${metadata.name}-postgresql.${config.appNamespace}.svc.cluster.local` 
        : undefined,
      errorMessage,
    };
    
    console.log(`[getEnvironment] ${env.id}: Returning status=${env.status}`);
    return env;
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
      return null;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error getting environment ${id}:`, message);
    throw error;
  }
}

/**
 * Creates a new environment by creating a Helm Release for PostgreSQL
 * (and optionally Redis, but we'll start with just Postgres for simplicity)
 */
export async function createEnvironment(
  req: CreateEnvironmentRequest
): Promise<TeamEnvironment> {
  const id = `env-${uuidv4().substring(0, 8)}`;
  const size = req.size || 'small';
  const enableDatabase = req.enableDatabase !== false; // default true
  const enableCache = req.enableCache !== false; // default true
  const databaseEngine = req.databaseEngine || 'postgres';

  // Resource sizing based on size
  const resourceSizes: Record<string, { memory: string; cpu: string; limits: { memory: string; cpu: string } }> = {
    small: { memory: '256Mi', cpu: '100m', limits: { memory: '512Mi', cpu: '500m' } },
    medium: { memory: '512Mi', cpu: '200m', limits: { memory: '1Gi', cpu: '1000m' } },
    large: { memory: '1Gi', cpu: '500m', limits: { memory: '2Gi', cpu: '2000m' } },
  };

  const resources = resourceSizes[size];

  // Create Helm Release for PostgreSQL
  const helmRelease = {
    apiVersion: `${config.helmReleaseGroup}/${config.helmReleaseVersion}`,
    kind: 'Release',
    metadata: {
      name: id,
      // Note: Helm Releases are cluster-scoped resources, no namespace in metadata
      labels: {
        'app.porsche.com/managed-by': 'team-management',
        'app.porsche.com/team-id': req.teamId,
        'app.porsche.com/template-type': req.templateType,
        'app.porsche.com/size': size,
        'app.porsche.com/enable-database': enableDatabase.toString(),
        'app.porsche.com/database-engine': databaseEngine,
        'app.porsche.com/enable-cache': enableCache.toString(),
      },
      annotations: {
        'app.porsche.com/environment-name': req.name,
        ...(req.ttlDays && { 'app.porsche.com/ttl-days': req.ttlDays.toString() }),
      },
    },
    spec: {
      providerConfigRef: {
        name: 'default',
      },
      forProvider: {
        chart: {
          name: 'postgresql',
          repository: 'https://charts.bitnami.com/bitnami',
          version: '13.2.24',
        },
        namespace: config.appNamespace,
        skipCreateNamespace: true,
        values: {
          auth: {
            enablePostgresUser: true,
            postgresPassword: 'dev-password', // TODO: Use secrets in production
          },
          primary: {
            resources: {
              requests: {
                memory: resources.memory,
                cpu: resources.cpu,
              },
              limits: {
                memory: resources.limits.memory,
                cpu: resources.limits.cpu,
              },
            },
          },
        },
      },
    },
  };

  try {
    console.log(`Creating Helm Release: ${id} (cluster-scoped resource)`);
    console.log(`Helm Release spec:`, JSON.stringify(helmRelease, null, 2));

    const _response = await k8sCustomApi.createClusterCustomObject(
      config.helmReleaseGroup,
      config.helmReleaseVersion,
      config.helmReleasePlural,
      helmRelease
    );

    console.log(`✅ Created Helm Release: ${id}`);

    // Return initial environment with CREATING status
    return {
      id,
      name: req.name,
      teamId: req.teamId,
      templateType: req.templateType,
      status: 'CREATING',
      size,
      ttlDays: req.ttlDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enableDatabase,
      databaseEngine,
      enableCache,
      databaseReady: false,
      cacheReady: false,
      apiReady: false,
    };
  } catch (error) {
    console.error('❌ Error creating environment:', error);
    if (error && typeof error === 'object') {
      const err = error as { message?: string; statusCode?: number; body?: unknown };
      console.error('Error details:', {
        message: err.message,
        statusCode: err.statusCode,
        body: err.body,
      });
    }
    throw error;
  }
}

/**
 * Updates an environment (e.g., change size, pause/resume)
 */
export async function updateEnvironment(
  id: string,
  updates: UpdateEnvironmentRequest
): Promise<TeamEnvironment | null> {
  try {
    const existing = await getEnvironment(id);
    if (!existing) {
      return null;
    }

    const patches: JsonPatchOperation[] = [];

    // Handle status updates (pause/resume)
    if (updates.status) {
      console.log(`[Environment] Updating status for ${id}: ${existing.status} → ${updates.status}`);
      
      if (updates.status === 'PAUSED') {
        // Pause: Scale replicas to 0
        patches.push({
          op: 'replace',
          path: '/spec/forProvider/values/primary/replicaCount',
          value: 0,
        });
        patches.push({
          op: 'replace',
          path: '/metadata/annotations/app.porsche.com~1paused',
          value: 'true',
        });
        patches.push({
          op: 'replace',
          path: '/metadata/annotations/app.porsche.com~1paused-at',
          value: new Date().toISOString(),
        });
      } else if (updates.status === 'READY' && existing.status === 'PAUSED') {
        // Resume: Scale replicas back to 1
        patches.push({
          op: 'replace',
          path: '/spec/forProvider/values/primary/replicaCount',
          value: 1,
        });
        patches.push({
          op: 'remove',
          path: '/metadata/annotations/app.porsche.com~1paused',
        });
        patches.push({
          op: 'replace',
          path: '/metadata/annotations/app.porsche.com~1resumed-at',
          value: new Date().toISOString(),
        });
      }
    }

    // Handle size updates
    if (updates.size) {
      console.log(`[Environment] Updating size for ${id}: ${existing.size} → ${updates.size}`);
      
      const resourceSizes: Record<string, { memory: string; cpu: string; limits: { memory: string; cpu: string } }> = {
        small: { memory: '256Mi', cpu: '100m', limits: { memory: '512Mi', cpu: '500m' } },
        medium: { memory: '512Mi', cpu: '200m', limits: { memory: '1Gi', cpu: '1000m' } },
        large: { memory: '1Gi', cpu: '500m', limits: { memory: '2Gi', cpu: '2000m' } },
      };

      const resources = resourceSizes[updates.size];

      patches.push({
        op: 'replace',
        path: '/metadata/labels/app.porsche.com~1size',
        value: updates.size,
      });
      patches.push({
        op: 'replace',
        path: '/spec/forProvider/values/primary/resources',
        value: {
          requests: {
            memory: resources.memory,
            cpu: resources.cpu,
          },
          limits: {
            memory: resources.limits.memory,
            cpu: resources.limits.cpu,
          },
        },
      });
    }

    // Apply patches if any
    if (patches.length > 0) {
      await k8sCustomApi.patchClusterCustomObject(
        config.helmReleaseGroup,
        config.helmReleaseVersion,
        config.helmReleasePlural,
        id,
        patches,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/json-patch+json' } }
      );
      
      console.log(`[Environment] Successfully applied ${patches.length} patch(es) to ${id}`);
      
      // Wait for Kubernetes to process the patch (especially for status changes)
      if (updates.status) {
        const targetStatus = updates.status;
        let consecutiveMatches = 0;
        const requiredMatches = 2; // Need 2 consecutive matches to confirm
        let retries = 0;
        const maxRetries = 8;
        
        // Poll until status is stable (multiple consecutive matches)
        while (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 400));
          const current = await getEnvironment(id);
          
          if (current && current.status === targetStatus) {
            consecutiveMatches++;
            if (consecutiveMatches >= requiredMatches) {
              console.log(`[Environment] Status confirmed as ${targetStatus} after ${retries + 1} attempts`);
              return current;
            }
          } else {
            consecutiveMatches = 0; // Reset if status doesn't match
          }
          
          retries++;
        }
        
        console.log(`[Environment] Status change timeout, returning current state`);
      }
    }

    // Return updated environment
    return await getEnvironment(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error updating environment ${id}:`, message);
    throw error;
  }
}

/**
 * Deletes an environment by deleting the Helm Release
 */
export async function deleteEnvironment(id: string): Promise<boolean> {
  try {
    await k8sCustomApi.deleteClusterCustomObject(
      config.helmReleaseGroup,
      config.helmReleaseVersion,
      config.helmReleasePlural,
      id
    );
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) {
      return false;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error deleting environment ${id}:`, message);
    throw error;
  }
}
