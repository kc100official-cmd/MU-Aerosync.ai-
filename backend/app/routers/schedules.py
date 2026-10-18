from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
from ..data.database import db
from ..models.schemas import MaintenanceSchedule, PlanSuggestion
from ..services.planner import suggest_plan, detect_conflicts

router = APIRouter(prefix="/api/schedules", tags=["schedules"])

class ScheduleUpdate(BaseModel):
    start: str
    end: str

@router.get("", response_model=List[MaintenanceSchedule])
def get_schedules():
    return db.data.get("schedules", [])

@router.put("/{schedule_id}", response_model=MaintenanceSchedule)
def update_schedule(schedule_id: str, req: ScheduleUpdate):
    schedules = db.data.get("schedules", [])
    idx = next((i for i, s in enumerate(schedules) if s["id"].upper() == schedule_id.upper()), None)
    if idx is None:
        raise HTTPException(status_code=404, detail=f"Schedule {schedule_id} not found")

    s = schedules[idx]
    s["start"] = req.start
    s["end"] = req.end
    schedules[idx] = s
    return s

@router.get("/conflicts")
def get_schedule_conflicts():
    return detect_conflicts(db.data.get("schedules", []))

@router.get("/suggestions", response_model=List[PlanSuggestion])
def get_plan_suggestions():
    return suggest_plan(db.data)
