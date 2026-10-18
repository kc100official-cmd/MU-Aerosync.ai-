from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..data.database import db
from ..models.schemas import Component

router = APIRouter(prefix="/api/components", tags=["components"])

@router.get("", response_model=List[Component])
def get_components(aircraft_id: Optional[str] = Query(None, alias="aircraftId")):
    components = db.data.get("components", [])
    if aircraft_id:
        components = [c for c in components if c.get("aircraftId", "").upper() == aircraft_id.upper()]
    return components

@router.get("/{component_id}", response_model=Component)
def get_component(component_id: str):
    comp = next((c for c in db.data.get("components", []) if c["id"].upper() == component_id.upper()), None)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Component {component_id} not found")
    return comp
