import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from ..data.database import db
from ..models.schemas import (
    WorkOrder, WorkOrderCreateRequest, WorkOrderUpdateRequest, WorkOrderStatus, WorkOrderPriority
)

router = APIRouter(prefix="/api/work-orders", tags=["work-orders"])

@router.get("", response_model=List[WorkOrder])
def get_work_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    aircraft_id: Optional[str] = Query(None, alias="aircraftId"),
):
    orders = db.data.get("workOrders", [])
    if status and status != "all":
        orders = [w for w in orders if w.get("status") == status]
    if priority and priority != "all":
        orders = [w for w in orders if w.get("priority") == priority]
    if aircraft_id:
        orders = [w for w in orders if w.get("aircraftId", "").upper() == aircraft_id.upper()]
    return orders

@router.get("/{wo_id}", response_model=WorkOrder)
def get_work_order(wo_id: str):
    wo = next((w for w in db.data.get("workOrders", []) if w["id"].upper() == wo_id.upper()), None)
    if not wo:
        raise HTTPException(status_code=404, detail=f"Work order {wo_id} not found")
    return wo

@router.post("", response_model=WorkOrder)
def create_work_order(req: WorkOrderCreateRequest):
    now = datetime.now(timezone.utc)
    new_id = f"WO-{random.randint(2000, 8999)}"
    new_wo = {
        "id": new_id,
        "aircraftId": req.aircraftId,
        "componentId": req.componentId,
        "title": req.title,
        "faultDescription": req.faultDescription,
        "priority": req.priority,
        "assignee": req.assignee,
        "team": req.team,
        "requiredParts": [p.model_dump() for p in req.requiredParts],
        "estimatedHours": req.estimatedHours,
        "plannedStart": req.plannedStart or now.isoformat(),
        "dueDate": req.dueDate or (now + timedelta(days=2)).isoformat(),
        "status": "open",
        "notes": req.notes,
        "completionNotes": "",
        "checklist": [
            {"id": "c1", "label": "Review technical log", "done": False},
            {"id": "c2", "label": "Confirm tooling & AMM task", "done": False},
            {"id": "c3", "label": "Independent inspection (as required)", "done": False},
        ],
        "createdAt": now.isoformat(),
        "updatedAt": now.isoformat(),
        "sourceAlertId": req.sourceAlertId,
    }

    db.data.setdefault("workOrders", []).insert(0, new_wo)
    db.data.setdefault("audit", []).insert(0, {
        "id": f"aud-wo-{new_id}",
        "at": now.isoformat(),
        "userId": req.assignee,
        "action": "work-order-create",
        "detail": f"Created work order {new_id} ({req.title})",
    })
    return new_wo

@router.put("/{wo_id}", response_model=WorkOrder)
def update_work_order(wo_id: str, req: WorkOrderUpdateRequest):
    orders = db.data.setdefault("workOrders", [])
    idx = next((i for i, w in enumerate(orders) if w["id"].upper() == wo_id.upper()), None)
    if idx is None:
        raise HTTPException(status_code=404, detail=f"Work order {wo_id} not found")

    wo = orders[idx]
    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if k == "checklist" and v is not None:
            wo[k] = [item if isinstance(item, dict) else item.model_dump() for item in v]
        else:
            wo[k] = v

    wo["updatedAt"] = datetime.now(timezone.utc).isoformat()
    orders[idx] = wo

    db.data.setdefault("audit", []).insert(0, {
        "id": f"aud-wo-upd-{wo_id}",
        "at": wo["updatedAt"],
        "userId": wo.get("assignee", "system"),
        "action": "work-order-update",
        "detail": f"Updated {wo_id} status -> {wo.get('status')}",
    })
    return wo

@router.post("/from-alert/{alert_id}", response_model=WorkOrder)
def create_from_alert(alert_id: str):
    alert = next((a for a in db.data.get("alerts", []) if a["id"].upper() == alert_id.upper()), None)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    now = datetime.now(timezone.utc)
    new_id = f"WO-{random.randint(2000, 8999)}"
    wo = {
        "id": new_id,
        "aircraftId": alert.get("aircraftId", "AS-101"),
        "componentId": alert.get("componentId"),
        "title": f"Inspection from alert: {alert['title']}",
        "faultDescription": f"{alert['description']}\n\nSource alert {alert['id']}. Baseline recommendation only.",
        "priority": "critical" if alert.get("severity") == "critical" else "high",
        "assignee": "Maya Chen",
        "team": "Line North",
        "requiredParts": [{"partId": "PRT-02", "quantity": 1, "reserved": 0}] if alert.get("componentId") == "ENG-204" else [],
        "estimatedHours": 6.0,
        "plannedStart": now.isoformat(),
        "dueDate": (now + timedelta(days=2)).isoformat(),
        "status": "open",
        "notes": "Created from predictive/anomaly alert. Human authorization required.",
        "completionNotes": "",
        "checklist": [
            {"id": "c1", "label": "Review evidence pack", "done": False},
            {"id": "c2", "label": "Perform inspection per AMM", "done": False},
            {"id": "c3", "label": "Independent inspection if required", "done": False},
        ],
        "createdAt": now.isoformat(),
        "updatedAt": now.isoformat(),
        "sourceAlertId": alert["id"],
    }
    db.data.setdefault("workOrders", []).insert(0, wo)
    return wo
