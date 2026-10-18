from fastapi import APIRouter
from typing import List, Dict, Any
from pydantic import BaseModel
from ..data.database import db
from ..models.schemas import QueryAnswer
from ..services.query_engine import answer_question, executive_brief, PRESET_QUESTIONS

router = APIRouter(prefix="/api/insights", tags=["insights"])

class QueryRequest(BaseModel):
    question: str

@router.get("/presets", response_model=List[str])
def get_presets():
    return PRESET_QUESTIONS

@router.post("/query", response_model=QueryAnswer)
def run_query(req: QueryRequest):
    return answer_question(db.data, req.question)

@router.get("/executive-brief")
def get_executive_brief():
    brief = executive_brief(db.data)
    return {"brief": brief}
