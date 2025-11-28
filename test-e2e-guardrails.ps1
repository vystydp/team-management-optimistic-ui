#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated E2E test for AWS Account Linking and Guardrails (Phase 3.4)
    
.DESCRIPTION
    This script performs a complete end-to-end regression test of the AWS account
    linking and guardrail automation workflow:
    
    1. Verifies Crossplane infrastructure is ready
    2. Links a test AWS account via backend API
    3. Applies guardrails (creates GuardrailedAccountClaim)
    4. Polls until guardrails complete (status = guardrailed)
    5. Verifies Kubernetes resources (Jobs, ConfigMaps)
    6. Cleans up test resources
    
    NO REAL AWS ACCOUNT NEEDED - everything is simulated.
    
.PARAMETER BackendUrl
    Backend API URL (default: http://localhost:3001)
    
.PARAMETER SkipAuth
    Skip authentication checks (for local testing with auth disabled)
    
.PARAMETER TestAccountId
    12-digit AWS account ID to use for testing (default: 999888777666)
    
.EXAMPLE
    .\test-e2e-guardrails.ps1
    
.EXAMPLE
    .\test-e2e-guardrails.ps1 -BackendUrl "http://localhost:3001" -TestAccountId "123456789012"
    
.NOTES
    Prerequisites:
    - Backend running on port 3001
    - Kubernetes cluster (kind) with Crossplane installed
    - kubectl configured
#>

param(
    [string]$BackendUrl = "http://localhost:3001",
    [switch]$SkipAuth = $false,
    [string]$TestAccountId = "999888777666"
)

$ErrorActionPreference = "Stop"

# ANSI color codes for output
$ColorReset = "`e[0m"
$ColorRed = "`e[31m"
$ColorGreen = "`e[32m"
$ColorYellow = "`e[33m"
$ColorCyan = "`e[36m"
$ColorWhite = "`e[37m"

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n$ColorCyan=== $Message ===$ColorReset" -NoNewline
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "$ColorGreen✓ $Message$ColorReset"
}

function Write-Failure {
    param([string]$Message)
    Write-Host "$ColorRed✗ $Message$ColorReset"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "$ColorYellow⚠ $Message$ColorReset"
}

function Write-Info {
    param([string]$Message)
    Write-Host "$ColorWhite  $Message$ColorReset"
}

# Test state
$TestsPassed = 0
$TestsFailed = 0
$AccountId = $null

Write-TestHeader "AWS Account Guardrails E2E Test"
Write-Info "Backend: $BackendUrl"
Write-Info "Test Account ID: $TestAccountId"
Write-Info "Skip Auth: $SkipAuth"

#
# STEP 1: Verify Crossplane Infrastructure
#
Write-TestHeader "Step 1: Verify Crossplane Infrastructure"

try {
    # Check XRD
    $xrdCheck = kubectl get xrd xguardrailedaccounts.platform.porsche.com -o json 2>&1 | ConvertFrom-Json
    if ($xrdCheck.status.conditions | Where-Object { $_.type -eq "Established" -and $_.status -eq "True" }) {
        Write-Success "GuardrailedAccount XRD is established"
        $TestsPassed++
    } else {
        Write-Failure "GuardrailedAccount XRD not established"
        $TestsFailed++
    }
} catch {
    Write-Failure "GuardrailedAccount XRD not found"
    Write-Info "Run: kubectl apply -f infra/compositions/03-xrd-guardrailed-account.yaml"
    $TestsFailed++
    exit 1
}

try {
    # Check Composition
    $compCheck = kubectl get composition guardrailed-account-pipeline -o json 2>&1 | ConvertFrom-Json
    Write-Success "GuardrailedAccount Composition exists"
    $TestsPassed++
} catch {
    Write-Failure "GuardrailedAccount Composition not found"
    Write-Info "Run: kubectl apply -f infra/compositions/06-composition-pipeline.yaml"
    $TestsFailed++
    exit 1
}

try {
    # Check function-patch-and-transform
    $funcCheck = kubectl get function function-patch-and-transform -o json 2>&1 | ConvertFrom-Json
    if ($funcCheck.status.conditions | Where-Object { $_.type -eq "Healthy" -and $_.status -eq "True" }) {
        Write-Success "function-patch-and-transform is healthy"
        $TestsPassed++
    } else {
        Write-Failure "function-patch-and-transform not healthy"
        $TestsFailed++
    }
} catch {
    Write-Failure "function-patch-and-transform not found"
    Write-Info "Run: kubectl apply -f infra/compositions/function-patch-and-transform.yaml"
    $TestsFailed++
    exit 1
}

