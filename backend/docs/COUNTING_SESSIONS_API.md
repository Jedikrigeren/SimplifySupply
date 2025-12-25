# Counting Sessions API Documentation

## Overview
The Counting Sessions API provides endpoints for managing inventory counting sessions. Each session represents a warehouse counting activity where items are scanned and quantities are recorded before submission to SAP Business One.

## Base URL
```
/api/counting-sessions
```

All endpoints require authentication via Bearer token in the Authorization header.

## Data Models

### CountingSession
```typescript
{
  id: string;                    // UUID
  user_id: string;               // UUID of user who created the session
  warehouse_code: string;        // Warehouse being counted (e.g., "01")
  status: 'active' | 'paused' | 'completed' | 'submitted';
  started_at: Date;
  paused_at?: Date;
  completed_at?: Date;
  submitted_at?: Date;
  session_reference?: string;    // Reference ID for SAP submission
  sap_doc_entry?: number;        // SAP document entry number after posting
  sap_doc_num?: number;          // SAP document number after posting
  items?: CountedItem[];         // Array of counted items (when fetching with details)
}
```

### CountedItem
```typescript
{
  id: string;                    // UUID
  session_id: string;            // Parent session UUID
  item_code: string;             // SAP item code
  counted_quantity: number;      // Total counted quantity
  counted_uom: string;           // Unit of measure used for counting
  warehouse_code: string;        // Warehouse code
  counted_at: Date;
  batches?: CountedBatch[];      // Array of batch details (for batch-managed items)
}
```

### CountedBatch
```typescript
{
  id: string;                    // UUID
  counted_item_id: string;       // Parent counted item UUID
  batch_number: string;          // Batch/serial number
  counted_quantity: number;      // Quantity for this batch
}
```

## Endpoints

### 1. Create Counting Session
**POST** `/api/counting-sessions`

Create a new counting session for a warehouse.

**Request Body:**
```json
{
  "warehouseCode": "01"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "user_id": "uuid",
    "warehouse_code": "01",
    "status": "active",
    "started_at": "2024-01-15T10:00:00Z"
  }
}
```

**Errors:**
- `400` - warehouseCode is required
- `401` - Unauthorized (invalid/missing token)
- `500` - Server error

---

### 2. List Counting Sessions
**GET** `/api/counting-sessions?status=active`

Get all counting sessions for the current user.

**Query Parameters:**
- `status` (optional) - Filter by status: `active`, `paused`, `completed`, `submitted`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "sessions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "warehouse_code": "01",
      "status": "active",
      "started_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": "uuid2",
      "user_id": "uuid",
      "warehouse_code": "02",
      "status": "paused",
      "started_at": "2024-01-14T14:00:00Z",
      "paused_at": "2024-01-14T16:30:00Z"
    }
  ]
}
```

---

### 3. Get Session Details
**GET** `/api/counting-sessions/:id`

Get a specific counting session with all counted items and batches.

**Response:** `200 OK`
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "user_id": "uuid",
    "warehouse_code": "01",
    "status": "active",
    "started_at": "2024-01-15T10:00:00Z",
    "items": [
      {
        "id": "item-uuid",
        "session_id": "uuid",
        "item_code": "A00001",
        "counted_quantity": 15,
        "counted_uom": "EA",
        "warehouse_code": "01",
        "counted_at": "2024-01-15T10:15:00Z",
        "batches": [
          {
            "id": "batch-uuid",
            "counted_item_id": "item-uuid",
            "batch_number": "BATCH001",
            "counted_quantity": 10
          },
          {
            "id": "batch-uuid2",
            "counted_item_id": "item-uuid",
            "batch_number": "BATCH002",
            "counted_quantity": 5
          }
        ]
      }
    ]
  }
}
```

**Errors:**
- `403` - Unauthorized (session belongs to another user)
- `404` - Session not found

---

### 4. Update Session Status
**PATCH** `/api/counting-sessions/:id`

Update the status of a counting session (pause, resume, or complete).

**Request Body:**
```json
{
  "status": "paused"
}
```

**Valid Status Transitions:**
- `active` → `paused` (pause counting)
- `paused` → `active` (resume counting)
- `active` → `completed` (mark as completed, ready for submission)

**Response:** `200 OK`
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "status": "paused",
    "paused_at": "2024-01-15T11:30:00Z"
  }
}
```

**Errors:**
- `400` - Invalid status value
- `403` - Unauthorized (session belongs to another user)
- `404` - Session not found

---

### 5. Delete Session
**DELETE** `/api/counting-sessions/:id`

Delete a counting session and all associated items and batches.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Session deleted"
}
```

**Errors:**
- `403` - Unauthorized (session belongs to another user)
- `404` - Session not found

---

### 6. Add Item to Session
**POST** `/api/counting-sessions/:id/items`

Add a counted item to the session.

**Request Body:**
```json
{
  "itemCode": "A00001",
  "countedQuantity": 10,
  "countedUom": "EA",
  "batches": [
    {
      "batchNumber": "BATCH001",
      "countedQuantity": 6
    },
    {
      "batchNumber": "BATCH002",
      "countedQuantity": 4
    }
  ]
}
```

