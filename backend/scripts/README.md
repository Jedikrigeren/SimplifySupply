# Backend Scripts

This directory contains modular scripts for setting up and managing the backend.

## Components

### Check Prerequisites
- **Linux/macOS**: `check-prerequisites.sh`
- **Windows**: `check-prerequisites.ps1`

Verifies that Docker and Deno are installed and running.

### Start Database
- **Linux/macOS**: `start-database.sh`
- **Windows**: `start-database.ps1`

Starts the PostgreSQL database using Docker Compose.

### Setup Database
- **Linux/macOS**: `setup-database.sh`
- **Windows**: `setup-database.ps1`

Runs database migrations and seeds test data.

## Quick Start Scripts

Located in the `backend/` directory root:

### Linux/macOS
```bash
./quickstart.sh
```

### Windows (PowerShell)
```powershell
.\quickstart.ps1
```

### Windows (Command Prompt)
```cmd
quickstart.bat
```

## Manual Usage

You can run individual scripts if needed:

### Linux/macOS
```bash
bash scripts/check-prerequisites.sh
bash scripts/start-database.sh
bash scripts/setup-database.sh
```

### Windows (PowerShell)
```powershell
.\scripts\check-prerequisites.ps1
.\scripts\start-database.ps1
.\scripts\setup-database.ps1
```