#
# STEP 2: Link Test AWS Account
#
Write-TestHeader "Step 2: Link Test AWS Account"

$linkRequest = @{
    accountId = $TestAccountId
    accountName = "E2E Test Account"
    roleArn = "arn:aws:iam::${TestAccountId}:role/CrossplaneRole"
    ownerEmail = "e2e-test@example.com"
} | ConvertTo-Json

try {
    $linkResponse = Invoke-RestMethod `
        -Uri "$BackendUrl/api/aws/link-account" `
        -Method POST `
        -Body $linkRequest `
        -ContentType "application/json" `
        -ErrorAction Stop

    $AccountId = $linkResponse.account.id
    Write-Success "Account linked successfully (ID: $AccountId)"
    Write-Info "Account ID: $($linkResponse.account.accountId)"
    Write-Info "Status: $($linkResponse.account.status)"
    $TestsPassed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 401 -and $SkipAuth) {
        Write-Warning "Authentication required (401) - Enable -SkipAuth or disable auth in server.ts"
    } elseif ($_.Exception.Message -like "*already linked*") {
        Write-Warning "Account already exists - cleaning up first..."
        
        # Try to find and delete existing account
        try {
            $existingAccounts = Invoke-RestMethod -Uri "$BackendUrl/api/aws/accounts" -Method GET
            $existing = $existingAccounts.accounts | Where-Object { $_.accountId -eq $TestAccountId }
            if ($existing) {
                Invoke-RestMethod -Uri "$BackendUrl/api/aws/accounts/$($existing.id)" -Method DELETE | Out-Null
                Write-Info "Deleted existing account, retrying link..."
                
                # Retry link
                $linkResponse = Invoke-RestMethod `
                    -Uri "$BackendUrl/api/aws/link-account" `
                    -Method POST `
                    -Body $linkRequest `
                    -ContentType "application/json"
                
                $AccountId = $linkResponse.account.id
                Write-Success "Account linked successfully after cleanup (ID: $AccountId)"
                $TestsPassed++
            }
        } catch {
            Write-Failure "Failed to clean up existing account: $_"
            $TestsFailed++
            exit 1
        }
    } else {
        Write-Failure "Failed to link account: $_"
        $TestsFailed++
        exit 1
    }
}

#
# STEP 3: Apply Guardrails
#
Write-TestHeader "Step 3: Apply Guardrails"

$secureRequest = @{
    accountId = $TestAccountId
} | ConvertTo-Json

try {
    $secureResponse = Invoke-RestMethod `
        -Uri "$BackendUrl/api/aws/secure-account" `
        -Method POST `
        -Body $secureRequest `
        -ContentType "application/json" `
        -ErrorAction Stop

    $ClaimName = $secureResponse.claimName
    Write-Success "Guardrails initiated (Claim: $ClaimName)"
    Write-Info "Status: $($secureResponse.account.status)"
    $TestsPassed++
} catch {
    Write-Failure "Failed to apply guardrails: $_"
    $TestsFailed++
    exit 1
}

#
# STEP 4: Poll Until Guardrailed
#
Write-TestHeader "Step 4: Wait for Guardrails to Complete"

$MaxPolls = 60  # 60 * 5 seconds = 5 minutes max
$PollCount = 0
$CurrentStatus = "guardrailing"

