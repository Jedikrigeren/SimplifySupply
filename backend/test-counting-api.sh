#!/bin/bash

# Test script for Counting Sessions API
# Prerequisites: Backend server running, user authenticated

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3000/api"
TOKEN=""

echo -e "${YELLOW}=== Counting Sessions API Test Script ===${NC}\n"

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
    fi
    echo
}

# Step 1: Login to get token
echo -e "${YELLOW}1. Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"\(.*\)"/\1/')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get authentication token${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Logged in successfully${NC}"
echo

# Step 2: Create a new counting session
echo -e "${YELLOW}2. Creating new counting session...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/counting-sessions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "warehouseCode": "01"
  }')

SESSION_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')

if [ -z "$SESSION_ID" ]; then
    echo -e "${RED}Failed to create session${NC}"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

echo "Session ID: $SESSION_ID"
print_result 0

# Step 3: Get session details
echo -e "${YELLOW}3. Getting session details...${NC}"
GET_RESPONSE=$(curl -s -X GET "$API_BASE/counting-sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$GET_RESPONSE" | grep -q "\"success\":true"
print_result $?

# Step 4: List all sessions
echo -e "${YELLOW}4. Listing all sessions...${NC}"
LIST_RESPONSE=$(curl -s -X GET "$API_BASE/counting-sessions" \
  -H "Authorization: Bearer $TOKEN")

echo "$LIST_RESPONSE" | grep -q "\"success\":true"
print_result $?

# Step 5: Add an item to the session
echo -e "${YELLOW}5. Adding item to session...${NC}"
ADD_ITEM_RESPONSE=$(curl -s -X POST "$API_BASE/counting-sessions/$SESSION_ID/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "itemCode": "A00001",
    "countedQuantity": 10,
    "countedUom": "EA"
  }')

ITEM_ID=$(echo $ADD_ITEM_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')

if [ -z "$ITEM_ID" ]; then
    echo -e "${RED}Failed to add item${NC}"
    echo "Response: $ADD_ITEM_RESPONSE"
else
    echo "Item ID: $ITEM_ID"
    print_result 0
fi

# Step 6: Update the item
if [ ! -z "$ITEM_ID" ]; then
    echo -e "${YELLOW}6. Updating item quantity...${NC}"
    UPDATE_ITEM_RESPONSE=$(curl -s -X PUT "$API_BASE/counting-sessions/$SESSION_ID/items/$ITEM_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "countedQuantity": 15
      }')
    
    echo "$UPDATE_ITEM_RESPONSE" | grep -q "\"success\":true"
    print_result $?
fi

# Step 7: Pause the session
echo -e "${YELLOW}7. Pausing session...${NC}"
PAUSE_RESPONSE=$(curl -s -X PATCH "$API_BASE/counting-sessions/$SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "paused"
  }')

echo "$PAUSE_RESPONSE" | grep -q "\"success\":true"
print_result $?

# Step 8: Resume the session
echo -e "${YELLOW}8. Resuming session...${NC}"
RESUME_RESPONSE=$(curl -s -X PATCH "$API_BASE/counting-sessions/$SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "active"
  }')

echo "$RESUME_RESPONSE" | grep -q "\"success\":true"
print_result $?

# Step 9: Delete the item
if [ ! -z "$ITEM_ID" ]; then
    echo -e "${YELLOW}9. Deleting item from session...${NC}"
    DELETE_ITEM_RESPONSE=$(curl -s -X DELETE "$API_BASE/counting-sessions/$SESSION_ID/items/$ITEM_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$DELETE_ITEM_RESPONSE" | grep -q "\"success\":true"
    print_result $?
fi

# Step 10: Delete the session
echo -e "${YELLOW}10. Deleting session...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE/counting-sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$DELETE_RESPONSE" | grep -q "\"success\":true"
print_result $?

echo -e "${GREEN}=== All tests completed ===${NC}"
