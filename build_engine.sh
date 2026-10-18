#!/usr/bin/env bash
set -e

echo "[*] Compiling Native C++ Multi-Hop Graph Traversal Engine..."
g++ -std=c++14 -O3 engine/graph_tracer.cpp -o engine/graph_tracer
chmod +x engine/graph_tracer
echo "[+] C++ Graph Tracer compiled successfully: engine/graph_tracer"
