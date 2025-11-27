import { v4 as uuidv4 } from 'uuid';
import { k8sCustomApi, config } from './k8s';
import type {
  TeamEnvironment,
  TeamEnvironmentStatus,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
} from './types';

/**
 * Maps Helm Release status to TeamEnvironment status
 */
function mapHelmReleaseToStatus(release: any): TeamEnvironmentStatus {
  const conditions = release.status?.conditions || [];
  const syncedCondition = conditions.find((c: any) => c.type === 'Synced');
  const readyCondition = conditions.find((c: any) => c.type === 'Ready');

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

    const releases = (response.body as any).items || [];

    return releases.map((release: any) => {
      const metadata = release.metadata || {};
      const labels = metadata.labels || {};
      const annotations = metadata.annotations || {};

      const status = mapHelmReleaseToStatus(release);
      const errorMessage = status === 'ERROR' 
        ? release.status?.conditions?.find((c: any) => c.type === 'Synced')?.message 
        : undefined;

      return {
        id: metadata.name,
        name: annotations['app.porsche.com/environment-name'] || metadata.name,
        teamId: labels['app.porsche.com/team-id'] || 'unknown',
        templateType: (labels['app.porsche.com/template-type'] || 'development') as any,
        status,
        size: (labels['app.porsche.com/size'] || 'small') as any,
        ttlDays: annotations['app.porsche.com/ttl-days'] 
          ? parseInt(annotations['app.porsche.com/ttl-days'], 10) 
          : undefined,
        createdAt: metadata.creationTimestamp,
        updatedAt: metadata.creationTimestamp,
        enableDatabase: labels['app.porsche.com/enable-database'] === 'true',
        databaseEngine: (labels['app.porsche.com/database-engine'] || 'postgres') as any,
        enableCache: labels['app.porsche.com/enable-cache'] === 'true',
        // Crossplane status
        databaseReady: release.status?.atProvider?.state === 'deployed',
        databaseHost: release.status?.atProvider?.state === 'deployed' 
          ? `${metadata.name}-postgresql.${config.appNamespace}.svc.cluster.local` 
          : undefined,
        errorMessage,
      } as TeamEnvironment;
    });
  } catch (error: any) {
    if (error.statusCode === 404) {
      // No releases found, return empty array
      return [];
    }
    console.error('Error listing environments:', error);
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

    const release = response.body as any;
    const metadata = release.metadata || {};
    const labels = metadata.labels || {};
    const annotations = metadata.annotations || {};

    const status = mapHelmReleaseToStatus(release);
    const errorMessage = status === 'ERROR' 
      ? release.status?.conditions?.find((c: any) => c.type === 'Synced')?.message 
      : undefined;

    return {
      id: metadata.name,
      name: annotations['app.porsche.com/environment-name'] || metadata.name,
      teamId: labels['app.porsche.com/team-id'] || 'unknown',
      templateType: (labels['app.porsche.com/template-type'] || 'development') as any,
      status,
      size: (labels['app.porsche.com/size'] || 'small') as any,
      ttlDays: annotations['app.porsche.com/ttl-days'] 
        ? parseInt(annotations['app.porsche.com/ttl-days'], 10) 
        : undefined,
      createdAt: metadata.creationTimestamp,
      updatedAt: metadata.creationTimestamp,
      enableDatabase: labels['app.porsche.com/enable-database'] === 'true',
      databaseEngine: (labels['app.porsche.com/database-engine'] || 'postgres') as any,
      enableCache: labels['app.porsche.com/enable-cache'] === 'true',
      databaseReady: release.status?.atProvider?.state === 'deployed',
      databaseHost: release.status?.atProvider?.state === 'deployed' 
        ? `${metadata.name}-postgresql.${config.appNamespace}.svc.cluster.local` 
        : undefined,
      errorMessage,
    } as TeamEnvironment;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    console.error(`Error getting environment ${id}:`, error);
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

    const response = await k8sCustomApi.createClusterCustomObject(
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
  } catch (error: any) {
    console.error('❌ Error creating environment:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
    });
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

    // For now, we'll support size updates by patching the Helm Release values
    if (updates.size) {
      const resourceSizes: Record<string, { memory: string; cpu: string; limits: { memory: string; cpu: string } }> = {
        small: { memory: '256Mi', cpu: '100m', limits: { memory: '512Mi', cpu: '500m' } },
        medium: { memory: '512Mi', cpu: '200m', limits: { memory: '1Gi', cpu: '1000m' } },
        large: { memory: '1Gi', cpu: '500m', limits: { memory: '2Gi', cpu: '2000m' } },
      };

      const resources = resourceSizes[updates.size];

      const patch = [
        {
          op: 'replace',
          path: '/metadata/labels/app.porsche.com~1size',
          value: updates.size,
        },
        {
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
        },
      ];

      await k8sCustomApi.patchClusterCustomObject(
        config.helmReleaseGroup,
        config.helmReleaseVersion,
        config.helmReleasePlural,
        id,
        patch,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/json-patch+json' } }
      );
    }

    // Return updated environment
    return await getEnvironment(id);
  } catch (error) {
    console.error(`Error updating environment ${id}:`, error);
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
  } catch (error: any) {
    if (error.statusCode === 404) {
      return false;
    }
    console.error(`Error deleting environment ${id}:`, error);
    throw error;
  }
}
