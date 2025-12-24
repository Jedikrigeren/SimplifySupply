# US-001: User Login Implementation Checklist

## Backend Setup (Deno + PostgreSQL + Knex)

### 1. Project Initialization
- [x] Create `backend/` folder in workspace
- [x] Initialize Deno project with `deno.json` configuration
- [x] Set up project structure (src/, routes/, middleware/, models/, services/)
- [x] Configure environment variables (.env file)
- [x] Set up TypeScript configuration for Deno

### 2. Database Setup
- [x] Install PostgreSQL locally or configure cloud database (Docker PostgreSQL)
- [x] Install Knex for Deno (npm:knex)
- [x] Install PostgreSQL driver (npm:pg)
- [x] Create database connection configuration
- [x] Set up Knex migration system
- [x] Create initial migration: users table
  - id (UUID primary key)
  - username (unique, not null)
  - email (unique, not null)
  - password_hash (not null)
  - full_name
  - warehouse_location
  - is_active (boolean, default true)
  - created_at (timestamp)
  - updated_at (timestamp)
- [x] Create initial migration: user_sessions table
  - id (UUID primary key)
  - user_id (foreign key to users)
  - token_hash
  - expires_at
  - created_at
- [x] Run migrations
- [x] Create seed file with test user accounts

### 3. Authentication Implementation
- [x] Install JWT library (npm:jsonwebtoken)
- [x] Install bcrypt for password hashing (npm:bcrypt)
- [x] Create User model with Knex queries
- [x] Implement password hashing utility functions
- [x] Implement JWT token generation
- [x] Implement JWT token verification middleware
- [x] Create authentication service layer
  - ~~registerUser()~~ (not needed yet)
  - loginUser() ✓
  - verifyToken() ✓
  - ~~refreshToken()~~ (future enhancement)
  - logoutUser() ✓

### 4. API Endpoints
- [x] Set up Deno HTTP server (Hono framework)
- [x] Create `/api/auth/register` endpoint (POST)
- [x] Create `/api/auth/login` endpoint (POST)
- [x] Create `/api/auth/logout` endpoint (POST)
- [x] Create `/api/auth/refresh` endpoint (POST) - **Token refresh with rotation**
- [x] Create `/api/auth/me` endpoint (GET) - get current user profile
- [x] Create `/api/auth/verify` endpoint (GET) - verify token validity
- [x] Add request validation middleware (using Zod)
- [x] Add error handling middleware
- [x] Add CORS configuration for React Native app

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
- [x] Implement rate limiting (auth endpoints: 5 req/15 min)
- [x] Add request logging
- [x] Set up input sanitization (via Zod validation)
- [x] Configure secure headers (CORS)
- [x] Implement token blacklist for logout
- [x] Add database query error handling
- [x] Set up API documentation (API_DOCUMENTATION.md)

### 7. Testing & Validation
- [x] Test database connections
- [x] Test user registration flow
- [x] Test login flow with valid credentials
- [x] Test login flow with invalid credentials
- [x] Test JWT token validation
- [x] Test protected endpoints without token
- [ ] Test SAP connection and proxy endpoints - not implemented yet
- [x] Create Postman/Thunder Client collection for API testing (test-api.sh script)
- [ ] Test SAP connection and proxy endpoints - not implemented yet
- [x] Create Postman/Thunder Client collection for API testing (test-api.sh script)

### 8. Deployment Preparation
- [x] Create Docker configuration (docker-compose.yml for PostgreSQL)
- [x] Set up environment variable template (.env.example)
- [x] Write backend README with setup instructions (SETUP_GUIDE.md)
- [x] Configure production database connection (via .env)
- [x] Set up logging for production (console logging implemented)

---

## Frontend Setup (React Native + Expo)

### 9. Dependencies Installation
- [x] Install expo-secure-store: `npx expo install expo-secure-store`
- [x] Install axios for API calls
- [x] Install expo-constants for environment configuration
- [x] Navigation already provided by expo-router

