from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.risk import RiskAssessmentResponse
from app.models.risk import RiskAssessment
from app.services.risk_service import RiskAssessmentService

router = APIRouter(prefix="/risk-assessments", tags=["Risk Stratification"])

@router.post("/calculate/{screening_id}", response_model=RiskAssessmentResponse, status_code=status.HTTP_200_OK)
def calculate_risk(screening_id: str, db: Session = Depends(get_db)):
    risk = RiskAssessmentService.calculate_and_save_risk(db, screening_id)
    if not risk:
        raise HTTPException(status_code=404, detail="Screening session not found")
    return risk

@router.get("/{screening_id}", response_model=RiskAssessmentResponse)
def get_risk(screening_id: str, db: Session = Depends(get_db)):
    risk = db.query(RiskAssessment).filter(RiskAssessment.screening_session_id == screening_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk assessment not found for this screening")
    return risk
