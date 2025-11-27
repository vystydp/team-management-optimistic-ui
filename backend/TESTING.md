# Manual Testing Guide - Backend POST Endpoint

## Summary
Fixed the POST /api/environments endpoint issue. The problem was using namespaced K8s API methods for cluster-scoped Helm Release resources.

## What Was Fixed
1. Changed `createNamespacedCustomObject` → `createClusterCustomObject`
2. Removed `namespace` from Helm Release metadata (cluster-scoped resources don't have namespaces)
3. Target namespace remains in `spec.forProvider.namespace` (where Helm chart deploys)

## To Test the Fix

### 1. Start the Backend Server
```powershell
cd D:\Repos\team-management-optimistic-ui\backend
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

You should see:
```
✅ Loaded kubeconfig from default location
✅ Set context to: kind-team-mgmt-local
📌 Current context: kind-team-mgmt-local
🔗 Cluster server: https://127.0.0.1:52944
✅ Team Management Backend running on http://localhost:3001
```

### 2. Test POST Endpoint (in a new terminal)

**Create an environment:**
```powershell
$body = @{
    name = "Test Environment"
    teamId = "team-test"
    templateType = "sandbox"
    size = "small"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:3001/api/environments -Method POST -Body $body -ContentType "application/json"

# Check status code (should be 201)
$response.StatusCode

# View the created environment
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected response:**
```json
{
  "environment": {
    "id": "env-<uuid>",
    "name": "Test Environment",
    "teamId": "team-test",
    "templateType": "sandbox",
    "size": "small",
    "status": "CREATING",
    "enableDatabase": true,
    "databaseEngine": "postgres",
    "enableCache": true,
    "createdAt": "<timestamp>"
  }
}
```

### 3. Verify in Kubernetes

**List all Helm Releases:**
```powershell
kubectl get releases
```

Should show:
```
NAME           SYNCED   READY   STATE      REVISION
env-<uuid>     True     False   pending    0
```

**Check detailed status:**
```powershell
kubectl describe release env-<uuid>
```

**Watch it become ready:**
```powershell
kubectl get release env-<uuid> -w
```

Status will change: `pending` → `deployed`

### 4. Test GET Endpoint

**List all environments:**
```powershell
(Invoke-WebRequest -Uri http://localhost:3001/api/environments).Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Get specific environment:**
```powershell
$envId = "env-<uuid>"  # Replace with actual ID from create response
(Invoke-WebRequest -Uri "http://localhost:3001/api/environments/$envId").Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### 5. Test DELETE Endpoint

**Delete environment:**
```powershell
$envId = "env-<uuid>"  # Replace with actual ID
Invoke-WebRequest -Uri "http://localhost:3001/api/environments/$envId" -Method DELETE
```

**Verify deletion:**
```powershell
kubectl get releases
# Should no longer show the environment
```

## Troubleshooting

### Backend won't start
- **Issue:** "npx.ps1 cannot be loaded"
- **Fix:** Always use `powershell -ExecutionPolicy Bypass -Command "..."`

### POST returns 500 error
- **Check backend logs** in the terminal where `npm run dev` is running
- Look for detailed error messages with stack traces
- Verify kind cluster is running: `kind get clusters`
- Verify Crossplane providers are healthy: `kubectl get providers`

### Helm Release stuck in "pending"
- **Check provider-helm logs:**
  ```powershell
  kubectl logs -n crossplane-system deployment/provider-helm-<hash> -f
  ```
- **Check Helm Release status:**
  ```powershell
  kubectl describe release env-<uuid>
  ```

### Can't connect to localhost:3001
- Backend may have stopped. Check terminal for errors.
- Verify process is running: `Get-Process -Name node`
- Check port is listening: `netstat -ano | findstr :3001`

## Next Steps
Once POST endpoint is verified working:
1. Test UPDATE (PATCH) endpoint
2. Integrate frontend with real backend API
3. Add polling for status updates
4. Test full environment lifecycle
5. Add error handling for Crossplane reconciliation failures
