# Comprehensive System Smoke Test Runner for Windows
# This script runs the comprehensive smoke test for the system management module

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting Comprehensive System Smoke Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend is not running" -ForegroundColor Red
    Write-Host "Please start the backend server first:"
    Write-Host "  cd backend; go run main.go"
    exit 1
}

# Check if frontend is running
Write-Host "Checking if frontend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✓ Frontend is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend is not running" -ForegroundColor Red
    Write-Host "Please start the frontend server first:"
    Write-Host "  cd frontend; npm run dev"
    exit 1
}

Write-Host ""
Write-Host "Running smoke test..." -ForegroundColor Yellow
Write-Host ""

# Create test results directory
New-Item -ItemType Directory -Force -Path "frontend/test-results/smoke" | Out-Null

# Run the test
Push-Location frontend
try {
    npx playwright test tests/system-management-functional.spec.ts --project=chromium
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Smoke Test Completed" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Screenshots and results saved in: frontend/test-results/smoke/"
    Write-Host ""
    Write-Host "To view detailed results:"
    Write-Host "  npx playwright show-report"
} finally {
    Pop-Location
}
