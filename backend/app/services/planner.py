from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from .predictive import rank_risks

def suggest_plan(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    risks = rank_risks(data)
    now = datetime.now(timezone.utc)
    in_14_days = now + timedelta(days=14)

    hangar_load = 0
    for s in data.get("schedules", []):
        try:
            start_dt = datetime.fromisoformat(s["start"].replace("Z", "+00:00"))
            if now < start_dt < in_14_days:
                hangar_load += 1
        except Exception:
            pass

    eligible = [w for w in data.get("workOrders", []) if w.get("status") in ("planned", "open", "awaiting_parts")]
    suggestions = []
    parts_list = data.get("parts", [])

    for w in eligible[:8]:
        parts_ok = True
        for need in w.get("requiredParts", []):
            part = next((p for p in parts_list if p.get("id") == need.get("partId")), None)
            if not part or (part.get("qtyAvailable", 0) + part.get("qtyReserved", 0)) < need.get("quantity", 0):
                parts_ok = False
                break

        risk = next((r for r in risks if r.get("componentId") == w.get("componentId")), None)
        reason_parts = [
            f"Priority {w.get('priority')}."
        ]
        if risk:
            reason_parts.append(f"Baseline component score {risk.get('riskScore')}.")
        else:
            reason_parts.append("No component risk row.")

        if parts_ok:
            reason_parts.append("Required demo stock is available or reserved.")
        else:
            reason_parts.append("Parts shortage may delay execution.")

        reason = " ".join(reason_parts)
        matching_sched = next((s for s in data.get("schedules", []) if s.get("workOrderId") == w.get("id")), None)

        suggestions.append({
            "scheduleId": matching_sched.get("id") if matching_sched else None,
            "aircraftId": w.get("aircraftId", ""),
            "title": w.get("title", ""),
            "proposedStart": w.get("plannedStart", ""),
            "proposedEnd": w.get("dueDate", ""),
            "reason": reason,
            "constraints": [
                "Must remain subject to approved maintenance programme and intervals.",
                "Authorized personnel only.",
                "Prototype cannot release an aircraft.",
            ],
            "partsOk": parts_ok,
            "capacityNote": f"{hangar_load} calendar items fall in the next 14 days in this demo set.",
        })

    return suggestions

def detect_conflicts(schedules: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    conflicts_out = []
    by_ac: Dict[str, List[Dict[str, Any]]] = {}
    for s in schedules:
        ac_id = s.get("aircraftId", "")
        by_ac.setdefault(ac_id, []).append(s)

    for ac_id, items in by_ac.items():
        sorted_items = sorted(items, key=lambda x: x.get("start", ""))
        for i in range(1, len(sorted_items)):
            prev = sorted_items[i - 1]
            curr = sorted_items[i]
            if curr.get("start", "") < prev.get("end", ""):
                conflicts_out.append({
                    "a": prev.get("id", ""),
                    "b": curr.get("id", ""),
                    "aircraftId": ac_id
                })
    return conflicts_out
