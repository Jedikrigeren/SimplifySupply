#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ALL_OK=true

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    ALL_OK=false
else
    echo -e "${GREEN}✓ Docker is running${NC}"
fi

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo -e "${RED}❌ Deno is not installed. Please install Deno first.${NC}"
    echo "Visit: https://deno.land/"
    ALL_OK=false
else
    echo -e "${GREEN}✓ Deno is installed ($(deno --version | head -n1))${NC}"
fi

if [ "$ALL_OK" = false ]; then
    exit 1
fi
