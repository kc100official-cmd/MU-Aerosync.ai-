from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..data.database import db
from ..models.schemas import RiskAssessment
from ..services.predictive import assess_component, rank_risks, narrative_for

router = APIRouter(prefix="/api/predictive", tags=["predictive"])

@router.get("/risks", response_model=List[RiskAssessment])
def get_risk_rankings():
    return rank_risks(db.data)

@router.get("/assessment/{component_id}", response_model=RiskAssessment)
def get_component_assessment(component_id: str):
    comp = next((c for c in db.data.get("components", []) if c["id"].upper() == component_id.upper()), None)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Component {component_id} not found")
    return assess_component(db.data, comp)

@router.get("/narrative/{component_id}")
def get_component_narrative(component_id: str):
    comp = next((c for c in db.data.get("components", []) if c["id"].upper() == component_id.upper()), None)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Component {component_id} not found")
    assessment = assess_component(db.data, comp)
    narrative = narrative_for(assessment, comp["name"])
    return {
        "componentId": comp["id"],
        "componentName": comp["name"],
        "riskScore": assessment["riskScore"],
        "narrative": narrative,
        "recommendation": assessment["recommendedAction"],
        "priority": assessment["inspectionPriority"],
    }
