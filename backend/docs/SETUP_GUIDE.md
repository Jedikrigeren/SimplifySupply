# Backend Setup Guide

## Prerequisites

1. **Deno**: Version 2.x or higher
2. **Docker & Docker Compose**: For running PostgreSQL
3. **WSL2**: Windows Subsystem for Linux (if on Windows)

## Quick Start

### 1. Start PostgreSQL Database

Start the PostgreSQL database using Docker Compose:

```bash
cd backend
docker-compose up -d
```

Verify the database is running:

```bash
docker-compose ps
```

You should see `warehouse_helper_db` with status "Up".

### 2. Environment Configuration

The `.env` file has been created with default values. **Important**: Change `JWT_SECRET` in production!

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warehouse_helper
DB_USER=warehouse_user
DB_PASSWORD=warehouse_pass
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Install Dependencies

```bash
deno install
```

### 4. Run Database Migrations

Create the database tables:

```bash
deno task migrate:latest
```

### 5. Seed the Database (Optional)

Add test users to the database:

```bash
deno task seed
```

### 6. Start the Development Server

```bash
deno task dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "warehouseLocation": "Warehouse A"
    }
  }
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "warehouseLocation": "Warehouse A",
    "isActive": true,
    "createdAt": "2023-12-23T00:00:00.000Z"
  }
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <your-jwt-token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <your-jwt-token>
```

## Testing the API

### Using curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"SecurePass123"}'

# Get profile (replace <TOKEN> with actual token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Database Management

### View Database Logs
```bash
docker-compose logs -f postgres
```

### Access PostgreSQL CLI
```bash
docker exec -it warehouse_helper_db psql -U warehouse_user -d warehouse_helper
```

### Stop Database
```bash
docker-compose down
```

### Reset Database (removes all data)
```bash
docker-compose down -v
docker-compose up -d
deno task migrate:latest
deno task seed
```

## Troubleshooting

### Database Connection Issues

1. Check if PostgreSQL container is running:
   ```bash
   docker-compose ps
   ```

2. Check container logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify connection settings in `.env` match `docker-compose.yml`

### Migration Errors

If migrations fail, you can rollback:
```bash
deno task migrate:rollback
```

Then try again:
```bash
deno task migrate:latest
```

### Port Already in Use

If port 3000 or 5432 is already in use:

1. Change `PORT` in `.env` for the API
2. Change port mapping in `docker-compose.yml` for PostgreSQL

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   │   └── database.ts
│   ├── middleware/      # Authentication middleware
│   │   └── auth.ts
│   ├── models/          # Database models
│   │   └── User.ts
│   ├── routes/          # API route handlers
│   │   └── auth.routes.ts
│   ├── services/        # Business logic
│   │   └── auth.service.ts
│   └── main.ts          # Entry point
├── migrations/          # Database migrations
├── seeds/              # Database seed files
├── docker-compose.yml  # PostgreSQL container config
├── .env                # Environment variables
└── deno.json           # Deno configuration
```

## Next Steps

1. ✅ Database setup complete
2. ✅ Authentication endpoints working
3. 🔄 Implement counting session endpoints
4. 🔄 Implement barcode scanning endpoints
5. 🔄 Add SAP Service Layer integration
6. 🔄 Connect frontend to backend

## Security Notes

- **Change JWT_SECRET** in production to a long, random string
- Store `.env` file securely and never commit it to version control
- Use HTTPS in production
- Implement rate limiting for login attempts
- Add refresh token mechanism for long-lived sessions
