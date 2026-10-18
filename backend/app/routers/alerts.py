from fastapi import APIRouter, HTTPException
from typing import List, Optional
from ..data.database import db
from ..models.schemas import Alert, AlertResolveRequest

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[Alert])
def get_alerts(resolved: Optional[bool] = None):
    alerts = db.data.get("alerts", [])
    if resolved is not None:
        alerts = [a for a in alerts if a.get("resolved") == resolved]
    return alerts

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    alerts = db.data.get("alerts", [])
    alert = next((a for a in alerts if a["id"].upper() == alert_id.upper()), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["acknowledged"] = True
    alert["read"] = True
    return {"ok": True, "alert": alert}

@router.post("/{alert_id}/read")
def read_alert(alert_id: str):
    alerts = db.data.get("alerts", [])
    alert = next((a for a in alerts if a["id"].upper() == alert_id.upper()), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["read"] = True
    return {"ok": True, "alert": alert}

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: str, req: AlertResolveRequest):
    alerts = db.data.get("alerts", [])
    alert = next((a for a in alerts if a["id"].upper() == alert_id.upper()), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["resolved"] = True
    alert["read"] = True
    alert["acknowledged"] = True
    alert["resolveNote"] = req.note
    return {"ok": True, "alert": alert}