**Note:** The `batches` field is optional and only used for batch-managed items. If provided, the sum of batch quantities should equal `countedQuantity`.

**Response:** `201 Created`
```json
{
  "success": true,
  "item": {
    "id": "item-uuid",
    "session_id": "uuid",
    "item_code": "A00001",
    "counted_quantity": 10,
    "counted_uom": "EA",
    "warehouse_code": "01",
    "counted_at": "2024-01-15T10:15:00Z",
    "batches": [
      {
        "id": "batch-uuid",
        "counted_item_id": "item-uuid",
        "batch_number": "BATCH001",
        "counted_quantity": 6
      },
      {
        "id": "batch-uuid2",
        "counted_item_id": "item-uuid",
        "batch_number": "BATCH002",
        "counted_quantity": 4
      }
    ]
  }
}
```

**Errors:**
- `400` - Missing required fields (itemCode, countedQuantity, countedUom)
- `400` - Session must be active to add items
- `403` - Unauthorized (session belongs to another user)
- `404` - Session not found

---

### 7. Update Item
**PUT** `/api/counting-sessions/:id/items/:itemId`

Update a counted item's quantity and/or batches.

**Request Body:**
```json
{
  "countedQuantity": 15,
  "batches": [
    {
      "batchNumber": "BATCH001",
      "countedQuantity": 9
    },
    {
      "batchNumber": "BATCH002",
      "countedQuantity": 6
    }
  ]
}
```

**Note:** Updating batches will replace all existing batches with the new ones provided.

**Response:** `200 OK`
```json
{
  "success": true,
  "item": {
    "id": "item-uuid",
    "counted_quantity": 15,
    "batches": [...]
  }
}
```

**Errors:**
- `400` - countedQuantity is required
- `403` - Unauthorized (session belongs to another user)
- `404` - Session or item not found

---

### 8. Delete Item
**DELETE** `/api/counting-sessions/:id/items/:itemId`

Remove an item (and all its batches) from the session.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Item removed"
}
```

**Errors:**
- `403` - Unauthorized (session belongs to another user)
- `404` - Session not found

---

### 9. Submit Session to SAP
**POST** `/api/counting-sessions/:id/submit`

Submit the counting session to SAP Business One. This will:
1. Validate all items and batches
2. Convert quantities to InventoryUoM
3. Calculate differences vs. current stock
4. Post InventoryPosting document to SAP
5. Update session status to 'submitted'

**Request Body:**
```json
{
  "countedBy": "John Doe"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "docEntry": 12345,
  "docNum": 1001,
  "postingDate": "2024-01-15"
}
```

**Errors:**
- `400` - countedBy is required
- `400` - No items to submit
- `403` - Unauthorized (session belongs to another user)
- `404` - Session not found
- `500` - SAP posting error (e.g., item not found, insufficient quantity)

**SAP Document Created:**
After successful submission, an InventoryPosting document is created in SAP with:
- Lines for each item showing counted quantity vs. system quantity
- Batch details for batch-managed items
- Reference to the counting session ID
- User who performed the count

---

## Workflow Example

### Typical Counting Session Flow

1. **Start Session**
   ```
   POST /api/counting-sessions
   { "warehouseCode": "01" }
   → Returns session with status "active"
   ```

2. **Scan and Count Items**
   ```
   POST /api/counting-sessions/{id}/items
   { "itemCode": "A00001", "countedQuantity": 10, "countedUom": "EA" }
   
   POST /api/counting-sessions/{id}/items
   { "itemCode": "A00002", "countedQuantity": 5, "countedUom": "BOX" }
   ```

3. **Adjust if Needed**
   ```
   PUT /api/counting-sessions/{id}/items/{itemId}
   { "countedQuantity": 12 }
   ```

4. **Pause for Break (Optional)**
   ```
   PATCH /api/counting-sessions/{id}
   { "status": "paused" }
   
   ... later ...
   
   PATCH /api/counting-sessions/{id}
   { "status": "active" }
   ```

5. **Submit to SAP**
   ```
   POST /api/counting-sessions/{id}/submit
   { "countedBy": "John Doe" }
   → Posts to SAP, updates session status to "submitted"
   ```

---

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Resource created
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not allowed to access this resource)
- `404` - Resource not found
- `500` - Internal server error

---

## Authentication

All endpoints require a valid JWT token obtained from the `/api/auth/login` endpoint.

**Request Header:**
```
Authorization: Bearer <your-jwt-token>
```

The `userId` is automatically extracted from the token and used to ensure users can only access their own sessions.

---

## Notes

- Sessions can only be modified by the user who created them
- Items can only be added when the session status is "active"
- Submitted sessions cannot be modified
- Deleting a session cascades to all items and batches
- Batch-managed items should include batch details matching the total counted quantity
- The system automatically converts UoM to InventoryUoM before posting to SAP