### 10. Authentication Context
- [x] Create AuthContext (context/AuthContext.tsx)
- [x] Create AuthProvider component
- [x] Implement login function
- [x] Implement register function
- [x] Implement logout function
- [x] Implement token storage (SecureStore)
- [x] Implement token retrieval on app load
- [x] Implement auto-login if valid token exists
- [x] Handle token expiration and refresh

### 11. API Client Setup
- [x] Create API client utility (services/api.ts)
- [x] Configure base URL from environment (.env and .env.local)
- [x] Implement request interceptor (add auth token to headers)
- [x] Implement response interceptor (handle 401 errors with auto-refresh)
- [x] Create auth service functions (services/auth.service.ts)
  - [x] login(username, password)
  - [x] register(userData)
  - [x] logout()
  - [x] getCurrentUser()

### 12. Login Screen UI
- [x] Create login screen component (app/(auth)/login.tsx)
- [x] Add username input field
- [x] Add password input field with secure text entry
- [x] Add login button
- [x] Add loading state during API call
- [x] Add error message display (401, 429, network errors)
- [x] Add form validation
- [x] Style login screen with React Native StyleSheet
- [x] Add navigation to register screen

### 12.5. Registration Screen UI
- [x] Create registration screen component (app/(auth)/register.tsx)
- [x] Add all required input fields (username, email, fullName, warehouseLocation, password, confirmPassword)
- [x] Add client-side validation (email format, password strength, password match)
- [x] Add registration button with loading state
- [x] Add error message display
- [x] Style registration screen
- [x] Add navigation back to login screen

### 13. Navigation & Route Protection
- [x] Update app/_layout.tsx to check auth state
- [x] Create auth navigation flow (app/(auth)/_layout.tsx)
- [x] Redirect to login if not authenticated
- [x] Redirect to tabs after successful login
- [x] Protected routes via AuthProvider and useSegments
- [x] Handle authentication state changes

### 14. User Profile Display
- [x] Create user profile screen component (app/(tabs)/profile.tsx)
- [x] Display user information (name, username, email, warehouse location)
- [x] Add logout button with confirmation dialog
- [x] Display user avatar with initial
- [x] Add placeholder buttons for Edit Profile and Change Password

### 15. Error Handling & UX
- [x] Add network error handling
- [x] Add offline detection (NetInfo + useNetworkStatus hook)
- [x] Display user-friendly error messages
- [x] Add retry logic for failed requests (axios-retry with exponential backoff)
- [x] Show loading indicators appropriately
- [x] Add alert notifications for logout confirmation
- [x] Add offline indicator banner

### 16. Testing (Expo Go Compatible)
- [x] Test login with valid credentials
- [x] Test login with invalid credentials
- [x] Test token persistence after app restart (testable in Expo Go)
- [x] Test logout functionality
- [x] Test protected route access without auth
- [x] Test network error scenarios (stop backend to simulate)
- [x] Test token refresh flow (automatic via interceptor)
- [x] Test offline detection (enable airplane mode)

**Note:** See [APKChecklist.md](APKChecklist.md) for items requiring production build testing.

---

## Summary

**US-001 (User Login):** ✅ Complete
**US-002 (User Profile):** ✅ Complete  
**US-003 (Session Management):** ✅ Complete

All authentication and user management features have been implemented and tested in Expo Go. The backend provides secure JWT-based authentication with token refresh, rate limiting, and proper session management. The frontend includes login, registration, profile display, and automatic token refresh with offline detection.

---

## WSL Network Configuration (For Development)
- [x] Configure Windows port forwarding for backend (port 3000)
- [x] Configure Windows port forwarding for Expo (port 8081)
- [x] Set up Windows Firewall rules for WSL access
- [x] Configure REACT_NATIVE_PACKAGER_HOSTNAME in .env.local
- [x] Update API base URL to use Windows network IP
- [x] Test phone connectivity to backend through Windows IP