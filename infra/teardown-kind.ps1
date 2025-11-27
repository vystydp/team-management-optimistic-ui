# Teardown kind cluster
# Works on Windows PowerShell

$ErrorActionPreference = "Stop"

$CLUSTER_NAME = "team-mgmt-local"

Write-Host "==> Deleting kind cluster: $CLUSTER_NAME" -ForegroundColor Cyan

$existingCluster = kind get clusters 2>$null | Select-String -Pattern "^$CLUSTER_NAME$"
if (-not $existingCluster) {
    Write-Host "Cluster '$CLUSTER_NAME' does not exist." -ForegroundColor Yellow
    exit 0
}

kind delete cluster --name $CLUSTER_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to delete cluster" -ForegroundColor Red
    exit 1
}

Write-Host "==> Cluster deleted successfully" -ForegroundColor Green
