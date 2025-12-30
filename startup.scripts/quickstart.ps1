Write-Host "======================================" -ForegroundColor Cyan
Write-Host "SimplifySupply - Full Stack Quickstart" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Get project root (one level up from startup.scripts)
$projectRoot = Split-Path -Parent $PSScriptRoot

# Set Android SDK path
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"

# Step 1: Check if Android emulator is running
Write-Host "[1/3] Checking Android Emulator..." -ForegroundColor Yellow
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

# Step 2: Start Backend
Write-Host "[2/3] Starting Backend Server..." -ForegroundColor Yellow
$backendPath = Join-Path $projectRoot "backend"

if (Test-Path (Join-Path $backendPath "quickstart.ps1")) {
    Write-Host "  Launching backend in new window..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "cd '$backendPath'; .\quickstart.ps1"
    Write-Host "  [OK] Backend starting in separate window" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Backend quickstart script not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Start Expo
Write-Host "[3/3] Starting Expo Development Server..." -ForegroundColor Yellow
Write-Host "  Launching Expo in new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "cd '$projectRoot'; npx expo start"
Write-Host "  [OK] Expo starting in separate window" -ForegroundColor Green

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "All services are starting!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  - Android Emulator (separate window)" -ForegroundColor White
Write-Host "  - Backend API on http://localhost:3001" -ForegroundColor White
Write-Host "  - Expo Dev Server (check Expo window)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Wait for all services to fully start" -ForegroundColor White
Write-Host "  2. In the Expo window, press 'a' for Android" -ForegroundColor White
Write-Host "  3. Your app should open in the emulator!" -ForegroundColor White
Write-Host ""
Write-Host "To stop: Close each terminal window" -ForegroundColor Yellow
Write-Host ""
