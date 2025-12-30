$allOk = $true

# Check if Docker is running
try {
    docker info | Out-Null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker is running" -ForegroundColor Green
    } else {
        throw
    }
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    $allOk = $false
}

# Check if Deno is installed
try {
    $denoVersion = deno --version 2>$null | Select-Object -First 1
    if ($denoVersion) {
        Write-Host "[OK] Deno is installed ($denoVersion)" -ForegroundColor Green
    } else {
        throw
    }
} catch {
    Write-Host "[ERROR] Deno is not installed. Please install Deno first." -ForegroundColor Red
    Write-Host "Visit: https://deno.land/" -ForegroundColor Yellow
    $allOk = $false
}

if (-not $allOk) {
    exit 1
}
