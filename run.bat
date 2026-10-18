@echo off
echo ========================================================
echo   ChainForensix AI - Cyber-Incident Attribution Engine
echo ========================================================

REM Check if C++ binary is compiled
if not exist "engine\graph_tracer.exe" (
    echo [*] Compiling C++ Multi-Hop Graph Traversal Engine...
    g++ -std=c++14 -O3 engine\graph_tracer.cpp -o engine\graph_tracer.exe
)

echo [*] Starting FastAPI Cyber-Incident SOC Dashboard on http://127.0.0.1:8000 ...
python -m uvicorn api.server:app --host 127.0.0.1 --port 8000 --reload
pause
