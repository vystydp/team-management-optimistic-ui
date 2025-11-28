#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Tests pause/resume consistency between list and get endpoints
.DESCRIPTION
    This script tests that /api/environments (list) and /api/environments/:id (get)
    return consistent status values for paused environments
#>

param(
    [string]$BackendUrl = "http://localhost:3001"
)

Write-Host "🧪 Testing Pause/Resume Consistency" -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl`n" -ForegroundColor Gray

# Test if backend is running
try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/health" -ErrorAction Stop
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running on $BackendUrl" -ForegroundColor Red
    Write-Host "   Start it with: cd backend; npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n--- Test 1: List Environments ---" -ForegroundColor Cyan
try {
    $listResponse = Invoke-RestMethod -Uri "$BackendUrl/api/environments" -ErrorAction Stop
    $environments = $listResponse.environments
    
    Write-Host "Found $($environments.Count) environments:" -ForegroundColor White
    foreach ($env in $environments) {
        $statusColor = if ($env.status -eq "PAUSED") { "Yellow" } elseif ($env.status -eq "READY") { "Green" } else { "Gray" }
        Write-Host "  - $($env.id): $($env.name) [" -NoNewline
        Write-Host "$($env.status)" -NoNewline -ForegroundColor $statusColor
        Write-Host "]"
    }
} catch {
    Write-Host "❌ Failed to list environments: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n--- Test 2: Get Individual Environments ---" -ForegroundColor Cyan
$inconsistencies = @()

foreach ($env in $environments) {
    try {
        $getResponse = Invoke-RestMethod -Uri "$BackendUrl/api/environments/$($env.id)" -ErrorAction Stop
        
        $listStatus = $env.status
        $getStatus = $getResponse.status
        
        if ($listStatus -eq $getStatus) {
            Write-Host "  ✅ $($env.id): List=$listStatus, Get=$getStatus" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($env.id): List=$listStatus, Get=$getStatus - INCONSISTENT!" -ForegroundColor Red
            $inconsistencies += [PSCustomObject]@{
                ID = $env.id
                Name = $env.name
                ListStatus = $listStatus
                GetStatus = $getStatus
            }
        }
    } catch {
        Write-Host "  ⚠️  $($env.id): Failed to get - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n--- Test 3: Test Multiple Calls (Cache Check) ---" -ForegroundColor Cyan
if ($environments.Count -gt 0) {
    $testEnv = $environments[0]
    Write-Host "Testing $($testEnv.id) with 5 rapid calls..." -ForegroundColor White
    
    $statuses = @()
    for ($i = 1; $i -le 5; $i++) {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/environments/$($testEnv.id)" -ErrorAction Stop
        $statuses += $response.status
        Start-Sleep -Milliseconds 100
    }
    
    $uniqueStatuses = $statuses | Select-Object -Unique
    if ($uniqueStatuses.Count -eq 1) {
        Write-Host "  ✅ All 5 calls returned consistent status: $($uniqueStatuses[0])" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Inconsistent statuses across calls: $($statuses -join ', ')" -ForegroundColor Red
        $inconsistencies += [PSCustomObject]@{
            ID = $testEnv.id
            Name = "Cache consistency test"
            ListStatus = "N/A"
            GetStatus = "Varies: $($statuses -join ', ')"
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($inconsistencies.Count -eq 0) {
    Write-Host "✅ ALL TESTS PASSED - Status is consistent!" -ForegroundColor Green
    Write-Host "   List and Get endpoints return matching statuses" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ TESTS FAILED - Found $($inconsistencies.Count) inconsistencies" -ForegroundColor Red
    Write-Host "`nInconsistencies:" -ForegroundColor Yellow
    $inconsistencies | Format-Table -AutoSize
    Write-Host "`nPossible causes:" -ForegroundColor Yellow
    Write-Host "  1. Kubernetes state is still propagating" -ForegroundColor Gray
    Write-Host "  2. Backend cache inconsistency" -ForegroundColor Gray
    Write-Host "  3. Annotation not properly set/removed" -ForegroundColor Gray
    exit 1
}
