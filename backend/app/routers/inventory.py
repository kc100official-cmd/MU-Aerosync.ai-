import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from ..data.database import db
from ..models.schemas import (
    InventoryPart, InventoryTransaction, PurchaseRequest, Supplier,
    ReservePartRequest, AdjustStockRequest, PurchaseCreateRequest
)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

@router.get("/parts", response_model=List[InventoryPart])
def get_inventory_parts():
    return db.data.get("parts", [])

@router.get("/parts/{part_id}", response_model=InventoryPart)
def get_inventory_part(part_id: str):
    part = next((p for p in db.data.get("parts", []) if p["id"].upper() == part_id.upper() or p["partNumber"].upper() == part_id.upper()), None)
    if not part:
        raise HTTPException(status_code=404, detail=f"Part {part_id} not found")
    return part

@router.post("/reserve")
def reserve_part(req: ReservePartRequest):
    parts = db.data.get("parts", [])
    part = next((p for p in parts if p["id"] == req.partId), None)
    if not part:
        raise HTTPException(status_code=404, detail="Unknown part")

    free = part["qtyAvailable"] - part["qtyReserved"]
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    if req.quantity > free:
        raise HTTPException(status_code=400, detail=f"Only {free} unreserved units available")

    part["qtyReserved"] += req.quantity

    # If linked to a work order, update its requiredParts
    if req.workOrderId:
        for wo in db.data.get("workOrders", []):
            if wo["id"] == req.workOrderId:
                for r in wo.get("requiredParts", []):
                    if r["partId"] == req.partId:
                        r["reserved"] += req.quantity

                all_met = all(r.get("reserved", 0) >= r.get("quantity", 0) for r in wo.get("requiredParts", []))
                if all_met and wo.get("status") == "awaiting_parts":
                    wo["status"] = "planned"

    tx = {
        "id": f"tx-{uuid.uuid4().hex[:6]}",
        "partId": req.partId,
        "type": "reserve",
        "quantity": req.quantity,
        "at": datetime.now(timezone.utc).isoformat(),
        "note": "Reservation via API",
        "workOrderId": req.workOrderId,
        "userId": req.userId or "usr-inv",
    }
    db.data.setdefault("transactions", []).insert(0, tx)

    return {"ok": True, "message": f"Reserved {req.quantity} units of {part['partNumber']}", "part": part}

@router.post("/adjust")
def adjust_stock(req: AdjustStockRequest):
    parts = db.data.get("parts", [])
    part = next((p for p in parts if p["id"] == req.partId), None)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    new_avail = max(0, part["qtyAvailable"] + req.quantity)
    part["qtyAvailable"] = new_avail
    part["qtyReserved"] = min(part["qtyReserved"], new_avail)

    if part["qtyAvailable"] == 0:
        for wo in db.data.get("workOrders", []):
            if wo.get("status") != "completed":
                has_part = any(r.get("partId") == req.partId and r.get("quantity", 0) > 0 for r in wo.get("requiredParts", []))
                if has_part:
                    wo["status"] = "awaiting_parts"
                    wo["notes"] = f"{wo.get('notes', '')} Shortage flagged.".strip()

    tx = {
        "id": f"tx-{uuid.uuid4().hex[:6]}",
        "partId": req.partId,
        "type": "adjust",
        "quantity": req.quantity,
        "at": datetime.now(timezone.utc).isoformat(),
        "note": "Stock adjustment via API",
        "userId": req.userId or "usr-inv",
    }
    db.data.setdefault("transactions", []).insert(0, tx)

    return {"ok": True, "message": f"Stock adjusted by {req.quantity}", "part": part}

@router.get("/purchases", response_model=List[PurchaseRequest])
def get_purchases():
    return db.data.get("purchaseRequests", [])

@router.post("/purchases", response_model=PurchaseRequest)
def create_purchase(req: PurchaseCreateRequest):
    part = next((p for p in db.data.get("parts", []) if p["id"] == req.partId), None)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    pr = {
        "id": f"PR-{uuid.uuid4().hex[:6].upper()}",
        "partId": req.partId,
        "quantity": req.quantity,
        "status": "submitted",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "note": req.note,
        "expectedLeadDays": part.get("leadTimeDays", 7),
    }
    db.data.setdefault("purchaseRequests", []).insert(0, pr)
    return pr

@router.get("/suppliers", response_model=List[Supplier])
def get_suppliers():
    return db.data.get("suppliers", [])

@router.get("/transactions", response_model=List[InventoryTransaction])
def get_transactions():
    return db.data.get("transactions", [])
