# Team Management Backend

Node/TypeScript backend API that integrates with Kubernetes and Crossplane to manage team environments.

## Features

- **REST API** for environment management (CRUD operations)
- **Kubernetes Integration** via `@kubernetes/client-node`
- **Crossplane Resources** - Creates and manages Helm Releases for infrastructure
- **Direct Managed Resources** - Uses Helm provider to provision PostgreSQL, Redis, etc.

## Architecture

```
Frontend (React)
    ↓
Backend API (Express)
    ↓
Kubernetes API
    ↓
Crossplane Providers (provider-helm, provider-kubernetes)
    ↓
Infrastructure (Postgres, Redis, etc.)
```

## Prerequisites

- Node.js 18+ and npm
- Kubernetes cluster with Crossplane installed (see `../infra/`)
- `kubectl` configured to access the cluster

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` if needed:
```env
PORT=3001
KUBE_CONTEXT=kind-team-mgmt-local
APP_NAMESPACE=team-environments
```

### 3. Verify Kubernetes Access

```bash
kubectl config current-context
# Should show: kind-team-mgmt-local

kubectl get namespaces
# Should show: team-environments
```

## Development

### Start Development Server

```bash
npm run dev
```

This starts the server with hot-reload on http://localhost:3001

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server status.

### List Environments
```
GET /api/environments
```

Returns all team environments.

**Response:**
```json
{
  "environments": [
    {
      "id": "env-abc123",
      "name": "Development Environment",
      "teamId": "team-001",
      "templateType": "development",
      "status": "READY",
      "size": "medium",
      "createdAt": "2025-11-27T10:00:00Z",
      "databaseReady": true,
      "databaseHost": "env-abc123-postgresql.team-environments.svc.cluster.local"
    }
  ],
  "total": 1
}
```

### Get Environment
```
GET /api/environments/:id
```

Returns a single environment by ID.

### Create Environment
```
POST /api/environments
Content-Type: application/json

{
  "name": "My Dev Environment",
  "teamId": "team-001",
  "templateType": "development",
  "size": "small",
  "enableDatabase": true,
  "databaseEngine": "postgres",
  "enableCache": true,
  "ttlDays": 30
}
```

Creates a new environment. Returns immediately with `status: "CREATING"`. Poll GET endpoint to see when it becomes `READY`.

### Update Environment
```
PATCH /api/environments/:id
Content-Type: application/json

{
  "size": "large"
}
```

Updates environment configuration (e.g., scale up/down).

### Delete Environment
```
DELETE /api/environments/:id
```

Deletes the environment and all associated resources.

## How It Works

### Environment Lifecycle

1. **POST /api/environments** creates a Crossplane `helm.crossplane.io/v1beta1/Release` resource
2. Crossplane's provider-helm reconciles and installs the Helm chart (e.g., PostgreSQL)
3. **GET /api/environments** reads the Release status and maps to `TeamEnvironmentStatus`
4. Frontend polls GET endpoint until status becomes `READY`

### Status Mapping

- Crossplane `Synced: False` → `CREATING`
- Crossplane `Synced: True, Ready: True, state: deployed` → `READY`
- Crossplane `ReconcileError` → `ERROR`

### Labels and Annotations

Environments are tracked via labels on Helm Releases:

```yaml
labels:
  app.porsche.com/managed-by: team-management
  app.porsche.com/team-id: team-001
  app.porsche.com/template-type: development
  app.porsche.com/size: medium
annotations:
  app.porsche.com/environment-name: "My Environment"
```

## Testing

### Manual Testing with curl

```bash
# Health check
curl http://localhost:3001/health

# List environments
curl http://localhost:3001/api/environments

# Create environment
curl -X POST http://localhost:3001/api/environments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Environment",
    "teamId": "team-test",
    "templateType": "sandbox",
    "size": "small"
  }'

# Get environment (use ID from create response)
curl http://localhost:3001/api/environments/env-abc123

# Delete environment
curl -X DELETE http://localhost:3001/api/environments/env-abc123
```

### Check Kubernetes Resources

```bash
# List Helm Releases
kubectl get releases -n team-environments

# Describe a release
kubectl describe release env-abc123 -n team-environments

# Check PostgreSQL pods
kubectl get pods -n team-environments
```

## Troubleshooting

### "Failed to list environments: Forbidden"

Provider ServiceAccount needs permissions. Run:

```bash
kubectl create clusterrolebinding provider-helm-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=crossplane-system:provider-helm-<uid>
```

Replace `<uid>` with the actual ServiceAccount name from:
```bash
kubectl get pods -n crossplane-system -l pkg.crossplane.io/provider=provider-helm \
  -o jsonpath='{.items[0].spec.serviceAccountName}'
```

### "Cannot connect to Kubernetes cluster"

Check kubeconfig:
```bash
kubectl config current-context
kubectl cluster-info
```

Update `.env` with correct `KUBE_CONTEXT`.

### Environments stuck in CREATING

Check Crossplane provider logs:
```bash
kubectl logs -n crossplane-system -l pkg.crossplane.io/provider=provider-helm
```

Check Release status:
```bash
kubectl describe release <env-id> -n team-environments
```

## Next Steps

- [ ] Add authentication/authorization
- [ ] Add Redis support (second Helm Release per environment)
- [ ] Implement pause/resume operations
- [ ] Add environment templates endpoint
- [ ] Migrate to Crossplane Compositions (when upgraded to 2.x format)
- [ ] Add WebSocket support for real-time status updates
- [ ] Add integration tests

## Related Documentation

- [Crossplane Documentation](https://docs.crossplane.io/)
- [@kubernetes/client-node](https://github.com/kubernetes-client/javascript)
- [Infrastructure Setup](../infra/README.md)
