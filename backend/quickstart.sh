#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Warehouse Helper Backend - Quick Start"
echo "======================================"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! bash scripts/check-prerequisites.sh; then
    exit 1
fi
echo ""

# Start database
if ! bash scripts/start-database.sh; then
    exit 1
fi
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
deno install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Setup database
if ! bash scripts/setup-database.sh; then
    exit 1
fi
echo ""

echo -e "${GREEN}======================================"
echo "✓ Setup complete!"
echo "======================================${NC}"
echo ""
echo "Test credentials:"
echo "  Username: admin (or worker1, worker2)"
echo "  Password: password123"
echo ""
echo -e "${YELLOW}Starting development server...${NC}"
echo "API will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
deno task dev
