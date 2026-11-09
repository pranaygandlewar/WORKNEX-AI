# WORKNEX AI — Local Development Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting WORKNEX AI Enterprise Platform (Local Dev)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "Verifying / seeding database..." -ForegroundColor Yellow
uv run python main.py seed

Write-Host "Launching Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "uv run python main.py server"

Write-Host "Launching Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "WORKNEX AI is running!" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Swagger:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan

