# Warehouse Helper - Backend API

A Deno-based REST API for the Warehouse Helper mobile app, providing authentication and SAP Service Layer integration.

## Tech Stack

- **Runtime**: Deno 2.x
- **Web Framework**: Hono
- **Database**: PostgreSQL
- **Query Builder**: Knex.js
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt

## Prerequisites

- [Deno](https://deno.land/) 2.x or higher
- PostgreSQL 14+ installed and running
- SAP Business One with Service Layer (optional for SAP features)

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and configuration
│   ├── middleware/      # Custom middleware (auth, validation, etc.)
│   ├── models/          # Database models
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (auth, SAP, etc.)
│   ├── utils/           # Helper functions
│   └── main.ts          # Entry point
├── migrations/          # Database migrations
├── seeds/              # Database seed files
├── .env                # Environment variables (create from .env.example)
├── .env.example        # Environment variables template
└── deno.json           # Deno configuration and tasks
```

## Getting Started

### 1. Clone and Navigate

```bash
cd warehouse-helper/backend
```

### 2. Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and fill in your values
# - Database credentials
# - JWT secrets (generate strong random strings)
# - SAP Service Layer credentials (if using SAP features)
```

### 3. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE warehouse_helper;

# Exit psql
\q
```

### 4. Run Database Migrations

```bash
deno task migrate:latest
```

This will create the `users` and `user_sessions` tables.

### 5. Seed Database (Optional)

```bash
deno task seed
```

This creates test users:
- **Username**: `admin` / **Password**: `password123`
- **Username**: `worker1` / **Password**: `password123`
- **Username**: `worker2` / **Password**: `password123`

### 6. Start Development Server

```bash
deno task dev
```

The server will start at `http://localhost:3000` (or your configured PORT).

## Available Tasks

```bash
# Development (with auto-reload)
deno task dev

# Production
deno task start

# Database migrations
deno task migrate:latest      # Run all pending migrations
deno task migrate:rollback    # Rollback last migration

# Database seeds
deno task seed                # Run seed files
```

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status and timestamp.

### API Info

```http
GET /api
```

Returns API information and available endpoints.

### Authentication (Coming Soon)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token

### SAP Integration (Coming Soon)

- `GET /api/sap/items/:barcode` - Get item by barcode
- `GET /api/sap/items/search` - Search items
- `POST /api/sap/inventory/submit` - Submit inventory count

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `warehouse_helper` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `yourpassword` |
| `JWT_SECRET` | JWT signing secret | `your_secret_key` |
| `JWT_EXPIRES_IN` | JWT expiration | `24h` |
| `SAP_BASE_URL` | SAP Service Layer URL | `https://server:50000/b1s/v1` |
| `SAP_USERNAME` | SAP service account username | `serviceuser` |
| `SAP_PASSWORD` | SAP service account password | `password` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:8081` |

## Development

### Adding a New Migration

```bash
# Knex CLI is not available in Deno, create manually
# Create a new file in migrations/ folder:
# migrations/20231223000003_your_migration_name.ts
```

### Testing API Endpoints

Use tools like:
- **Thunder Client** (VS Code extension)
- **Postman**
- **cURL**

Example cURL test:

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api
```

## Security Considerations

1. **Never commit `.env`** - Already in `.gitignore`
2. **Use strong JWT secrets** - Generate random strings for production
3. **Enable HTTPS in production** - Use reverse proxy (nginx, Caddy)
4. **Rate limiting** - Implement for production
5. **Input validation** - Use Zod schemas for all inputs
6. **SQL injection** - Knex provides parameterized queries

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
# Windows:
Get-Service -Name postgresql*

# Check connection
psql -U postgres -d warehouse_helper
```

### Permission Errors

Make sure Deno has the required permissions. The tasks in `deno.json` include:
- `--allow-net` - Network access
- `--allow-read` - File system read
- `--allow-env` - Environment variables
- `--allow-write` - File system write

### Port Already in Use

Change the `PORT` in your `.env` file or kill the process using port 3000:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Next Steps

1. ✅ Backend structure created
2. ⬜ Implement authentication routes
3. ⬜ Add JWT middleware
4. ⬜ Create SAP Service Layer client
5. ⬜ Add SAP proxy endpoints
6. ⬜ Implement rate limiting
7. ⬜ Add request validation (Zod)
8. ⬜ Create API documentation

## Support

For issues or questions, refer to the main project documentation or create an issue in the repository.
