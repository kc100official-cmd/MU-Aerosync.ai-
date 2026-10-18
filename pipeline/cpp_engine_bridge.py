import os
import sys
import subprocess
import json
import tempfile
import platform
from typing import Dict, List, Any, Optional

class CPPEngineBridge:
    """
    High-Performance Python Bridge to the Native C++ Graph Traversal Engine.
    Handles automated compilation check, subprocess execution, data serialization,
    and fallback pure-Python execution if C++ toolchain is unavailable.
    """

    def __init__(self, engine_dir: Optional[str] = None):
        if engine_dir is None:
            # Base directory silly-bardeen/engine
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.engine_dir = os.path.join(base_dir, "engine")
        else:
            self.engine_dir = engine_dir

        is_win = platform.system() == "Windows"
        exe_name = "graph_tracer.exe" if is_win else "graph_tracer"
        self.binary_path = os.path.join(self.engine_dir, exe_name)
        self.cpp_source_path = os.path.join(self.engine_dir, "graph_tracer.cpp")

        self.ensure_binary_compiled()

    def ensure_binary_compiled(self) -> bool:
        """
        Ensures the C++ graph traversal executable exists; compiles with g++ if missing.
        """
        if os.path.exists(self.binary_path):
            return True

        if not os.path.exists(self.cpp_source_path):
            return False

        try:
            print(f"[*] Native C++ binary not found at {self.binary_path}. Compiling with g++...")
            cmd = ["g++", "-std=c++14", "-O2", self.cpp_source_path, "-o", self.binary_path]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
            if res.returncode == 0:
                print("[+] Successfully compiled native C++ Graph Tracer engine!")
                return True
            else:
                print(f"[-] C++ compilation failed: {res.stderr}")
                return False
        except Exception as e:
            print(f"[-] Could not compile C++ engine: {e}")
            return False

    def trace_graph(
        self,
        seed_address: str,
        transactions: List[Dict[str, Any]],
        max_depth: int = 5,
        min_amount: float = 0.001
    ) -> Dict[str, Any]:
        """
        Executes multi-hop transaction tracing via C++ engine, falling back to Python if necessary.
        """
        if os.path.exists(self.binary_path):
            try:
                return self._run_cpp_engine(seed_address, transactions, max_depth, min_amount)
            except Exception as e:
                print(f"[!] C++ execution warning ({e}), falling back to internal Python traversal engine...")

        return self._python_fallback_trace(seed_address, transactions, max_depth, min_amount)

    def _run_cpp_engine(
        self,
        seed_address: str,
        transactions: List[Dict[str, Any]],
        max_depth: int,
        min_amount: float
    ) -> Dict[str, Any]:
        """
        Invokes native C++ executable via temporary CSV interchange.
        """
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tf:
            temp_csv = tf.name
            tf.write("tx_hash,from_addr,to_addr,amount,token,timestamp,block_number\n")
            for tx in transactions:
                tf.write(f"{tx.get('tx_hash', '')},{tx.get('from', '')},{tx.get('to', '')},{tx.get('amount', 0.0)},{tx.get('token', 'ETH')},{tx.get('timestamp', 0)},{tx.get('block_number', 0)}\n")

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as out_tf:
            temp_out = out_tf.name

        try:
            cmd = [
                self.binary_path,
                seed_address,
                str(max_depth),
                temp_csv,
                temp_out
            ]
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, timeout=15)

            with open(temp_out, "r") as f:
                content = f.read()
                return json.loads(content)
        finally:
            if os.path.exists(temp_csv):
                os.remove(temp_csv)
            if os.path.exists(temp_out):
                os.remove(temp_out)

    def _python_fallback_trace(
        self,
        seed_address: str,
        transactions: List[Dict[str, Any]],
        max_depth: int,
        min_amount: float
    ) -> Dict[str, Any]:
        """
        Pure Python fallback graph tracer matching C++ engine logic.
        """
        from collections import defaultdict, deque
        adj = defaultdict(list)
        for tx in transactions:
            f = tx.get("from", "").lower()
            t = tx.get("to", "").lower()
            adj[f].append({
                "from": f,
                "to": t,
                "amount": float(tx.get("amount", 0.0)),
                "token": tx.get("token", "ETH"),
                "tx_hash": tx.get("tx_hash", ""),
                "timestamp": int(tx.get("timestamp", 0))
            })

        seed = seed_address.lower()
        nodes = {}
        edges = []
        visited = set()

        q = deque([(seed, 0)])
        visited.add(seed)
        nodes[seed] = {
            "address": seed,
            "hop_distance": 0,
            "total_received": 0.0,
            "total_sent": 0.0,
            "in_degree": 0,
            "out_degree": 0,
            "is_seed": True,
            "is_mixer": False,
            "is_peeling": False,
            "is_terminal_sink": False,
            "sink_type": "seed"
        }

        while q:
            curr, depth = q.popleft()
            if depth >= max_depth:
                continue

            out_txs = adj.get(curr, [])
            total_out = sum(t["amount"] for t in out_txs if t["amount"] >= min_amount)
            is_peeling = False
            if len(out_txs) == 2:
                diff = abs(out_txs[0]["amount"] - out_txs[1]["amount"])
                if diff > 0.5 * max(out_txs[0]["amount"], out_txs[1]["amount"]):
                    is_peeling = True

            for tx in out_txs:
                if tx["amount"] < min_amount:
                    continue
                nxt = tx["to"]
                flow_pct = (tx["amount"] / total_out * 100.0) if total_out > 0 else 100.0

                edges.append({
                    "from": curr,
                    "to": nxt,
                    "amount": tx["amount"],
                    "token": tx["token"],
                    "tx_hash": tx["tx_hash"],
                    "timestamp": tx["timestamp"],
                    "hop_level": depth + 1,
                    "flow_percentage": round(flow_pct, 2)
                })

                nodes[curr]["total_sent"] += tx["amount"]
                nodes[curr]["out_degree"] += 1

                if nxt not in nodes:
                    nodes[nxt] = {
                        "address": nxt,
                        "hop_distance": depth + 1,
                        "total_received": tx["amount"],
                        "total_sent": 0.0,
                        "in_degree": 1,
                        "out_degree": 0,
                        "is_seed": False,
                        "is_mixer": False,
                        "is_peeling": is_peeling,
                        "is_terminal_sink": False,
                        "sink_type": "unknown"
                    }
                else:
                    nodes[nxt]["total_received"] += tx["amount"]
                    nodes[nxt]["in_degree"] += 1
                    if is_peeling:
                        nodes[nxt]["is_peeling"] = True

                if nxt not in visited:
                    visited.add(nxt)
                    q.append((nxt, depth + 1))

        return {
            "engine": "Python Fallback Tracer v2.0",
            "seed_address": seed,
            "max_depth": max_depth,
            "discovered_nodes_count": len(nodes),
            "discovered_edges_count": len(edges),
            "nodes": list(nodes.values()),
            "edges": edges
        }
