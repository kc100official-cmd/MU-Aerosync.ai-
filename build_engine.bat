@echo off
echo [*] Compiling Native C++ Multi-Hop Graph Traversal Engine...
g++ -std=c++14 -O3 engine\graph_tracer.cpp -o engine\graph_tracer.exe
if %ERRORLEVEL% equ 0 (
    echo [+] C++ Graph Tracer compiled successfully: engine\graph_tracer.exe
) else (
    echo [-] Compilation failed. Ensure g++ (MinGW) is on your PATH.
)
pause
