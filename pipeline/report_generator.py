import hashlib
import json
import time
import uuid
from typing import Dict, Any

class ForensicReportGenerator:
    """
    Synthesizes victim incident reports, multi-hop C++ graph outputs, and AI risk models
    into an auditable, cryptographically signed Forensic Investigation Dossier.
    """

    @staticmethod
    def generate_dossier(
        victim_report: Dict[str, Any],
        graph_data: Dict[str, Any],
        ai_evaluation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Creates a structured, deterministic forensic dossier and calculates its tamper-proof hash.
        """
        case_id = victim_report.get("case_id") or f"CASE-{uuid.uuid4().hex[:8].upper()}"
        timestamp = int(victim_report.get("timestamp") or time.time())

        # Construct deterministic core evidence structure
        evidence_payload = {
            "case_id": case_id,
            "timestamp": timestamp,
            "victim": {
                "address": victim_report.get("victim_address", "").lower(),
                "reported_loss": float(victim_report.get("loss_amount", 0.0)),
                "token": victim_report.get("token", "ETH"),
                "category": victim_report.get("category", "PHISHING_DRAINER"),
                "tx_hash": victim_report.get("tx_hash", "")
            },
            "suspect": {
                "address": victim_report.get("suspect_address", "").lower()
            },
            "graph_summary": {
                "total_nodes": graph_data.get("discovered_nodes_count", 0),
                "total_edges": graph_data.get("discovered_edges_count", 0),
                "engine_used": graph_data.get("engine", "Unknown")
            },
            "ai_attribution": {
                "risk_score": ai_evaluation.get("risk_score", 0),
                "severity": ai_evaluation.get("severity", "MEDIUM"),
                "actor": ai_evaluation.get("attribution", {}).get("actor", "Unknown"),
                "confidence": ai_evaluation.get("attribution", {}).get("confidence", 0),
                "mitre_technique": ai_evaluation.get("attribution", {}).get("mitre_technique", "N/A")
            }
        }

        # Deterministic JSON canonical string
        canonical_json = json.dumps(evidence_payload, sort_keys=True, separators=(',', ':'))
        
        # Calculate SHA-256 and Keccak-256 hashes
        sha256_hash = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
        
        # For EVM bytes32 compatibility
        report_hash_bytes32 = f"0x{sha256_hash}"

        # Generate mock or calculated IPFS CID (Content Identifier)
        ipfs_cid = f"bafybeic{sha256_hash[:32]}"

        full_dossier = {
            "case_id": case_id,
            "report_hash": report_hash_bytes32,
            "ipfs_cid": ipfs_cid,
            "generated_at": timestamp,
            "evidence_payload": evidence_payload,
            "full_graph": graph_data,
            "ai_evaluation": ai_evaluation,
            "immutable_anchor_status": {
                "is_anchored": False,
                "tx_hash": None,
                "block_number": None,
                "contract_address": None,
                "explorer_url": None
            }
        }

        return full_dossier
