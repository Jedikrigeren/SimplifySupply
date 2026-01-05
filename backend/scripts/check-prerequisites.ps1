$allOk = $true

# Check if Docker is running
try {
    $dockerOutput = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker is running" -ForegroundColor Green
    } else {
        throw "Docker not running"
    }
} catch {
    Write-Host "[WARNING] Docker is not running. Attempting to start Docker Desktop..." -ForegroundColor Yellow
    
    # Try to find and start Docker Desktop
    $dockerPaths = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
    )
    
    $dockerExe = $dockerPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if ($dockerExe) {
        Write-Host "  Starting Docker Desktop..." -ForegroundColor Cyan
        Start-Process $dockerExe
        Write-Host "  Waiting for Docker to start (checking every 5 seconds, max 50 seconds)..." -ForegroundColor Cyan
        
        # Try up to 10 times with 5 second intervals
        $maxAttempts = 10
        $dockerStarted = $false
        
        for ($i = 1; $i -le $maxAttempts; $i++) {
            Start-Sleep -Seconds 5
            Write-Host "  Attempt $i/$maxAttempts..." -ForegroundColor Gray
            
            $dockerOutput = docker info 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Docker is now running" -ForegroundColor Green
                $dockerStarted = $true
                break
            }
        }
        
        if (-not $dockerStarted) {
            Write-Host "[ERROR] Docker failed to start after $($maxAttempts * 5) seconds. Please start Docker Desktop manually." -ForegroundColor Red
            $allOk = $false
        }
    } else {
        Write-Host "[ERROR] Docker Desktop not found. Please install Docker Desktop." -ForegroundColor Red
        Write-Host "Visit: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        $allOk = $false
    }
}

# Check if Deno is installed
try {
    $denoVersion = deno --version 2>&1 | Select-Object -First 1
    if ($denoVersion -and $denoVersion -notmatch "not recognized" -and $denoVersion -notmatch "not found") {
        Write-Host "[OK] Deno is installed ($denoVersion)" -ForegroundColor Green
    } else {
        throw "Deno not found"
    }
} catch {
    Write-Host "[ERROR] Deno is not installed. Please install Deno first." -ForegroundColor Red
    Write-Host "Visit: https://deno.land/" -ForegroundColor Yellow
    $allOk = $false
}

if (-not $allOk) {
    exit 1
}

# Explicitly exit with success code
exit 0
