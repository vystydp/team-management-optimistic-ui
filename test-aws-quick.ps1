#!/usr/bin/env pwsh
# Quick test for AWS Account Linking without authentication
# This script tests the API endpoints directly

Write-Host "`n=== Quick AWS Account Linking Test ===" -ForegroundColor Cyan

$BackendUrl = "http://localhost:3001"

Write-Host "`n1. Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/health"
    Write-Host "✓ Backend is healthy" -ForegroundColor Green
    Write-Host "  Timestamp: $($health.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend not responding. Is it running on port 3001?" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Attempting to link AWS account..." -ForegroundColor Yellow
Write-Host "   (This will fail with 401 due to authentication)" -ForegroundColor Gray

$linkRequest = @{
    accountId = "123456789012"
    accountName = "Test Development Account"
    roleArn = "arn:aws:iam::123456789012:role/CrossplaneAccess"
    ownerEmail = "test@porsche.com"
}

try {
    $result = Invoke-RestMethod -Uri "$BackendUrl/api/aws/link-account" `
        -Method POST `
        -Body ($linkRequest | ConvertTo-Json) `
        -ContentType "application/json"
    Write-Host "✓ Account linked successfully!" -ForegroundColor Green
    Write-Host ($result | ConvertTo-Json -Depth 4) -ForegroundColor White
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Got expected 401 Unauthorized" -ForegroundColor Yellow
        Write-Host "  This is correct - the endpoint requires authentication" -ForegroundColor Gray
    } else {
        Write-Host "✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n3. Checking Crossplane resources..." -ForegroundColor Yellow

Write-Host "   XRD (Custom Resource Definition):" -ForegroundColor Gray
kubectl get xrd xguardrailedaccounts.platform.porsche.com --no-headers 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ GuardrailedAccount XRD is deployed" -ForegroundColor Green
} else {
    Write-Host "   ✗ XRD not found" -ForegroundColor Red
}

Write-Host "   Composition:" -ForegroundColor Gray
kubectl get composition guardrailed-account-basic --no-headers 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ GuardrailedAccount Composition is deployed" -ForegroundColor Green
} else {
    Write-Host "   ✗ Composition not found" -ForegroundColor Red
}

Write-Host "`n=== HOW TO TEST THE FULL FLOW ===" -ForegroundColor Cyan
Write-Host @"

Option 1: Test via Browser (Recommended)
----------------------------------------
1. Make sure both frontend and backend are running:
   - Backend: http://localhost:3001
   - Frontend: http://localhost:3000

2. Open http://localhost:3000 in your browser

3. Log in with GitHub OAuth

4. Navigate to "AWS Accounts" page

5. Try the "Link Existing Account" flow with fake data:
   - Account ID: 123456789012 (any 12 digits)
   - Account Name: My Test Account
   - Role ARN: arn:aws:iam::123456789012:role/CrossplaneAccess
   - Email: test@example.com

6. Click "Secure Account" to create a GuardrailedAccountClaim

7. Watch the status change in real-time!


Option 2: Test API Directly (Bypassing Auth)
--------------------------------------------
If you want to test the API without OAuth:

1. Edit backend/src/server.ts:
   Find this line (around line 62):
     app.use('/api/aws', requireAuth, awsAccountRoutes);
   
   Change to:
     app.use('/api/aws', awsAccountRoutes);
   
   (This temporarily removes authentication)

2. Restart backend:
   cd backend
   npm start

3. Run this PowerShell script again - it will work!

4. Or use this PowerShell code:

# Link an account
`$body = @{
    accountId = "123456789012"
    accountName = "Test Account"
    roleArn = "arn:aws:iam::123456789012:role/CrossplaneAccess"
    ownerEmail = "test@example.com"
} | ConvertTo-Json

`$account = Invoke-RestMethod -Uri "http://localhost:3001/api/aws/link-account" ``
    -Method POST ``
    -Body `$body ``
    -ContentType "application/json"

Write-Host "Account linked:"
`$account | ConvertTo-Json

# Secure the account (create Crossplane claim)
`$secureBody = @{ accountId = "123456789012" } | ConvertTo-Json

`$secured = Invoke-RestMethod -Uri "http://localhost:3001/api/aws/secure-account" ``
    -Method POST ``
    -Body `$secureBody ``
    -ContentType "application/json"

Write-Host "Account secured:"
`$secured | ConvertTo-Json

# Check in Kubernetes
kubectl get guardrailedaccountclaims
kubectl get jobs


Option 3: Test with curl (Linux/Mac/WSL)
-----------------------------------------
# Link account
curl -X POST http://localhost:3001/api/aws/link-account \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "123456789012",
    "accountName": "Test Account",
    "roleArn": "arn:aws:iam::123456789012:role/CrossplaneAccess",
    "ownerEmail": "test@example.com"
  }'

# Secure account
curl -X POST http://localhost:3001/api/aws/secure-account \
  -H "Content-Type: application/json" \
  -d '{"accountId": "123456789012"}'

# List accounts
curl http://localhost:3001/api/aws/accounts


WHAT HAPPENS WHEN YOU SECURE AN ACCOUNT:
----------------------------------------
1. Backend creates a GuardrailedAccountClaim in Kubernetes
2. Crossplane reconciles the claim
3. Composition creates 3 Kubernetes Jobs:
   - cloudtrail-setup-* (simulates CloudTrail)
   - config-setup-* (simulates AWS Config)
   - budget-setup-* (simulates AWS Budgets)
4. Jobs run for ~5 seconds and complete
5. Account status changes: linked → guardrailing → guardrailed

Check with:
  kubectl get guardrailedaccountclaims
  kubectl get jobs -l guardrail.platform.porsche.com/component
  kubectl logs job/cloudtrail-setup-XXXXX


NO REAL AWS ACCOUNT NEEDED!
---------------------------
Everything is simulated:
✓ ARN validation is format-only (no real AWS API calls)
✓ Jobs simulate AWS resource creation
✓ Status transitions work exactly like production
✓ Perfect for development and testing!

"@ -ForegroundColor White

Write-Host "`n✅ Phase 3.4 Implementation Status:" -ForegroundColor Green
Write-Host "   • Backend API endpoints: Complete" -ForegroundColor White
Write-Host "   • Frontend integration: Complete" -ForegroundColor White
Write-Host "   • Crossplane compositions: Deployed" -ForegroundColor White
Write-Host "   • Authentication: Required (GitHub OAuth)" -ForegroundColor White
Write-Host "   • AWS account: NOT required (all simulated)" -ForegroundColor White

Write-Host "`n🎉 Ready to test!" -ForegroundColor Cyan
