# Verify Crossplane setup
# Works on Windows PowerShell

$ErrorActionPreference = "Stop"

Write-Host "==> Verifying Crossplane setup" -ForegroundColor Cyan

Write-Host "`n1. Checking Crossplane deployment..." -ForegroundColor Yellow
kubectl get deployment crossplane -n crossplane-system

Write-Host "`n2. Checking providers..." -ForegroundColor Yellow
kubectl get providers

Write-Host "`n3. Checking provider health..." -ForegroundColor Yellow
$providers = kubectl get providers -o json | ConvertFrom-Json
foreach ($provider in $providers.items) {
    $name = $provider.metadata.name
    $installed = $provider.status.conditions | Where-Object { $_.type -eq "Installed" } | Select-Object -First 1
    $healthy = $provider.status.conditions | Where-Object { $_.type -eq "Healthy" } | Select-Object -First 1
    
    Write-Host "  $name"
    Write-Host "    Installed: $($installed.status) (Reason: $($installed.reason))"
    Write-Host "    Healthy: $($healthy.status) (Reason: $($healthy.reason))"
}

Write-Host "`n4. Checking provider configs..." -ForegroundColor Yellow
kubectl get providerconfigs

Write-Host "`n5. Checking namespaces..." -ForegroundColor Yellow
kubectl get namespace crossplane-system team-environments

Write-Host "`n6. Checking for any Composite Resource Definitions..." -ForegroundColor Yellow
$xrds = kubectl get xrd 2>$null
if ($LASTEXITCODE -eq 0) {
    $xrds
} else {
    Write-Host "  No XRDs found yet (this is expected before applying compositions)"
}

Write-Host "`n==> Verification complete!" -ForegroundColor Green
Write-Host "`nIf providers are 'Installed: True' and 'Healthy: True', you're ready to apply compositions." -ForegroundColor Cyan
Write-Host "Next: kubectl apply -f compositions/" -ForegroundColor Cyan
