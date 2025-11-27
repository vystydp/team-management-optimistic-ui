# Phase 2 Testing Guide

Quick guide for testing the Crossplane setup locally.

## Setup (One-time)

### 1. Install Prerequisites

```powershell
# Install via Chocolatey (run as Administrator)
choco install kubernetes-cli kubernetes-helm kind

# Verify installations
kubectl version --client
helm version
kind version
```

### 2. Start kind Cluster with Crossplane

```powershell
cd infra
.\setup-kind.ps1
```

This script will:
- Create a kind cluster named `team-mgmt-local`
- Install Crossplane via Helm
- Install provider-kubernetes and provider-helm
- Configure provider permissions
- Wait for everything to be healthy (~3-5 minutes)

### 3. Verify Setup

```powershell
.\verify-setup.ps1
```

Expected output:
```
Provider: provider-kubernetes
  Installed: True
  Healthy: True
Provider: provider-helm
  Installed: True
  Healthy: True
```

### 4. Apply Compositions

```powershell
kubectl apply -f compositions/
```

Verify:
```powershell
kubectl get xrd
kubectl get composition
```

## Manual Testing (Before Backend is Ready)

### Create a Test Environment

Create `test-environment.yaml`:

```yaml
apiVersion: platform.porsche.com/v1alpha1
kind: TeamEnvironmentClaim
metadata:
  name: test-sandbox
  namespace: default
spec:
  name: "Test Sandbox"
  templateType: sandbox
  teamId: "team-test"
  size: small
  enableDatabase: true
  databaseEngine: postgres
  enableCache: true
  ttlDays: 7
```

Apply it:
```powershell
kubectl apply -f test-environment.yaml
```

### Watch Reconciliation

```powershell
# Watch the claim
kubectl get teamenvironmentclaim test-sandbox -w

# Check composed resources
kubectl get release -A
kubectl get object.kubernetes.crossplane.io -A

# Check status details
kubectl get teamenvironmentclaim test-sandbox -o yaml
```

You should see:
1. Helm releases for Postgres and Redis being created
2. Kubernetes Objects for API deployment and service
3. Status fields populating (databaseReady, cacheReady, apiReady)
4. Connection details (databaseHost, cacheHost, apiUrl)

### Check Provisioned Resources

```powershell
# Create team namespace (if not exists)
kubectl create namespace team-test

# Check Helm releases
helm list -A

# Check running pods
kubectl get pods -n team-test

# Check services
kubectl get svc -n team-test
```

### Test Different Sizes

```yaml
# Medium size
apiVersion: platform.porsche.com/v1alpha1
kind: TeamEnvironmentClaim
metadata:
  name: test-medium
  namespace: default
spec:
  name: "Test Medium"
  templateType: development
  teamId: "team-test"
  size: medium  # More resources
  enableDatabase: true
  enableCache: true
```

Apply and compare resource allocations:
```powershell
kubectl get deployment -n team-test -o yaml | grep -A5 resources
```

### Clean Up Test Resources

```powershell
# Delete claim (will delete all composed resources)
kubectl delete teamenvironmentclaim test-sandbox

# Verify cleanup
kubectl get release -A
kubectl get pods -n team-test
```

## Troubleshooting

### Providers Not Healthy

```powershell
# Check provider logs
kubectl logs -n crossplane-system -l pkg.crossplane.io/provider=provider-kubernetes

# Check provider pod status
kubectl get pods -n crossplane-system
```

### Compositions Not Working

```powershell
# Check XRD
kubectl describe xrd xteamenvironments.platform.porsche.com

# Check composition
kubectl describe composition teamenvironment-local

# Check claim events
kubectl describe teamenvironmentclaim test-sandbox
```

### Resources Not Provisioning

```powershell
# Check Helm release status
kubectl get release -A -o yaml

# Check object status
kubectl get object.kubernetes.crossplane.io -A -o yaml

# Check Crossplane logs
kubectl logs -n crossplane-system deployment/crossplane
```

## Next Steps

Once manual testing confirms Crossplane is working:

1. **Create Backend API** (Task 3)
   - Node/TypeScript app
   - POST /environments → creates TeamEnvironmentClaim
   - GET /environments → reads claim status
   
2. **Connect Frontend** (Task 4)
   - Toggle MSW vs real backend via env var
   - Keep optimistic UI patterns
   - Poll for Crossplane status updates

3. **End-to-End Testing** (Task 5)
   - Create environment via UI
   - Verify claim appears in K8s
   - Watch Crossplane reconcile
   - Confirm UI updates to READY status

## Teardown

When done testing:

```powershell
cd infra
.\teardown-kind.ps1
```

This deletes the entire kind cluster.
