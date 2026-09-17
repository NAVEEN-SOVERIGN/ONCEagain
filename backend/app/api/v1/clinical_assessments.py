from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.clinical_assessment import ClinicalAssessmentCreate, ClinicalAssessmentResponse
from app.models.clinical_assessment import ClinicalAssessment

router = APIRouter(prefix="/clinical-assessments", tags=["Clinical Assessments"])

@router.post("", response_model=ClinicalAssessmentResponse, status_code=status.HTTP_201_CREATED)
def save_clinical_assessment(data: ClinicalAssessmentCreate, db: Session = Depends(get_db)):
    existing = db.query(ClinicalAssessment).filter(ClinicalAssessment.screening_session_id == data.screening_session_id).first()
    if existing:
        for k, v in data.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
        
    assessment = ClinicalAssessment(**data.model_dump())
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment

@router.get("/{screening_id}", response_model=ClinicalAssessmentResponse)
def get_clinical_assessment(screening_id: str, db: Session = Depends(get_db)):
    assessment = db.query(ClinicalAssessment).filter(ClinicalAssessment.screening_session_id == screening_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Clinical assessment not found")
    return assessment
