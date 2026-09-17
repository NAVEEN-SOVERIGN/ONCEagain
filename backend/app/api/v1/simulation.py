from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulation", tags=["Simulation Mode"])

class SimulationRequest(BaseModel):
    scenario: str = "ELEVATED_RISK"  # LOW_RISK, ELEVATED_RISK, PROBABLE_OA, RED_FLAG
    operator_name: str = "Demo Health Worker"

@router.post("/run", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def run_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    return SimulationService.run_full_simulation(db, scenario=req.scenario, operator_name=req.operator_name)
