# Backend Debugging Notes

## Issue: POST /api/environments Failing

### Problem
The backend POST endpoint was failing with "HTTP request failed" error when trying to create Helm Releases.

### Root Cause
**Helm Releases are cluster-scoped resources, not namespaced resources.**

The code was incorrectly trying to create Helm Releases as namespaced resources:
```typescript
// ❌ WRONG - This gives 404 error
await k8sCustomApi.createNamespacedCustomObject(
  'helm.crossplane.io',
  'v1beta1',
  'team-environments',  // namespace parameter
  'releases',
  helmRelease
);
```

### Solution
Changed to use cluster-scoped API methods:
```typescript
// ✅ CORRECT - Cluster-scoped resource
await k8sCustomApi.createClusterCustomObject(
  'helm.crossplane.io',
  'v1beta1',
  'releases',
  helmRelease
);
```

Also removed `namespace` from Helm Release metadata:
```typescript
// ❌ WRONG
metadata: {
  name: id,
  namespace: 'team-environments',  // This is invalid for cluster-scoped resources
}

// ✅ CORRECT
metadata: {
  name: id,
  // No namespace field - cluster-scoped resources don't have one
}
```

The target namespace for the Helm chart deployment is specified in `spec.forProvider.namespace`:
```typescript
spec: {
  forProvider: {
    namespace: 'team-environments',  // Where the Helm chart will be deployed
    // ...
  }
}
```

### Verification
Confirmed via `kubectl api-resources`:
```
NAME         APIVERSION              NAMESPACED  KIND
releases     helm.crossplane.io/v1beta1   false       Release
```

The `NAMESPACED=false` column confirms Helm Releases are cluster-scoped.

### Files Changed
1. **backend/src/environments.service.ts**
   - Line ~182: Removed `namespace` from metadata
   - Line ~236: Changed `createNamespacedCustomObject` → `createClusterCustomObject`

2. **backend/test-k8s.ts**
   - Line ~28: Removed `namespace` from metadata
   - Line ~53: Changed `createNamespacedCustomObject` → `createClusterCustomObject`
   - Line ~66: Changed `deleteNamespacedCustomObject` → `deleteClusterCustomObject`

### Test Results
Test script successfully:
- ✅ Created Helm Release "test-connection"
- ✅ Received 201 response from K8s API
- ✅ Cleaned up release

Backend should now work identically. To test:
```powershell
# Start backend
cd backend
npm run dev

# Test POST endpoint (in separate terminal)
$body = @{name="Test Environment"; teamId="team-test"; templateType="sandbox"; size="small"} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3001/api/environments -Method POST -Body $body -ContentType "application/json"
```

### Key Learning
When working with Crossplane Custom Resources:
1. Check if resource is namespaced: `kubectl api-resources | grep <resource>`
2. Use `createClusterCustomObject` for cluster-scoped resources
3. Use `createNamespacedCustomObject` for namespaced resources
4. Don't add `metadata.namespace` to cluster-scoped resources
