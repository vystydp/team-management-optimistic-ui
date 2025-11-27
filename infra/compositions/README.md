# Crossplane Compositions

This directory contains Crossplane Composite Resource Definitions (XRDs) and Compositions for the platform.

## Overview

### What are XRDs and Compositions?

- **XRD (CompositeResourceDefinition)**: Defines the API schema - what fields users can specify when requesting infrastructure
- **Composition**: Defines the implementation - how to actually provision the infrastructure

Think of it as: XRD = interface, Composition = implementation.

## TeamEnvironment

The `TeamEnvironment` abstraction provisions a complete environment for a team:

### Resources Provisioned

1. **PostgreSQL Database** (via Helm - bitnami/postgresql)
   - Configurable size: small (256Mi), medium (512Mi), large (1Gi)
   - Local development credentials (change in production!)
   - Accessible at: `{name}-postgresql.team-environments.svc.cluster.local:5432`

2. **Redis Cache** (via Helm - bitnami/redis)
   - Configurable size: small (128Mi), medium (256Mi), large (512Mi)
   - Auth disabled for local dev
   - Accessible at: `{name}-redis-master.team-environments.svc.cluster.local:6379`

3. **Team API** (Kubernetes Deployment + Service)
   - Currently uses nginx:alpine as placeholder
   - Configurable replicas based on size: small (1), medium (2), large (3)
   - Accessible at: `http://{name}-api-svc.team-environments.svc.cluster.local`

### Usage

#### Create an Environment

Create a `TeamEnvironmentClaim` in your application namespace:

```yaml
apiVersion: platform.porsche.com/v1alpha1
kind: TeamEnvironmentClaim
metadata:
  name: my-dev-env
  namespace: default
spec:
  name: "My Development Environment"
  templateType: development
  teamId: "team-123"
  size: medium
  enableDatabase: true
  databaseEngine: postgres
  enableCache: true
  ttlDays: 30
```

Apply it:
```bash
kubectl apply -f my-environment.yaml
```

#### Check Status

```bash
# List all claims
kubectl get teamenvironmentclaims

# Get detailed status
kubectl get teamenvironmentclaim my-dev-env -o yaml

# Check composed resources
kubectl get release  # Helm releases (Postgres, Redis)
kubectl get object.kubernetes.crossplane.io  # K8s resources (Deployment, Service)
```

#### Status Fields

The claim status will populate with:

- `databaseReady`: true when Postgres is deployed
- `cacheReady`: true when Redis is deployed
- `apiReady`: true when API deployment has available replicas
- `databaseHost`: Connection string for database
- `databasePort`: Database port (5432)
- `cacheHost`: Connection string for cache
- `apiUrl`: API service URL

### Template Types

- **sandbox**: Smallest resources, short TTL (1-7 days)
- **development**: Medium resources, moderate TTL (7-30 days)
- **staging**: Production-like resources
- **production**: Full resources, no TTL

### Size Options

- **small**: Minimal resources for experimentation
- **medium**: Standard development workloads
- **large**: Performance testing, production workloads

## Apply Compositions

```bash
# Apply all compositions
kubectl apply -f compositions/

# Verify XRDs are established
kubectl get xrd

# Check composition
kubectl get composition
```

## Next Steps

After applying compositions:

1. The backend API will create `TeamEnvironmentClaim` resources
2. Crossplane will reconcile and provision the infrastructure
3. Frontend will poll backend for status updates
4. Users see real-time provisioning in the UI

## Future Phases

- **Phase 3**: AWS provider compositions for real AWS resources
- **Phase 4**: GuardrailedAccount composition for AWS account creation
- **Phase 5**: Advanced compositions with monitoring, backups, auto-scaling
