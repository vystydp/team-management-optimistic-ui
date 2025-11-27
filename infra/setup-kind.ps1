# Setup kind cluster with Crossplane for local development
# Works on Windows PowerShell

$ErrorActionPreference = "Stop"

$CLUSTER_NAME = "team-mgmt-local"
$CROSSPLANE_NAMESPACE = "crossplane-system"
$APP_NAMESPACE = "team-environments"

Write-Host "==> Creating kind cluster: $CLUSTER_NAME" -ForegroundColor Cyan

# Check if cluster already exists
$ErrorActionPreference = "Continue"
$existingClusters = kind get clusters 2>&1 | Where-Object { $_ -is [string] -and $_ -notmatch "No kind clusters found" }
$ErrorActionPreference = "Stop"
$existingCluster = $existingClusters | Select-String -Pattern "^$CLUSTER_NAME$"
if ($existingCluster) {
    Write-Host "Cluster '$CLUSTER_NAME' already exists. Delete it first with .\teardown-kind.ps1" -ForegroundColor Yellow
    exit 1
}

# Create kind cluster with extra port mappings for later ingress use
$kindConfig = @"
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30080
    hostPort: 30080
    protocol: TCP
"@

$kindConfigFile = Join-Path $env:TEMP "kind-config-$CLUSTER_NAME.yaml"
$kindConfig | Out-File -FilePath $kindConfigFile -Encoding UTF8

kind create cluster --name $CLUSTER_NAME --config $kindConfigFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create kind cluster" -ForegroundColor Red
    Remove-Item $kindConfigFile -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item $kindConfigFile -ErrorAction SilentlyContinue

Write-Host "==> Kind cluster created successfully" -ForegroundColor Green

# Set kubectl context
kubectl config use-context "kind-$CLUSTER_NAME"

Write-Host "`n==> Installing Crossplane via Helm" -ForegroundColor Cyan

# Add Crossplane Helm repo
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update

# Install Crossplane
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

# Create ServiceAccount for provider-kubernetes to use
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
Write-Host "`nCluster info:" -ForegroundColor Cyan
Write-Host "  Name: $CLUSTER_NAME"
Write-Host "  Context: kind-$CLUSTER_NAME"
Write-Host "  Crossplane namespace: $CROSSPLANE_NAMESPACE"
Write-Host "  App namespace: $APP_NAMESPACE"

Write-Host "`n==> Verify installation:" -ForegroundColor Cyan
Write-Host "  kubectl get providers"
Write-Host "  kubectl get providerconfigs"
Write-Host "`nOr run: .\verify-setup.ps1"

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Apply TeamEnvironment Composition: kubectl apply -f compositions/"
Write-Host "  2. Start backend API"
Write-Host "  3. Create environments via frontend!"
