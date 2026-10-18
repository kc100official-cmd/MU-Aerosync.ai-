from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional, Dict, Any
from ..data.database import db
from ..models.schemas import SensorReading, SensorThreshold, SimulationControlRequest
from ..services.simulator import simulator

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

@router.get("/readings", response_model=List[SensorReading])
def get_sensor_readings(
    aircraft_id: Optional[str] = Query(None, alias="aircraftId"),
    component_id: Optional[str] = Query(None, alias="componentId"),
    metric: Optional[str] = None,
    limit: int = 500,
):
    readings = db.data.get("readings", [])
    if aircraft_id:
        readings = [r for r in readings if r.get("aircraftId", "").upper() == aircraft_id.upper()]
    if component_id:
        readings = [r for r in readings if r.get("componentId", "").upper() == component_id.upper()]
    if metric:
        readings = [r for r in readings if r.get("metric") == metric]
    return readings[-limit:]

@router.get("/thresholds", response_model=List[SensorThreshold])
def get_thresholds(component_id: Optional[str] = Query(None, alias="componentId")):
    thresholds = db.data.get("thresholds", [])
    if component_id:
        thresholds = [t for t in thresholds if t.get("componentId", "").upper() == component_id.upper()]
    return thresholds

@router.get("/status")
def get_telemetry_status():
    return {
        "paused": db.sim_paused,
        "liveAircraft": db.sim_live_aircraft,
        "totalReadings": len(db.data.get("readings", [])),
    }

@router.post("/control")
def control_simulation(req: SimulationControlRequest):
    if req.paused is not None:
        db.sim_paused = req.paused
    if req.liveAircraft is not None:
        db.sim_live_aircraft = req.liveAircraft
    return {
        "paused": db.sim_paused,
        "liveAircraft": db.sim_live_aircraft,
    }

@router.post("/tick")
def trigger_tick():
    result = simulator.generate_tick()
    if not result:
        return {"ok": False, "message": "Simulation is paused or target aircraft has no components"}
    return {"ok": True, "data": result}
