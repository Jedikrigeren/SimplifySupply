# SimplifySupply Startup Scripts

This folder contains all startup and development scripts for the SimplifySupply project.

## Main Scripts

### Full Stack Quickstart
**Windows:**
- `quickstart.bat` (in project root)
- `quickstart.ps1` (this folder)

Starts everything you need:
1. Android Emulator
2. Backend API Server (port 3001)
3. Expo Development Server

### Start Emulator Only
**Windows:**
- `start-emulator.bat` (in project root)
- `start-emulator.ps1` (this folder)

Starts the Android emulator, waits for it to boot, and launches Expo.

## Usage

From the project root, simply run:
```cmd
quickstart.bat
```

Or for emulator only:
```cmd
start-emulator.bat
```

## Backend Scripts

Backend-specific scripts are located in `backend/scripts/`:
- Check prerequisites
- Start database
- Setup database
- Backend quickstart

See [backend/scripts/README.md](../backend/scripts/README.md) for details.
