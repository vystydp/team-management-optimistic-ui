# Install Crossplane on existing Kubernetes cluster
# Works on Windows PowerShell
# Use this if you're using Docker Desktop's built-in Kubernetes

$ErrorActionPreference = "Stop"

$CROSSPLANE_NAMESPACE = "crossplane-system"
$APP_NAMESPACE = "team-environments"

Write-Host "==> Installing Crossplane on current cluster" -ForegroundColor Cyan

# Check current context
$currentContext = kubectl config current-context
Write-Host "Current context: $currentContext" -ForegroundColor Yellow

$confirmation = Read-Host "Install Crossplane on this cluster? (y/N)"
if ($confirmation -ne 'y') {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

Write-Host "`n==> Adding Crossplane Helm repo" -ForegroundColor Cyan
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update

Write-Host "`n==> Installing Crossplane" -ForegroundColor Cyan
helm install crossplane `
    --namespace $CROSSPLANE_NAMESPACE `
    --create-namespace `
    crossplane-stable/crossplane `
    --wait `
    --timeout 5m

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install Crossplane" -ForegroundColor Red
    exit 1
}

Write-Host "==> Crossplane installed successfully" -ForegroundColor Green

Write-Host "`n==> Waiting for Crossplane to be ready..." -ForegroundColor Cyan
kubectl wait --for=condition=available --timeout=300s deployment/crossplane -n $CROSSPLANE_NAMESPACE

Write-Host "`n==> Installing Crossplane providers" -ForegroundColor Cyan

# Install provider-kubernetes
kubectl apply -f - @"
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-kubernetes
spec:
  package: xpkg.upbound.io/crossplane-contrib/provider-kubernetes:v0.12.1
"@

# Install provider-helm
kubectl apply -f - @"
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-helm
spec:
  package: xpkg.upbound.io/crossplane-contrib/provider-helm:v0.16.0
"@

Write-Host "`n==> Waiting for providers to install (this may take 2-3 minutes)..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Wait for provider-kubernetes
Write-Host "Waiting for provider-kubernetes..." -ForegroundColor Yellow
kubectl wait --for=condition=healthy --timeout=300s provider.pkg.crossplane.io/provider-kubernetes

# Wait for provider-helm
Write-Host "Waiting for provider-helm..." -ForegroundColor Yellow
kubectl wait --for=condition=healthy --timeout=300s provider.pkg.crossplane.io/provider-helm

Write-Host "`n==> Creating application namespace: $APP_NAMESPACE" -ForegroundColor Cyan
kubectl create namespace $APP_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

Write-Host "`n==> Configuring provider permissions" -ForegroundColor Cyan

# Create ServiceAccount for provider-kubernetes
kubectl apply -f - @"
apiVersion: v1
kind: ServiceAccount
metadata:
  name: provider-kubernetes-sa
  namespace: $CROSSPLANE_NAMESPACE
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: provider-kubernetes-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: provider-kubernetes-sa
  namespace: $CROSSPLANE_NAMESPACE
---
apiVersion: kubernetes.crossplane.io/v1alpha1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: InjectedIdentity
"@

# Create ServiceAccount for provider-helm
kubectl apply -f - @"
apiVersion: v1
kind: ServiceAccount
metadata:
  name: provider-helm-sa
  namespace: $CROSSPLANE_NAMESPACE
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: provider-helm-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: provider-helm-sa
  namespace: $CROSSPLANE_NAMESPACE
---
apiVersion: helm.crossplane.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: InjectedIdentity
"@

Write-Host "`n==> Setup complete!" -ForegroundColor Green
Write-Host "`nVerify installation:" -ForegroundColor Cyan
Write-Host "  kubectl get providers"
Write-Host "  kubectl get providerconfigs"
Write-Host "`nOr run: .\verify-setup.ps1"
