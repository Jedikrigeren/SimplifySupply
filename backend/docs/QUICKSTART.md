# Quick Start Guide

## Prerequisites
- Docker installed and running
- Deno 2.x installed

## Setup & Run (One Command!)

```bash
cd backend
./start.sh
```

This script will:
1. ✅ Start PostgreSQL in Docker
2. ✅ Install dependencies
3. ✅ Run database migrations
4. ✅ Seed test users
5. ✅ Start the development server

## Test Credentials

After setup, you can login with:
- **Username**: `admin` (or `worker1`, `worker2`)
- **Password**: `password123`

## API Endpoints

- **Login**: `POST http://localhost:3000/api/auth/login`
- **Get Profile**: `GET http://localhost:3000/api/auth/me` (requires token)
- **Verify Token**: `GET http://localhost:3000/api/auth/verify` (requires token)
- **Logout**: `POST http://localhost:3000/api/auth/logout` (requires token)
- **Health Check**: `GET http://localhost:3000/health`

## Test the API

Run the test script (while server is running):
```bash
./test-api.sh
```

## Common Commands

```bash
# Start server only
deno task dev

# Run migrations
deno task migrate:latest

# Rollback migrations
deno task migrate:rollback

# Seed database
deno task seed

# Stop database
docker-compose down

# Reset everything
docker-compose down -v
./start.sh
```

## Next Steps

1. ✅ Backend authentication is complete
2. 🔄 Connect React Native frontend
3. 🔄 Implement counting session endpoints
4. 🔄 Add barcode scanning integration
5. 🔄 Integrate SAP Service Layer

---

**Backend Status**: ✅ Ready for frontend integration

All authentication endpoints are working and tested!
