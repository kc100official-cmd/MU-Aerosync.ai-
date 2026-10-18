from typing import Dict, Any, List
from datetime import datetime, timezone
from .predictive import rank_risks

PRESET_QUESTIONS = [
    "Which aircraft need attention first?",
    "Which work orders are blocked by unavailable parts?",
    "What is causing the largest amount of downtime in this demo dataset?",
    "Which inspections are due soon?",
    "What would happen to availability if a planned maintenance task were delayed?",
    "Which inventory items are below minimum stock?",
]

def calc_availability(data: Dict[str, Any]) -> float:
    ac_list = data.get("aircraft", [])
    if not ac_list:
        return 100.0
    ops = len([a for a in ac_list if a.get("status") == "operational"])
    return (ops / len(ac_list)) * 100.0

def answer_question(data: Dict[str, Any], question: str) -> Dict[str, Any]:
    q = question.lower()
    risks = rank_risks(data)
    ac_list = data.get("aircraft", [])

    if "attention first" in q:
        non_ops = [a for a in ac_list if a.get("status") != "operational"]
        sorted_non_ops = sorted(non_ops, key=lambda a: a.get("healthScore", 100))
        top_risk_str = f"{risks[0]['componentId']} @ {risks[0]['riskScore']}" if risks else "N/A"
        return {
            "question": question,
            "method": "deterministic-dataset-query",
            "bullets": [f"{a['id']} ({a['model']}) — {a['status']}, health {a['healthScore']}" for a in sorted_non_ops[:5]],
            "numbers": [
                {"label": "Non-operational aircraft", "value": str(len(non_ops))},
                {"label": "Highest baseline component risk", "value": top_risk_str},
            ],
        }

    if "blocked" in q or "unavailable" in q:
        blocked = [w for w in data.get("workOrders", []) if w.get("status") == "awaiting_parts"]
        parts_list = data.get("parts", [])
        detail = []
        for w in blocked:
            missing = []
            for need in w.get("requiredParts", []):
                part = next((p for p in parts_list if p.get("id") == need.get("partId")), None)
                if not part or part.get("qtyAvailable", 0) < need.get("quantity", 0):
                    missing.append(part.get("partNumber", need.get("partId", "")))
            detail.append(f"{w['id']} on {w['aircraftId']}: {', '.join(missing) or 'status awaiting parts'}")

        return {
            "question": question,
            "method": "deterministic-dataset-query",
            "bullets": detail if detail else ["No work orders are currently in awaiting_parts."],
            "numbers": [{"label": "Awaiting parts", "value": str(len(blocked))}],
        }

    if "downtime" in q:
        grounded = [a for a in ac_list if a.get("status") in ("grounded", "maintenance")]
        by_status = [f"{a['id']}: {a['status']} — {a['notes']}" for a in grounded]
        return {
            "question": question,
            "method": "deterministic-dataset-query",
            "bullets": [
                "Downtime here is inferred from demo aircraft status, not from certified out-of-service logs.",
                *by_status
            ],
            "numbers": [
                {"label": "Maintenance", "value": str(len([a for a in ac_list if a.get("status") == "maintenance"]))},
                {"label": "Grounded", "value": str(len([a for a in ac_list if a.get("status") == "grounded"]))},
            ],
        }

    if "inspection" in q and "due" in q:
        now = datetime.now(timezone.utc)
        soon = []
        for a in ac_list:
            insp = a.get("nextInspection")
            if insp:
                try:
                    insp_dt = datetime.fromisoformat(insp.replace("Z", "+00:00"))
                    days = (insp_dt - now).total_seconds() / 86400.0
                    if days <= 14:
                        soon.append((a, days))
                except Exception:
                    pass
        soon.sort(key=lambda x: x[1])
        return {
            "question": question,
            "method": "deterministic-dataset-query",
            "bullets": [f"{item[0]['id']}: next inspection in {item[1]:.1f} days ({item[0]['nextInspection'][:10]})" for item in soon],
            "numbers": [{"label": "Due within 14 days", "value": str(len(soon))}],
        }

    if "delayed" in q or "availability" in q:
        cur_avail = calc_availability(data)
        planned = [w for w in data.get("workOrders", []) if w.get("status") in ("planned", "in_progress")]
        extra_down = len(set(w.get("aircraftId") for w in planned if w.get("aircraftId")))
        op_count = len([a for a in ac_list if a.get("status") == "operational"])
        hypo = max(0.0, ((op_count - extra_down) / max(1, len(ac_list))) * 100.0)
        return {
            "question": question,
            "method": "deterministic-dataset-query",
            "bullets": [
                f"Current operational availability in this demo set is {cur_avail:.1f}%.",
                f"If every planned/in-progress package kept an aircraft down, {extra_down} additional tails could be unavailable.",
                f"Illustrative hypothetical availability: {hypo:.1f}%. This is a counting exercise, not an operations forecast.",
            ],
            "numbers": [
                {"label": "Current availability", "value": f"{cur_avail:.1f}%"},
                {"label": "Hypothetical", "value": f"{hypo:.1f}%"},
            ],
        }

    if "stock" in q or "inventory" in q:
        low = [p for p in data.get("parts", []) if p.get("qtyAvailable", 0) <= p.get("minStock", 0)]
        return {
            "question": question,
            "method": "deterministic-dataset-query",
            "bullets": [f"{p['partNumber']} — avail {p['qtyAvailable']}, min {p['minStock']}" for p in low[:8]],
            "numbers": [{"label": "At or below min", "value": str(len(low))}],
        }

    ops = len([a for a in ac_list if a.get("status") == "operational"])
    open_wo = len([w for w in data.get("workOrders", []) if w.get("status") != "completed"])
    top_risk = risks[0] if risks else None
    return {
        "question": question,
        "method": "deterministic-dataset-query",
        "bullets": [
            "Deterministic fleet calculation engine active.",
            f"Fleet size {len(ac_list)}, operational {ops}, open work orders {open_wo}.",
            f"Top baseline risk component: {top_risk['componentId'] if top_risk else 'n/a'} (score {top_risk['riskScore'] if top_risk else 'n/a'}).",
        ],
        "numbers": [{"label": "Aircraft", "value": str(len(ac_list))}],
    }

def executive_brief(data: Dict[str, Any]) -> str:
    risks = rank_risks(data)
    avail = calc_availability(data)
    ac_list = data.get("aircraft", [])
    attn = [a for a in ac_list if a.get("status") != "operational"]
    shortages = [p for p in data.get("parts", []) if p.get("qtyAvailable", 0) == 0 or p.get("qtyAvailable", 0) < p.get("minStock", 0)]
    open_wo = [w for w in data.get("workOrders", []) if w.get("status") != "completed"]

    top_risk_str = f"{risks[0]['componentId']} on {risks[0]['aircraftId']} (score {risks[0]['riskScore']})" if risks else "None"
    return " ".join([
        f"Demo fleet of {len(ac_list)} synthetic aircraft is {avail:.1f}% operational ({len([a for a in ac_list if a.get('status') == 'operational'])} flying status).",
        f"{len(attn)} tails require attention: {', '.join(a['id'] for a in attn)}.",
        f"Highest baseline component risk is {top_risk_str}.",
        f"{len(shortages)} inventory rows are at/below minimum, including zero-stock EDP-440 blocking WO-1045.",
        f"{len(open_wo)} work orders are not completed. Scores and alerts are demonstration analytics, not certified diagnostics.",
    ])
