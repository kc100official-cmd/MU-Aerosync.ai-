Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "         AeroSync AI - Backend API Server             " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Launching FastAPI + Uvicorn server on http://localhost:8000 ..." -ForegroundColor Yellow
Write-Host "Interactive Swagger Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "WebSocket Live Telemetry: ws://localhost:8000/ws/telemetry" -ForegroundColor Cyan
Write-Host ""

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
