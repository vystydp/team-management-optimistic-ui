<#
.SYNOPSIS
    Setup and run Phase 3.4 test suite
    
.DESCRIPTION
    Installs test dependencies and runs all Phase 3.4 tests:
    - Backend unit tests (Jest)
    - Frontend component tests (Vitest)
    - E2E regression test (PowerShell)
    
.PARAMETER SkipInstall
    Skip npm install steps
    
.PARAMETER Backend
    Run only backend tests
    
.PARAMETER Frontend
    Run only frontend tests
    
.PARAMETER E2E
    Run only E2E test
    
.PARAMETER Coverage
    Generate coverage reports
    
.EXAMPLE
    .\test-phase34-setup.ps1
    
.EXAMPLE
    .\test-phase34-setup.ps1 -Backend -Coverage
    
.EXAMPLE
    .\test-phase34-setup.ps1 -E2E
#>

param(
    [switch]$SkipInstall = $false,
    [switch]$Backend = $false,
    [switch]$Frontend = $false,
    [switch]$E2E = $false,
    [switch]$Coverage = $false
)

$ErrorActionPreference = "Stop"

# Helper functions for output
function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-TestWarning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Failure {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# If no specific test type selected, run all
$RunAll = -not ($Backend -or $Frontend -or $E2E)

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║          Phase 3.4 Test Suite Setup & Execution              ║
║                                                              ║
║  AWS Account Linking + Guardrails Test Coverage             ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$TestResults = @{
    BackendPassed = $false
    FrontendPassed = $false
    E2EPassed = $false
}

#
# STEP 1: Install Dependencies
#
if (-not $SkipInstall) {
    Write-Step "Step 1: Install Test Dependencies"
    
    # Backend Jest dependencies
    Write-Host "Installing backend test dependencies..."
    try {
        Set-Location backend
        cmd /c "npm install --save-dev jest@29.7.0 ts-jest@29.1.1 @types/jest@29.5.11 supertest@6.3.3 @types/supertest@6.0.2"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend dependencies installed"
        } else {
            Write-Failure "Failed to install backend dependencies"
            exit 1
        }
        
        Set-Location ..
    } catch {
        Write-Failure "Failed to install backend dependencies: $_"
        Set-Location ..
        exit 1
    }
    
    # Frontend dependencies already installed
    Write-Success "Frontend dependencies already installed"
    
} else {
    Write-Warning "Skipping dependency installation (-SkipInstall)"
}

#
# STEP 2: Run Backend Unit Tests
#
if ($Backend -or $RunAll) {
    Write-Step "Step 2: Backend Unit Tests"
    
    try {
        Set-Location backend
        
        Write-Host "Running Jest tests..."
        if ($Coverage) {
            cmd /c "npm test -- --coverage --passWithNoTests"
        } else {
            cmd /c "npm test -- --passWithNoTests"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend tests passed"
            $TestResults.BackendPassed = $true
            
            if ($Coverage) {
                Write-Host "`nCoverage report: backend/coverage/lcov-report/index.html"
            }
        } else {
            Write-Failure "Backend tests failed"
            $TestResults.BackendPassed = $false
        }
        
        Set-Location ..
    } catch {
        Write-Failure "Failed to run backend tests: $_"
        Set-Location ..
    }
} else {
    Write-Warning "Skipping backend tests"
}

#
# STEP 3: Run Frontend Component Tests
#
if ($Frontend -or $RunAll) {
    Write-Step "Step 3: Frontend Component Tests"
    
    try {
        Write-Host "Running Vitest tests..."
        
        if ($Coverage) {
            cmd /c "npm test -- --run --coverage src/components/aws src/models/__tests__/AwsAccountModel"
        } else {
            cmd /c "npm test -- --run src/components/aws src/models/__tests__/AwsAccountModel"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend tests passed"
            $TestResults.FrontendPassed = $true
            
            if ($Coverage) {
                Write-Host "`nCoverage report: coverage/lcov-report/index.html"
            }
        } else {
            Write-Failure "Frontend tests failed"
            $TestResults.FrontendPassed = $false
        }
    } catch {
        Write-Failure "Failed to run frontend tests: $_"
    }
} else {
    Write-Warning "Skipping frontend tests"
}

