// Quick test script to verify K8s connection
import * as k8s from '@kubernetes/client-node';

async function testK8sConnection(): Promise<void> {
  const kc = new k8s.KubeConfig();

  try {
    kc.loadFromDefault();
    console.log('✅ Loaded kubeconfig');

  const context = 'kind-team-mgmt-local';
  kc.setCurrentContext(context);
  console.log(`✅ Set context to: ${context}`);

  const currentContext = kc.getCurrentContext();
  console.log(`📌 Current context: ${currentContext}`);

  const cluster = kc.getCurrentCluster();
  console.log(`🔗 Cluster server: ${cluster?.server}`);

  // Test creating a custom object
  const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);

  const testRelease = {
    apiVersion: 'helm.crossplane.io/v1beta1',
    kind: 'Release',
    metadata: {
      name: 'test-connection',
      // Helm Releases are cluster-scoped, no namespace in metadata
    },
    spec: {
      providerConfigRef: { name: 'default' },
      forProvider: {
        chart: {
          name: 'postgresql',
          repository: 'https://charts.bitnami.com/bitnami',
          version: '13.2.24',
        },
        namespace: 'team-environments',
        skipCreateNamespace: true,
        values: {
          auth: {
            enablePostgresUser: true,
            postgresPassword: 'test',
          },
        },
      },
    },
  };

  console.log('\n🔄 Attempting to create test Helm Release...');
  
  const response = await k8sCustomApi.createClusterCustomObject(
    'helm.crossplane.io',
    'v1beta1',
    'releases',
    testRelease
  );

  console.log('✅ SUCCESS! Created test Helm Release');
  console.log('Response:', JSON.stringify(response.body, null, 2));

  // Clean up
  console.log('\n🧹 Cleaning up test release...');
  await k8sCustomApi.deleteClusterCustomObject(
    'helm.crossplane.io',
    'v1beta1',
    'releases',
    'test-connection'
  );
  console.log('✅ Cleaned up');

} catch (error) {
  const err = error as Error & { body?: unknown; response?: unknown };
  console.error('❌ Error:', err.message);
  if (error.body) {
    console.error('Response body:', JSON.stringify(error.body, null, 2));
  }
  if (error.response) {
    console.error('Response:', error.response);
  }
  process.exit(1);
  }
}

testK8sConnection();
