# US-001: User Login Implementation Checklist

## Backend Setup (Deno + PostgreSQL + Knex)

### 1. Project Initialization
- [x] Create `backend/` folder in workspace
- [x] Initialize Deno project with `deno.json` configuration
- [x] Set up project structure (src/, routes/, middleware/, models/, services/)
- [x] Configure environment variables (.env file)
- [x] Set up TypeScript configuration for Deno

### 2. Database Setup
- [ ] Install PostgreSQL locally or configure cloud database
- [ ] Install Knex for Deno (npm:knex)
- [ ] Install PostgreSQL driver (npm:pg)
- [ ] Create database connection configuration
- [ ] Set up Knex migration system
- [ ] Create initial migration: users table
  - id (UUID primary key)
  - username (unique, not null)
  - email (unique, not null)
  - password_hash (not null)
  - full_name
  - warehouse_location
  - is_active (boolean, default true)
  - created_at (timestamp)
  - updated_at (timestamp)
- [ ] Create initial migration: user_sessions table
  - id (UUID primary key)
  - user_id (foreign key to users)
  - token_hash
  - expires_at
  - created_at
- [ ] Run migrations
- [ ] Create seed file with test user accounts

### 3. Authentication Implementation
- [ ] Install JWT library (npm:jsonwebtoken or djwt)
- [ ] Install bcrypt for password hashing (npm:bcrypt)
- [ ] Create User model with Knex queries
- [ ] Implement password hashing utility functions
- [ ] Implement JWT token generation
- [ ] Implement JWT token verification middleware
- [ ] Create authentication service layer
  - registerUser()
  - loginUser()
  - verifyToken()
  - refreshToken()
  - logoutUser()

### 4. API Endpoints
- [ ] Set up Deno HTTP server (Oak or Hono framework)
- [ ] Create `/api/auth/register` endpoint (POST)
- [ ] Create `/api/auth/login` endpoint (POST)
- [ ] Create `/api/auth/logout` endpoint (POST)
- [ ] Create `/api/auth/refresh` endpoint (POST)
- [ ] Create `/api/auth/me` endpoint (GET) - get current user profile
- [ ] Add request validation middleware
- [ ] Add error handling middleware
- [ ] Add CORS configuration for React Native app

### 5. SAP Service Layer Integration
- [ ] Create SAP service layer client
- [ ] Implement SAP session management (service account)
- [ ] Create SAP login function with credentials from env
- [ ] Implement SAP session token refresh logic
- [ ] Create SAP API proxy endpoints
  - `/api/sap/items/:barcode` - get item by barcode
  - `/api/sap/items/search` - search items
  - `/api/sap/inventory/submit` - submit inventory count
- [ ] Add authentication middleware to SAP endpoints
- [ ] Implement request/response caching for SAP data

### 6. Security & Middleware
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Set up input sanitization
- [ ] Configure secure headers
- [ ] Implement token blacklist for logout
- [ ] Add database query error handling
- [ ] Set up API documentation (optional - Swagger/OpenAPI)

### 7. Testing & Validation
- [ ] Test database connections
- [ ] Test user registration flow
- [ ] Test login flow with valid credentials
- [ ] Test login flow with invalid credentials
- [ ] Test JWT token validation
- [ ] Test protected endpoints without token
- [ ] Test SAP connection and proxy endpoints
- [ ] Create Postman/Thunder Client collection for API testing

### 8. Deployment Preparation
- [ ] Create Docker configuration (optional)
- [ ] Set up environment variable template (.env.example)
- [ ] Write backend README with setup instructions
- [ ] Configure production database connection
- [ ] Set up logging for production

---

## Frontend Setup (React Native + Expo)

### 9. Dependencies Installation
- [ ] Install expo-secure-store: `npx expo install expo-secure-store`
- [ ] Install axios or fetch wrapper for API calls
- [ ] Install @react-navigation for auth flow navigation
- [ ] Install any state management library (Context API / Zustand / Redux)

### 10. Authentication Context
- [ ] Create AuthContext (context/AuthContext.tsx)
- [ ] Create AuthProvider component
- [ ] Implement login function
- [ ] Implement logout function
- [ ] Implement token storage (SecureStore)
- [ ] Implement token retrieval on app load
- [ ] Implement auto-login if valid token exists
- [ ] Handle token expiration and refresh

### 11. API Client Setup
- [ ] Create API client utility (services/api.ts)
- [ ] Configure base URL from environment
- [ ] Implement request interceptor (add auth token to headers)
- [ ] Implement response interceptor (handle 401 errors)
- [ ] Create auth service functions
  - login(username, password)
  - logout()
  - getCurrentUser()
  - refreshToken()

### 12. Login Screen UI
- [ ] Create login screen component (app/login.tsx or app/(auth)/login.tsx)
- [ ] Add username/email input field
- [ ] Add password input field with secure text entry
- [ ] Add login button
- [ ] Add loading state during API call
- [ ] Add error message display
- [ ] Add form validation
- [ ] Style login screen to match app theme
- [ ] Add "Forgot Password" link (placeholder)

### 13. Navigation & Route Protection
- [ ] Update app/_layout.tsx to check auth state
- [ ] Create auth navigation flow
- [ ] Redirect to login if not authenticated
- [ ] Redirect to home after successful login
- [ ] Create protected route wrapper/HOC
- [ ] Handle deep linking with authentication

### 14. User Profile Display
- [ ] Create user profile screen component
- [ ] Display user information (name, username, warehouse location)
- [ ] Add logout button
- [ ] Fetch user profile from API on load

### 15. Error Handling & UX
- [ ] Add network error handling
- [ ] Add offline detection
- [ ] Display user-friendly error messages
- [ ] Add retry logic for failed requests
- [ ] Show loading indicators appropriately
- [ ] Add toast/alert notifications for success/error

### 16. Testing
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test token persistence after app restart
- [ ] Test logout functionality
- [ ] Test protected route access without auth
- [ ] Test network error scenarios
- [ ] Test token refresh flow

---

## Integration Testing

### 17. End-to-End Testing
- [ ] Test complete flow: register → login → access protected resource → logout
- [ ] Test SAP data fetch with authenticated user
- [ ] Test session timeout and re-authentication
- [ ] Test concurrent sessions (multiple devices)
- [ ] Performance test: login response time
- [ ] Security test: SQL injection, XSS attempts