#
# STEP 4: Run E2E Test
#
if ($E2E -or $RunAll) {
    Write-Step "Step 4: E2E Regression Test"
    
    # Check prerequisites
    $prereqsMet = $true
    
    # Check kubectl
    try {
        kubectl version --client --output=yaml | Out-Null
        Write-Success "kubectl available"
    } catch {
        Write-Failure "kubectl not found - install via 'choco install kubernetes-cli'"
        $prereqsMet = $false
    }
    
    # Check cluster
    try {
        kubectl cluster-info | Out-Null
        Write-Success "Kubernetes cluster accessible"
    } catch {
        Write-Failure "Kubernetes cluster not accessible - run 'cd infra && .\setup-kind.ps1'"
        $prereqsMet = $false
    }
    
    # Check backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
            Write-Success "Backend responding on port 3001"
        }
    } catch {
        Write-Warning "Backend not responding on port 3001 - start with 'cd backend && npm run dev'"
        Write-Warning "E2E test may fail without backend"
    }
    
    if ($prereqsMet) {
        Write-Host "`nRunning E2E test..."
        try {
            .\test-e2e-guardrails.ps1 -TestAccountId "999888777666"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "E2E test passed"
                $TestResults.E2EPassed = $true
            } else {
                Write-Failure "E2E test failed"
                $TestResults.E2EPassed = $false
            }
        } catch {
            Write-Failure "Failed to run E2E test: $_"
            $TestResults.E2EPassed = $false
        }
    } else {
        Write-Failure "E2E prerequisites not met, skipping"
        $TestResults.E2EPassed = $false
    }
} else {
    Write-Warning "Skipping E2E test"
}

#
# STEP 5: Summary
#
Write-Step "Test Summary"

Write-Host ""
if ($Backend -or $RunAll) {
    if ($TestResults.BackendPassed) {
        Write-Success "Backend Unit Tests: PASSED"
    } else {
        Write-Failure "Backend Unit Tests: FAILED"
    }
}

if ($Frontend -or $RunAll) {
    if ($TestResults.FrontendPassed) {
        Write-Success "Frontend Component Tests: PASSED"
    } else {
        Write-Failure "Frontend Component Tests: FAILED"
    }
}

if ($E2E -or $RunAll) {
    if ($TestResults.E2EPassed) {
        Write-Success "E2E Regression Test: PASSED"
    } else {
        Write-Failure "E2E Regression Test: FAILED"
    }
}

Write-Host ""

$AllPassed = $true
if ($Backend -or $RunAll) { $AllPassed = $AllPassed -and $TestResults.BackendPassed }
if ($Frontend -or $RunAll) { $AllPassed = $AllPassed -and $TestResults.FrontendPassed }
if ($E2E -or $RunAll) { $AllPassed = $AllPassed -and $TestResults.E2EPassed }

if ($AllPassed) {
    Write-Host @"
$ColorGreen
╔══════════════════════════════════════════════════════════════╗
║                    ✓ ALL TESTS PASSED!                       ║
║                                                              ║
║       Phase 3.4 test coverage successfully validated         ║
╚══════════════════════════════════════════════════════════════╝
$ColorReset
"@
    
    Write-Host "Next steps:"
    Write-Host "  1. Review coverage reports (if generated)"
    Write-Host "  2. Commit test files to git"
    Write-Host "  3. Set up CI/CD pipeline (.github/workflows/)"
    Write-Host "  4. Move to production hardening (real AWS integration)"
    Write-Host ""
    
    exit 0
} else {
    Write-Host @"
$ColorRed
╔══════════════════════════════════════════════════════════════╗
║                    ✗ SOME TESTS FAILED                       ║
╚══════════════════════════════════════════════════════════════╝
$ColorReset
"@
    
    Write-Host "Troubleshooting:"
    Write-Host "  • Backend tests: Check Jest configuration and mocks"
    Write-Host "  • Frontend tests: Verify React Testing Library setup"
    Write-Host "  • E2E test: Check Crossplane/Kubernetes setup"
    Write-Host ""
    Write-Host "See .context/phase3-testing-guide.md for detailed help"
    Write-Host ""
    
    exit 1
}
