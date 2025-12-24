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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo -e "${RED}❌ Deno is not installed. Please install Deno first.${NC}"
    echo "Visit: https://deno.land/"
    exit 1
fi
echo -e "${GREEN}✓ Deno is installed ($(deno --version | head -n1))${NC}"

# Start PostgreSQL
echo ""
echo -e "${YELLOW}Starting PostgreSQL database...${NC}"
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Check if database is running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
    exit 1
fi

# Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
deno install

# Run migrations
echo ""
echo -e "${YELLOW}Running database migrations...${NC}"
deno task migrate:latest

# Seed database
echo ""
echo -e "${YELLOW}Seeding database with test data...${NC}"
deno task seed

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
