# Infrastructure Setup

This directory contains scripts and manifests for setting up the local Kubernetes + Crossplane development environment.

## Prerequisites

- **Docker Desktop** (Windows): Must be running with Kubernetes enabled OR install kind/k3d separately
- **kubectl**: Kubernetes CLI tool
- **Helm**: Package manager for Kubernetes

### Install Prerequisites on Windows

```powershell
# Install kubectl via Chocolatey
choco install kubernetes-cli

# Install Helm via Chocolatey
choco install kubernetes-helm

# Install kind (Kubernetes in Docker) via Chocolatey
choco install kind

# OR use Docker Desktop's built-in Kubernetes (Settings > Kubernetes > Enable Kubernetes)
```

## Quick Start

### Option 1: Using kind (recommended for isolation)

```powershell
# Start kind cluster with Crossplane
.\setup-kind.ps1

# Verify setup
kubectl get providers
kubectl get compositeresourcedefinitions
```

### Option 2: Using Docker Desktop Kubernetes

```powershell
# Ensure Docker Desktop Kubernetes is enabled
# Then install Crossplane only
.\install-crossplane.ps1

# Verify setup
kubectl get providers
```

## Scripts

- **`setup-kind.ps1`**: Creates a kind cluster and installs Crossplane + providers
- **`install-crossplane.ps1`**: Installs Crossplane and providers (for existing cluster)
- **`teardown-kind.ps1`**: Deletes the kind cluster
- **`verify-setup.ps1`**: Verifies Crossplane installation and provider health

## Crossplane Components

This setup installs:

1. **Crossplane Core** - Control plane for managing infrastructure
2. **provider-kubernetes** - Provisions Kubernetes resources (Deployments, Services, etc.)
3. **provider-helm** - Provisions Helm releases (Postgres, Redis, etc.)

## Architecture

```
kind cluster "team-mgmt-local"
├── Crossplane (namespace: crossplane-system)
│   ├── provider-kubernetes
│   └── provider-helm
└── Application workloads (namespace: team-environments)
    ├── TeamEnvironment Claims (created by backend)
    └── Composed resources (Helm releases, K8s resources)
```

## Next Steps

After running setup:

1. Apply TeamEnvironment Composition: `kubectl apply -f compositions/`
2. Start the backend API (will create Claims in K8s)
3. Frontend will poll backend for environment status
