#!/bin/bash

# API Testing Script for Warehouse Helper Backend
# This script tests the authentication endpoints

BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo "Testing Warehouse Helper API"
echo "======================================"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" ${BASE_URL}/health)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 2: Register a new user
echo -e "${YELLOW}Test 2: Register a new user${NC}"
RANDOM_USER="testuser_$(date +%s)"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${RANDOM_USER}\",\"email\":\"${RANDOM_USER}@test.com\",\"password\":\"TestPass123\",\"fullName\":\"Test User\"}")
HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Registration successful${NC}"
    echo "User: ${RANDOM_USER}"
else
    echo -e "${RED}✗ Registration failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Login with valid credentials
echo -e "${YELLOW}Test 3: Login with valid credentials${NC}"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password123"}')
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
    REFRESH_TOKEN=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*' | sed 's/"refreshToken":"//')
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
    echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
    TOKEN=$ACCESS_TOKEN
else
    echo -e "${RED}✗ Login failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
    TOKEN=""
    REFRESH_TOKEN=""
fi
echo ""

# Test 4: Get user profile (requires valid token)
if [ -n "$TOKEN" ]; then
    echo -e "${YELLOW}Test 4: Get user profile${NC}"
    PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/auth/me \
        -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$PROFILE_RESPONSE" | tail -n1)
    BODY=$(echo "$PROFILE_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Profile fetch successful${NC}"
        echo "Response: $BODY"
    else
        echo -e "${RED}✗ Profile fetch failed (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""

    # Test 5: Verify token
    echo -e "${YELLOW}Test 5: Verify token${NC}"
    VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/auth/verify \
        -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
    BODY=$(echo "$VERIFY_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Token verification successful${NC}"
        echo "Response: $BODY"
    else
        echo -e "${RED}✗ Token verification failed (HTTP $HTTP_CODE)${NC}"
    fi
    echo ""

    # Test 6: Refresh token
    if [ -n "$REFRESH_TOKEN" ]; then
        echo -e "${YELLOW}Test 6: Refresh access token${NC}"
        REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/auth/refresh \
            -H "Content-Type: application/json" \
            -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
        HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
        BODY=$(echo "$REFRESH_RESPONSE" | sed '$d')

        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ Token refresh successful${NC}"
            NEW_ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
            NEW_REFRESH_TOKEN=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*' | sed 's/"refreshToken":"//')
            echo "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
            echo "New Refresh Token: ${NEW_REFRESH_TOKEN:0:50}..."
            # Use new tokens for subsequent tests
            TOKEN=$NEW_ACCESS_TOKEN
            REFRESH_TOKEN=$NEW_REFRESH_TOKEN
        else
            echo -e "${RED}✗ Token refresh failed (HTTP $HTTP_CODE)${NC}"
            echo "Response: $BODY"
        fi
        echo ""
    fi

    # Test 7: Logout
    echo -e "${YELLOW}Test 7: Logout${NC}"
    LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/auth/logout \
        -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n1)
    BODY=$(echo "$LOGOUT_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Logout successful${NC}"
        echo "Response: $BODY"
    else
        echo -e "${RED}✗ Logout failed (HTTP $HTTP_CODE)${NC}"
    fi
    echo ""

    # Test 8: Try to use access token after logout (should be blacklisted)
    echo -e "${YELLOW}Test 8: Access token blacklist verification${NC}"
    BLACKLIST_TEST=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/auth/me \
        -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$BLACKLIST_TEST" | tail -n1)
    BODY=$(echo "$BLACKLIST_TEST" | sed '$d')

    if [ "$HTTP_CODE" = "401" ]; then
        if echo "$BODY" | grep -q "revoked"; then
            echo -e "${GREEN}✓ Token blacklist working correctly${NC}"
            echo "Response: $BODY"
        else
            echo -e "${GREEN}✓ Token correctly rejected${NC}"
        fi
    else
        echo -e "${RED}✗ Blacklisted token should be rejected (got HTTP $HTTP_CODE)${NC}"
    fi
    echo ""

    # Test 9: Try to use refresh token after logout (should be invalidated)
    if [ -n "$REFRESH_TOKEN" ]; then
        echo -e "${YELLOW}Test 9: Refresh token invalidation after logout${NC}"
        REFRESH_AFTER_LOGOUT=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/auth/refresh \
            -H "Content-Type: application/json" \
            -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
        HTTP_CODE=$(echo "$REFRESH_AFTER_LOGOUT" | tail -n1)

        if [ "$HTTP_CODE" = "401" ]; then
            echo -e "${GREEN}✓ Refresh token correctly invalidated after logout${NC}"
        else
            echo -e "${RED}✗ Refresh token should be invalid after logout (got HTTP $HTTP_CODE)${NC}"
        fi
        echo ""
    fi
fi

# Test 10: Register with duplicate username
echo -e "${YELLOW}Test 10: Register with duplicate username${NC}"
DUPLICATE_REGISTER=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","email":"duplicate@test.com","password":"TestPass123"}')
HTTP_CODE=$(echo "$DUPLICATE_REGISTER" | tail -n1)

if [ "$HTTP_CODE" = "409" ]; then
    echo -e "${GREEN}✓ Duplicate username correctly rejected${NC}"
else
    echo -e "${RED}✗ Duplicate username should return 409 (got HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 11: Login with invalid credentials
echo -e "${YELLOW}Test 11: Login with invalid credentials${NC}"
INVALID_LOGIN=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"invalid","password":"wrong"}')
HTTP_CODE=$(echo "$INVALID_LOGIN" | tail -n1)
BODY=$(echo "$INVALID_LOGIN" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Invalid login correctly rejected${NC}"
else
    echo -e "${RED}✗ Invalid login should return 401 (got HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 12: Access protected route without token
echo -e "${YELLOW}Test 12: Access protected route without token${NC}"
NO_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/auth/me)
HTTP_CODE=$(echo "$NO_TOKEN_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Unauthorized access correctly rejected${NC}"
else
    echo -e "${RED}✗ Unauthorized access should return 401 (got HTTP $HTTP_CODE)${NC}"
fi
echo ""

echo "======================================"
echo "Test suite completed"
echo "======================================"
