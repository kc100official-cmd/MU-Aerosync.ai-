@echo off
echo =======================================================
echo          AeroSync AI - Backend API Server
echo =======================================================
echo.
echo Launching FastAPI + Uvicorn server on http://localhost:8000 ...
echo API Documentation available at http://localhost:8000/docs
echo WebSocket stream available at ws://localhost:8000/ws/telemetry
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