while ($PollCount -lt $MaxPolls -and $CurrentStatus -ne "guardrailed") {
    Start-Sleep -Seconds 5
    $PollCount++

    try {
        $statusResponse = Invoke-RestMethod `
            -Uri "$BackendUrl/api/aws/accounts/$AccountId/status" `
            -Method GET `
            -ErrorAction Stop

        $CurrentStatus = $statusResponse.status
        
        if ($CurrentStatus -eq "guardrailed") {
            Write-Success "Guardrails applied successfully!"
            $TestsPassed++
            break
        } elseif ($CurrentStatus -eq "error") {
            Write-Failure "Guardrailing failed: $($statusResponse.errorMessage)"
            $TestsFailed++
            break
        } else {
            Write-Info "Poll $PollCount/$MaxPolls - Status: $CurrentStatus"
        }
    } catch {
        Write-Warning "Poll $PollCount/$MaxPolls failed: $_"
    }
}

if ($PollCount -ge $MaxPolls -and $CurrentStatus -ne "guardrailed") {
    Write-Failure "Timeout waiting for guardrails (5 minutes)"
    $TestsFailed++
}

#
# STEP 5: Verify Kubernetes Resources
#
Write-TestHeader "Step 5: Verify Kubernetes Resources"

try {
    # Check GuardrailedAccountClaim
    $claim = kubectl get guardrailedaccountclaim $ClaimName -n default -o json 2>&1 | ConvertFrom-Json
    
    $syncedCondition = $claim.status.conditions | Where-Object { $_.type -eq "Synced" }
    if ($syncedCondition.status -eq "True") {
        Write-Success "GuardrailedAccountClaim is SYNCED"
        $TestsPassed++
    } else {
        Write-Failure "GuardrailedAccountClaim not synced: $($syncedCondition.reason)"
        $TestsFailed++
    }
    
    # Check for Jobs
    $jobs = kubectl get jobs -n default -l "guardrail.platform.porsche.com/account-id=$TestAccountId" -o json 2>&1 | ConvertFrom-Json
    $jobCount = $jobs.items.Count
    
    if ($jobCount -eq 3) {
        Write-Success "All 3 guardrail Jobs created (CloudTrail, Config, Budget)"
        $TestsPassed++
        
        # Check Job completion
        $completedJobs = $jobs.items | Where-Object { $_.status.succeeded -eq 1 }
        if ($completedJobs.Count -eq 3) {
            Write-Success "All 3 Jobs completed successfully"
            $TestsPassed++
        } else {
            Write-Warning "Only $($completedJobs.Count)/3 Jobs completed"
        }
    } else {
        Write-Failure "Expected 3 Jobs, found $jobCount"
        $TestsFailed++
    }
    
    # Check ConfigMap
    $configMaps = kubectl get configmap -n default -l "guardrail.platform.porsche.com/account-id=$TestAccountId" -o json 2>&1 | ConvertFrom-Json
    if ($configMaps.items.Count -gt 0) {
        Write-Success "Guardrail status ConfigMap created"
        $TestsPassed++
    } else {
        Write-Warning "No guardrail ConfigMap found"
    }
    
} catch {
    Write-Failure "Failed to verify Kubernetes resources: $_"
    $TestsFailed++
}

#
# STEP 6: Cleanup
#
Write-TestHeader "Step 6: Cleanup Test Resources"

try {
    # Remove guardrails
    Invoke-RestMethod `
        -Uri "$BackendUrl/api/aws/accounts/$AccountId/guardrails" `
        -Method DELETE `
        -ErrorAction SilentlyContinue | Out-Null
    
    Write-Info "Removed guardrails"
    
    # Wait for claim deletion
    Start-Sleep -Seconds 2
    
    # Unlink account
    Invoke-RestMethod `
        -Uri "$BackendUrl/api/aws/accounts/$AccountId" `
        -Method DELETE `
        -ErrorAction SilentlyContinue | Out-Null
    
    Write-Success "Cleanup completed"
    $TestsPassed++
} catch {
    Write-Warning "Cleanup failed (resources may need manual cleanup): $_"
}

#
# STEP 7: Summary
#
Write-TestHeader "Test Summary"

$TotalTests = $TestsPassed + $TestsFailed
Write-Host ""
Write-Host "Tests Passed: $ColorGreen$TestsPassed$ColorReset"
Write-Host "Tests Failed: $ColorRed$TestsFailed$ColorReset"
Write-Host "Total Tests: $TotalTests"
Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "$ColorGreen✓ ALL TESTS PASSED!$ColorReset"
    Write-Host ""
    Write-Host "Phase 3.4 E2E test completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "$ColorRed✗ SOME TESTS FAILED$ColorReset"
    Write-Host ""
    Write-Host "Please review failures above and check:" -ForegroundColor Red
    Write-Host "  - Backend logs"
    Write-Host "  - Kubernetes events: kubectl get events --sort-by='.lastTimestamp'"
    Write-Host "  - Claim status: kubectl get guardrailedaccountclaims"
    Write-Host "  - Job logs: kubectl logs job/<job-name>"
    exit 1
}
