#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
deno task migrate:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migrations failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Migrations completed${NC}"

# Seed database
echo -e "${YELLOW}Seeding database with test data...${NC}"
deno task seed

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Seeding failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database seeded${NC}"
