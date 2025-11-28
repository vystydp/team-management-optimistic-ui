<#
.SYNOPSIS
    Run Phase 3.4 test suite
    
.DESCRIPTION
    Installs test dependencies and runs all Phase 3.4 tests
    
.PARAMETER SkipInstall
    Skip npm install steps
    
.PARAMETER Coverage
    Generate coverage reports
#>

param(
    [switch]$SkipInstall = $false,
    [switch]$Coverage = $false
)

$ErrorActionPreference = "Stop"

function WriteStep {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function WriteSuccess {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function WriteFailure {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          Phase 3.4 Test Suite Setup & Execution              ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║  AWS Account Linking + Guardrails Test Coverage             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$TestResults = @{
    BackendPassed = $false
    FrontendPassed = $false
    E2EPassed = $false
}

#
# STEP 1: Install Dependencies
#
if (-not $SkipInstall) {
    WriteStep "Step 1: Install Test Dependencies"
    
    Write-Host "Installing backend test dependencies..."
    try {
        Set-Location backend
        npm install --save-dev jest@29.7.0 ts-jest@29.1.1 @types/jest@29.5.11 supertest@6.3.3 @types/supertest@6.0.2 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            WriteSuccess "Backend dependencies installed"
        } else {
            WriteFailure "Failed to install backend dependencies"
            exit 1
        }
        Set-Location ..
    } catch {
        WriteFailure "Failed to install backend dependencies: $_"
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "Skipping dependency installation" -ForegroundColor Yellow
}

#
# STEP 2: Run Backend Tests
#
WriteStep "Step 2: Run Backend Unit Tests"
try {
    Set-Location backend
    
    if ($Coverage) {
        Write-Host "Running backend tests with coverage..."
        npm test -- --coverage --passWithNoTests 2>&1 | Tee-Object -Variable testOutput | Out-Host
    } else {
        Write-Host "Running backend tests..."
        npm test -- --passWithNoTests 2>&1 | Tee-Object -Variable testOutput | Out-Host
    }
    
    if ($LASTEXITCODE -eq 0) {
        WriteSuccess "Backend tests passed"
        $TestResults.BackendPassed = $true
        
        if ($Coverage -and (Test-Path "coverage/lcov-report/index.html")) {
            Write-Host "`nCoverage report: backend/coverage/lcov-report/index.html"
        }
    } else {
        WriteFailure "Backend tests failed"
        $TestResults.BackendPassed = $false
    }
    
    Set-Location ..
} catch {
    WriteFailure "Failed to run backend tests: $_"
    Set-Location ..
}

#
# STEP 3: Run Frontend Tests
#
WriteStep "Step 3: Run Frontend Component Tests"
try {
    if ($Coverage) {
        Write-Host "Running frontend tests with coverage..."
        npm test -- --run 2>&1 | Tee-Object -Variable testOutput | Out-Host
    } else {
        Write-Host "Running frontend tests..."
        npm test -- --run 2>&1 | Tee-Object -Variable testOutput | Out-Host
    }
    
    if ($LASTEXITCODE -eq 0) {
        WriteSuccess "Frontend tests passed"
        $TestResults.FrontendPassed = $true
        
        if ($Coverage -and (Test-Path "coverage/lcov-report/index.html")) {
            Write-Host "`nCoverage report: coverage/lcov-report/index.html"
        }
    } else {
        WriteFailure "Frontend tests failed"
        $TestResults.FrontendPassed = $false
    }
} catch {
    WriteFailure "Failed to run frontend tests: $_"
}

#
# STEP 4: Run E2E Test (if prerequisites met)
#
WriteStep "Step 4: Run E2E Regression Test"

Write-Host "Checking E2E prerequisites..."
$prereqsMet = $true

# Check kubectl
try {
    kubectl version --client --output=yaml | Out-Null
    WriteSuccess "kubectl available"
} catch {
    WriteFailure "kubectl not found - install via 'choco install kubernetes-cli'"
    $prereqsMet = $false
}

# Check cluster
if ($prereqsMet) {
    try {
        kubectl cluster-info | Out-Null
        WriteSuccess "Kubernetes cluster accessible"
    } catch {
        WriteFailure "Kubernetes cluster not accessible - run 'cd infra && .\setup-kind.ps1'"
        $prereqsMet = $false
    }
}

if ($prereqsMet) {
    Write-Host "Running E2E test..."
    try {
        if (Test-Path "test-e2e-guardrails.ps1") {
            .\test-e2e-guardrails.ps1 2>&1 | Tee-Object -Variable testOutput | Out-Host
            
            if ($LASTEXITCODE -eq 0) {
                WriteSuccess "E2E test passed"
                $TestResults.E2EPassed = $true
            } else {
                WriteFailure "E2E test failed"
                $TestResults.E2EPassed = $false
            }
        } catch {
            WriteFailure "Failed to run E2E test: $_"
            $TestResults.E2EPassed = $false
        }
    } else {
        WriteFailure "E2E prerequisites not met, skipping"
        $TestResults.E2EPassed = $null
    }
} else {
    Write-Host "Skipping E2E test - prerequisites not met" -ForegroundColor Yellow
    $TestResults.E2EPassed = $null
}

#
# SUMMARY
#
Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                        TEST SUMMARY                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($TestResults.BackendPassed) {
    WriteSuccess "Backend Unit Tests: PASSED"
} else {
    WriteFailure "Backend Unit Tests: FAILED"
}

if ($TestResults.FrontendPassed) {
    WriteSuccess "Frontend Component Tests: PASSED"
} else {
    WriteFailure "Frontend Component Tests: FAILED"
}

if ($null -eq $TestResults.E2EPassed) {
    Write-Host "[SKIP] E2E Regression Test: SKIPPED" -ForegroundColor Yellow
} elseif ($TestResults.E2EPassed) {
    WriteSuccess "E2E Regression Test: PASSED"
} else {
    WriteFailure "E2E Regression Test: FAILED"
}

$allPassed = $TestResults.BackendPassed -and $TestResults.FrontendPassed -and ($null -eq $TestResults.E2EPassed -or $TestResults.E2EPassed)

if ($allPassed) {
    Write-Host "`n[SUCCESS] All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n[FAILURE] Some tests failed" -ForegroundColor Red
    exit 1
}
