import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from ..data.database import db
from ..models.schemas import AuditLog

router = APIRouter(prefix="/api/audit", tags=["audit"])

class AuditCreateRequest(BaseModel):
    userId: str
    action: str
    detail: str

@router.get("", response_model=List[AuditLog])
def get_audit_logs():
    return db.data.get("audit", [])

@router.post("", response_model=AuditLog)
def create_audit_log(req: AuditCreateRequest):
    log = {
        "id": f"aud-{uuid.uuid4().hex[:6]}",
        "at": datetime.now(timezone.utc).isoformat(),
        "userId": req.userId,
        "action": req.action,
        "detail": req.detail,
    }
    db.data.setdefault("audit", []).insert(0, log)
    return log

@router.post("/reset-demo")
def reset_demo_database():
    db.reset()
    return {"ok": True, "message": "Demo dataset reset to initial state"}
