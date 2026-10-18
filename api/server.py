import os
import json
import uuid
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pipeline.address_validator import AddressValidator
from pipeline.cpp_engine_bridge import CPPEngineBridge
from pipeline.ai_risk_scorer import AIRiskScorer
from pipeline.report_generator import ForensicReportGenerator
from anchor.anchor_service import BlockchainAnchorService

app = FastAPI(
    title="ChainForensix AI - Cyber Incident Attribution & Blockchain Anchor",
    description="Automated AI analytics pipeline for cryptocurrency forensic tracing and blockchain evidence anchoring.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core singletons
cpp_bridge = CPPEngineBridge()
risk_scorer = AIRiskScorer()
anchor_service = BlockchainAnchorService()

# In-memory case repository
INCIDENT_DATABASE: Dict[str, Dict[str, Any]] = {}

class IngestRequest(BaseModel):
    victim_address: str
    suspect_address: str
    loss_amount: float
    token: Optional[str] = "ETH"
    category: Optional[str] = "PHISHING_DRAINER"
    tx_hash: Optional[str] = ""
    description: Optional[str] = ""
    transactions: Optional[List[Dict[str, Any]]] = None
    auto_anchor: Optional[bool] = True

class AnchorRequest(BaseModel):
    case_id: str

@app.get("/api/health")
def health_check():
    cpp_available = os.path.exists(cpp_bridge.binary_path)
    return {
        "status": "ONLINE",
        "system": "ChainForensix AI Core",
        "cpp_engine_ready": cpp_available,
        "cpp_binary_path": cpp_bridge.binary_path,
        "blockchain_mode": "LIVE_EVM" if anchor_service.is_live_mode else "SIMULATED_EVM_LEDGER",
        "web3_connected": anchor_service.is_live_mode,
        "contract_address": anchor_service.contract_address,
        "total_active_cases": len(INCIDENT_DATABASE)
    }

@app.post("/api/ingest")
def ingest_and_trace(payload: IngestRequest):
    # 1. Validate Addresses
    v_valid, v_net, v_norm = AddressValidator.validate_and_identify(payload.victim_address)
    s_valid, s_net, s_norm = AddressValidator.validate_and_identify(payload.suspect_address)

    if not v_valid:
        raise HTTPException(status_code=400, detail=f"Invalid victim address: {v_norm}")
    if not s_valid:
        raise HTTPException(status_code=400, detail=f"Invalid suspect address: {s_norm}")

    # Generate or reuse Case ID
    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"

    # Transactions pool: if user passed transactions, use them; otherwise create initial victim->suspect edge
    raw_txs = payload.transactions or []
    if not raw_txs:
        raw_txs.append({
            "tx_hash": payload.tx_hash or f"0x{uuid.uuid4().hex}{uuid.uuid4().hex}",
            "from": v_norm,
            "to": s_norm,
            "amount": payload.loss_amount,
            "token": payload.token,
            "timestamp": int(time.time()),
            "block_number": 19482100
        })

    # 2. C++ Native Multi-Hop Graph Traversal
    graph_data = cpp_bridge.trace_graph(
        seed_address=s_norm,
        transactions=raw_txs,
        max_depth=5,
        min_amount=0.001
    )

    # 3. AI Behavioral Analytics & Risk Attribution
    report_dict = payload.model_dump()
    report_dict["case_id"] = case_id
    report_dict["victim_address"] = v_norm
    report_dict["suspect_address"] = s_norm
    ai_eval = risk_scorer.evaluate_graph(graph_data, report_dict)

    # 4. Synthesize Forensic Dossier & Cryptographic Merkle Hash
    dossier = ForensicReportGenerator.generate_dossier(report_dict, graph_data, ai_eval)

    # 5. Optional Auto-Anchor to Blockchain Smart Contract
    if payload.auto_anchor:
        anchor_receipt = anchor_service.anchor_dossier(dossier)
        dossier["immutable_anchor_status"] = {
            "is_anchored": anchor_receipt.get("success", False),
            "mode": anchor_receipt.get("mode"),
            "tx_hash": anchor_receipt.get("receipt", {}).get("tx_hash"),
            "block_number": anchor_receipt.get("receipt", {}).get("block_number"),
            "contract_address": anchor_receipt.get("receipt", {}).get("contract_address"),
            "explorer_url": anchor_receipt.get("receipt", {}).get("explorer_url"),
            "timestamp": anchor_receipt.get("receipt", {}).get("block_timestamp")
        }

    # Store in memory DB
    INCIDENT_DATABASE[case_id] = dossier

    return dossier

@app.post("/api/anchor")
def anchor_case(payload: AnchorRequest):
    case = INCIDENT_DATABASE.get(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {payload.case_id} not found")

    receipt = anchor_service.anchor_dossier(case)
    case["immutable_anchor_status"] = {
        "is_anchored": receipt.get("success", False),
        "mode": receipt.get("mode"),
        "tx_hash": receipt.get("receipt", {}).get("tx_hash"),
        "block_number": receipt.get("receipt", {}).get("block_number"),
        "contract_address": receipt.get("receipt", {}).get("contract_address"),
        "explorer_url": receipt.get("receipt", {}).get("explorer_url"),
        "timestamp": receipt.get("receipt", {}).get("block_timestamp")
    }

    return receipt

@app.get("/api/verify/{case_id}")
def verify_case_onchain(case_id: str):
    case = INCIDENT_DATABASE.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found in repository")

    report_hash = case.get("report_hash", "")
    verification = anchor_service.verify_on_chain(case_id, report_hash)
    return {
        "case_id": case_id,
        "report_hash": report_hash,
        "verification_result": verification
    }

@app.get("/api/cases")
def list_cases():
    summary_list = []
    for cid, c in INCIDENT_DATABASE.items():
        summary_list.append({
            "case_id": cid,
            "victim_address": c["evidence_payload"]["victim"]["address"],
            "suspect_address": c["evidence_payload"]["suspect"]["address"],
            "loss_amount": c["evidence_payload"]["victim"]["reported_loss"],
            "token": c["evidence_payload"]["victim"]["token"],
            "risk_score": c["ai_evaluation"]["risk_score"],
            "severity": c["ai_evaluation"]["severity"],
            "attribution": c["ai_evaluation"]["attribution"]["actor"],
            "is_anchored": c["immutable_anchor_status"]["is_anchored"],
            "tx_hash": c["immutable_anchor_status"]["tx_hash"],
            "generated_at": c["generated_at"]
        })
    return summary_list

@app.get("/api/case/{case_id}")
def get_case(case_id: str):
    case = INCIDENT_DATABASE.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.get("/api/sample/{sample_type}")
def get_sample_incident(sample_type: str):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    filename = f"{sample_type}_incident.json" if not sample_type.endswith(".json") else sample_type
    sample_path = os.path.join(base_dir, "sample_data", filename)
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail=f"Sample '{filename}' not found.")
    with open(sample_path, "r") as f:
        return json.load(f)

# Mount static web directory
base_static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.exists(base_static_dir):
    app.mount("/", StaticFiles(directory=base_static_dir, html=True), name="static")
