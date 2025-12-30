Write-Host "Running database migrations..." -ForegroundColor Yellow
deno task migrate:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Migrations failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Migrations completed" -ForegroundColor Green

Write-Host "Seeding database with test data..." -ForegroundColor Yellow
deno task seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Seeding failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Database seeded" -ForegroundColor Green
