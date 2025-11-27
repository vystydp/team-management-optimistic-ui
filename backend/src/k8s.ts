import * as k8s from '@kubernetes/client-node';

// Initialize Kubernetes client
const kc = new k8s.KubeConfig();

try {
  // Load from default kubeconfig (~/.kube/config)
  kc.loadFromDefault();
  console.log('✅ Loaded kubeconfig from default location');

  // Set context if specified in env
  const context = process.env.KUBE_CONTEXT;
  if (context) {
    kc.setCurrentContext(context);
    console.log(`✅ Set context to: ${context}`);
  }

  const currentContext = kc.getCurrentContext();
  console.log(`📌 Current context: ${currentContext}`);
  
  const cluster = kc.getCurrentCluster();
  console.log(`🔗 Cluster server: ${cluster?.server}`);
} catch (error) {
  console.error('❌ Error loading kubeconfig:', error);
  throw error;
}

export const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
export const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);
export const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

export const config = {
  crossplaneNamespace: process.env.CROSSPLANE_NAMESPACE || 'crossplane-system',
  appNamespace: process.env.APP_NAMESPACE || 'team-environments',
  helmReleaseGroup: 'helm.crossplane.io',
  helmReleaseVersion: 'v1beta1',
  helmReleasePlural: 'releases',
};

export { kc };
