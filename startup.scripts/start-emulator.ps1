Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Starting Android Emulator" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Set Android SDK path
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"

# Check if Android SDK exists
if (-not (Test-Path $env:ANDROID_HOME)) {
    Write-Host "[ERROR] Android SDK not found at: $env:ANDROID_HOME" -ForegroundColor Red
    Write-Host "Please install Android Studio first." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Android SDK found" -ForegroundColor Green

# Get list of available AVDs
$emulatorPath = "$env:ANDROID_HOME\emulator\emulator.exe"
if (-not (Test-Path $emulatorPath)) {
    Write-Host "[ERROR] Emulator not found at: $emulatorPath" -ForegroundColor Red
    exit 1
}

Write-Host "Checking for available emulators..." -ForegroundColor Yellow
$avds = & $emulatorPath -list-avds

if (-not $avds) {
    Write-Host "[ERROR] No Android Virtual Devices found!" -ForegroundColor Red
    Write-Host "Please create an emulator in Android Studio:" -ForegroundColor Yellow
    Write-Host "  1. Open Android Studio" -ForegroundColor Yellow
    Write-Host "  2. Go to Tools -> Device Manager" -ForegroundColor Yellow
    Write-Host "  3. Create a new Virtual Device" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Available emulators:" -ForegroundColor Cyan
$avds | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
Write-Host ""

# Use the first AVD or the one specified as parameter
$avdName = if ($args.Count -gt 0) { $args[0] } else { $avds[0] }

# Check if emulator is already running
$adbPath = "$env:ANDROID_HOME\platform-tools\adb.exe"
if (Test-Path $adbPath) {
    $runningDevices = & $adbPath devices | Select-String "emulator"
    if ($runningDevices) {
        Write-Host "[OK] Emulator is already running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Starting Expo..." -ForegroundColor Yellow
        npx expo start
        exit 0
    }
}

Write-Host "Starting emulator: $avdName" -ForegroundColor Yellow
Write-Host "Please wait, this may take 30-60 seconds..." -ForegroundColor Yellow
Write-Host ""

# Start the emulator
Start-Process $emulatorPath -ArgumentList "-avd", $avdName

Write-Host "[OK] Emulator is starting!" -ForegroundColor Green
Write-Host "Waiting for emulator to boot..." -ForegroundColor Yellow

# Wait for emulator to be detected by adb
$timeout = 120 # 2 minutes timeout
$elapsed = 0
$bootComplete = $false

while ($elapsed -lt $timeout -and -not $bootComplete) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    
    if (Test-Path $adbPath) {
        $devices = & $adbPath devices | Select-String "emulator.*device$"
        if ($devices) {
            # Check if boot is complete
            $bootStatus = & $adbPath shell getprop sys.boot_completed 2>$null
            if ($bootStatus -eq "1") {
                $bootComplete = $true
            }
        }
    }
    
    # Show progress every 10 seconds
    if ($elapsed % 10 -eq 0) {
        Write-Host "  Still waiting... ($elapsed seconds)" -ForegroundColor Gray
    }
}

if ($bootComplete) {
    Write-Host ""
    Write-Host "[OK] Emulator is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting Expo..." -ForegroundColor Yellow
    npx expo start
} else {
    Write-Host ""
    Write-Host "[WARNING] Emulator is taking longer than expected to boot." -ForegroundColor Yellow
    Write-Host "You can manually run 'npx expo start' once it's ready." -ForegroundColor Yellow
}
