# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Most endpoints require a JWT token. Include it in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### Health Check

#### GET `/health`
Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-24T12:00:00.000Z"
}
```

---

### Authentication

#### POST `/api/auth/register`
Register a new user account.

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "warehouseLocation": "Main Warehouse"
}
```

**Validation Rules:**
- `username`: 3-50 characters, required
- `email`: Valid email format, required
- `password`: Minimum 8 characters, must contain uppercase, lowercase, and number
- `fullName`: Optional
- `warehouseLocation`: Optional

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "warehouseLocation": "Main Warehouse"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Username or email already exists
- `429` - Rate limit exceeded
- `500` - Server error

---

#### POST `/api/auth/login`
Authenticate a user and receive a JWT token.

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@warehouse.com",
      "fullName": "Admin User",
      "warehouseLocation": "Main Warehouse"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials
- `403` - Account inactive
- `429` - Rate limit exceeded
- `500` - Server error

---

#### POST `/api/auth/logout`
Logout and blacklist the current token.

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**
- `401` - Unauthorized (no token or invalid token)

---

#### GET `/api/auth/me`
Get the current authenticated user's profile.

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@warehouse.com",
    "fullName": "Admin User",
    "warehouseLocation": "Main Warehouse",
    "isActive": true,
    "createdAt": "2023-12-23T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (no token, invalid token, or token revoked)
- `404` - User not found

---

#### GET `/api/auth/verify`
Verify if the current token is valid.

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "userId": "uuid",
    "username": "admin",
    "email": "admin@warehouse.com"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (no token, invalid token, expired token, or token revoked)

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": [] // Optional, for validation errors
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (authenticated but not authorized)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

Rate limits are applied per IP address + User Agent + Endpoint combination.

### Authentication Endpoints
- **Limit:** 5 requests per 15 minutes
- **Applies to:** `/api/auth/register`, `/api/auth/login`

When rate limit is exceeded:
```json
{
  "error": "Too many requests",
  "message": "Too many login attempts. Please try again after 15 minutes.",
  "retryAfter": 900
}
```

---

## Security Features

1. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

2. **JWT Tokens:**
   - Expiration: 7 days (configurable)
   - Automatically invalidated on logout
   - Checked against blacklist on every request

3. **Rate Limiting:**
   - Prevents brute force attacks
   - Applied to authentication endpoints

4. **Password Hashing:**
   - bcrypt with 10 salt rounds
   - Passwords never stored in plain text

---

## Testing Credentials

After running seed data:
- **Username:** `admin`, `worker1`, or `worker2`
- **Password:** `password123`

---

## Development

### Testing with cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "fullName": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

**Get Profile:**
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

**Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <your-token>"
```

### Automated Testing

Run the test script:
```bash
./test-api.sh
```

---

## Future Endpoints (Coming Soon)

- Counting Session Management
- Barcode Scanning
- SAP Service Layer Integration
- Inventory Management
