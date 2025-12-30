Write-Host "Starting PostgreSQL database..." -ForegroundColor Yellow
docker-compose up -d

# Wait for database to be ready
Write-Host "Waiting for database to be ready..."
Start-Sleep -Seconds 5

# Check if database is running
$containersUp = docker-compose ps | Select-String "Up"
if ($containersUp) {
    Write-Host "[OK] PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}
