Write-Host "======================================" -ForegroundColor Cyan
Write-Host "SimplifySupply - Full Stack Quickstart" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Get project root (one level up from startup.scripts)
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"

# Load .env file
$envPath = Join-Path $projectRoot ".env"
$checkEmulator = $false
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match "^\s*CHECK_ANDROID_EMULATOR\s*=\s*(.+)$") {
            $checkEmulator = $matches[1].Trim() -eq "true"
        }
    }
}

# Check prerequisites first
Write-Host "[1/3] Checking Prerequisites..." -ForegroundColor Yellow
$prereqScript = Join-Path $backendPath "scripts\check-prerequisites.ps1"
if (Test-Path $prereqScript) {
    & $prereqScript
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Prerequisites check failed. Please fix the issues above and try again." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "  [WARNING] Prerequisites check script not found" -ForegroundColor Yellow
}
Write-Host ""

# Check Android emulator if enabled
if ($checkEmulator) {
    Write-Host "Checking Android Emulator..." -ForegroundColor Yellow
    $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
    $env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
    
    $adbPath = "$env:ANDROID_HOME\platform-tools\adb.exe"
    $emulatorRunning = $false

    if (Test-Path $adbPath) {
        $runningDevices = & $adbPath devices | Select-String "emulator"
        if ($runningDevices) {
            Write-Host "  [OK] Emulator is already running" -ForegroundColor Green
            $emulatorRunning = $true
        }
    }

    if (-not $emulatorRunning) {
        Write-Host "  Starting Android Emulator..." -ForegroundColor Yellow
        $emulatorPath = "$env:ANDROID_HOME\emulator\emulator.exe"
        
        if (-not (Test-Path $emulatorPath)) {
            Write-Host "  [WARNING] Emulator not found. Please install Android Studio." -ForegroundColor Yellow
        } else {
            # Get first available AVD
            $avds = & $emulatorPath -list-avds
            if (-not $avds) {
                Write-Host "  [WARNING] No Android Virtual Devices found!" -ForegroundColor Yellow
                Write-Host "  Create one in Android Studio (Tools -> Device Manager)" -ForegroundColor Yellow
            } else {
                $avdName = $avds[0]
                Write-Host "  Launching: $avdName" -ForegroundColor Cyan
                Start-Process $emulatorPath -ArgumentList "-avd", $avdName
                Write-Host "  [OK] Emulator starting in background" -ForegroundColor Green
            }
        }
    }
    Write-Host ""
} else {
    Write-Host "[INFO] Android Emulator check disabled (CHECK_ANDROID_EMULATOR=false in .env)" -ForegroundColor Cyan
    Write-Host ""
}

# Step 2: Start Backend (Docker Compose, migrations, seeds, and server)
Write-Host "[2/3] Starting Backend Services..." -ForegroundColor Yellow
Write-Host "  (Docker Compose, migrations, seeds, and Deno server)" -ForegroundColor Gray
Write-Host ""

# Start database
Write-Host "Starting database..." -ForegroundColor Yellow
Push-Location $backendPath
& "$backendPath\scripts\start-database.ps1"
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Install dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
deno install
Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""

# Setup database (migrations and seeds)
& "$backendPath\scripts\setup-database.ps1"
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location
Write-Host ""

Write-Host "[OK] Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Step 3: Start Expo
Write-Host "[3/3] Starting Expo Development Server..." -ForegroundColor Yellow
Write-Host "  Launching Expo in new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "cd '$projectRoot'; npx expo start"
Write-Host "  [OK] Expo starting in separate terminal" -ForegroundColor Green

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "Services are ready!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend setup complete in this terminal" -ForegroundColor Cyan
Write-Host "Expo starting in separate terminal" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services available at:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "  - Expo Dev Server: Check Expo terminal window" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Wait for Expo to fully start in the other terminal" -ForegroundColor White
Write-Host "  2. In the Expo terminal, press 'a' for Android" -ForegroundColor White
Write-Host "  3. Your app will open on the connected device" -ForegroundColor White
Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Yellow
Write-Host "API will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the Deno server in this terminal
Set-Location $backendPath
deno task dev
Write-Host ""
