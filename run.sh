#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  ChainForensix AI - Cyber-Incident Attribution Engine"
echo "========================================================"

if [ ! -f "engine/graph_tracer" ]; then
    echo "[*] Compiling C++ Multi-Hop Graph Traversal Engine..."
    g++ -std=c++14 -O3 engine/graph_tracer.cpp -o engine/graph_tracer
    chmod +x engine/graph_tracer
fi

echo "[*] Starting FastAPI Cyber-Incident SOC Dashboard on http://localhost:8080 ..."
python3 -m uvicorn api.server:app --host 0.0.0.0 --port 8080 --reload
