Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Warehouse Helper Backend - Quick Start" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location $PSScriptRoot

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
& "$PSScriptRoot\scripts\check-prerequisites.ps1"
if ($LASTEXITCODE -ne 0) {
    exit 1
}
Write-Host ""

# Start database
& "$PSScriptRoot\scripts\start-database.ps1"
if ($LASTEXITCODE -ne 0) {
    exit 1
}
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
deno install
Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""

# Setup database
& "$PSScriptRoot\scripts\setup-database.ps1"
if ($LASTEXITCODE -ne 0) {
    exit 1
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "[OK] Setup complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test credentials:"
Write-Host "  Username: admin (or worker1, worker2)"
Write-Host "  Password: password123"
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host "API will be available at: http://localhost:3000"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server"
Write-Host ""
deno task dev
