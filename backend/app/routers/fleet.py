import csv
import io
from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Optional, Dict, Any
from ..data.database import db
from ..models.schemas import Aircraft

router = APIRouter(prefix="/api/fleet", tags=["fleet"])

@router.get("", response_model=List[Aircraft])
def get_fleet(fleet: Optional[str] = None, search: Optional[str] = None):
    aircraft_list = db.data.get("aircraft", [])
    if fleet and fleet.lower() != "all":
        aircraft_list = [a for a in aircraft_list if a.get("fleet", "").lower() == fleet.lower()]

    if search:
        q = search.strip().lower()
        aircraft_list = [
            a for a in aircraft_list
            if q in f"{a.get('id', '')} {a.get('model', '')} {a.get('fleet', '')} {a.get('status', '')}".lower()
        ]
    return aircraft_list

@router.get("/{aircraft_id}", response_model=Aircraft)
def get_aircraft(aircraft_id: str):
    ac = next((a for a in db.data.get("aircraft", []) if a["id"].upper() == aircraft_id.upper()), None)
    if not ac:
        raise HTTPException(status_code=404, detail=f"Aircraft {aircraft_id} not found")
    return ac

@router.post("", response_model=Aircraft)
def upsert_aircraft(aircraft: Aircraft):
    ac_dict = aircraft.model_dump()
    aircraft_list = db.data.setdefault("aircraft", [])
    idx = next((i for i, a in enumerate(aircraft_list) if a["id"].upper() == aircraft.id.upper()), None)
    if idx is not None:
        aircraft_list[idx] = ac_dict
    else:
        aircraft_list.append(ac_dict)

    db.data.setdefault("audit", []).insert(0, {
        "id": f"aud-ac-{aircraft.id}",
        "at": ac_dict.get("lastMaintenance", ""),
        "userId": "usr-adm",
        "action": "upsert-aircraft",
        "detail": f"Aircraft {aircraft.id} upserted",
    })
    return ac_dict

@router.get("/export/csv")
def export_aircraft_csv():
    aircraft_list = db.data.get("aircraft", [])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "type", "model", "fleet", "status", "healthScore",
        "flightHours", "flightCycles", "lastMaintenance", "nextInspection", "base"
    ])
    for a in aircraft_list:
        writer.writerow([
            a.get("id"), a.get("type"), a.get("model"), a.get("fleet"),
            a.get("status"), a.get("healthScore"), a.get("flightHours"),
            a.get("flightCycles"), a.get("lastMaintenance"), a.get("nextInspection"),
            a.get("base")
        ])
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aerosync_fleet.csv"}
    )
