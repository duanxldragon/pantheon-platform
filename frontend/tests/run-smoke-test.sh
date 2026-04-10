#!/bin/bash

# System Management Smoke Test Runner
# This script runs the tenant setup + system management functional smoke test

set -e

echo "========================================="
echo "Starting System Management Smoke Test"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "Checking if backend is running..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "Please start the backend server first:"
    echo "  cd backend && go run main.go"
    exit 1
fi

# Check if frontend is running
echo "Checking if frontend is running..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend is not running${NC}"
    echo "Please start the frontend server first:"
    echo "  cd frontend && npm run dev"
    exit 1
fi

echo ""
echo "Running smoke test..."
echo ""

# Create test results directory
mkdir -p frontend/test-results/smoke

# Run the test
cd frontend
npx playwright test tests/system-management-functional.spec.ts --project=chromium

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Smoke Test Completed${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Screenshots and results saved in: frontend/test-results/smoke/"
echo ""
echo "To view detailed results:"
echo "  npx playwright show-report"
