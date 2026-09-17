from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.patient import PatientCreate, PatientResponse
from app.schemas.screening import ScreeningResponse
from app.services.patient_service import PatientService
from app.models.screening import ScreeningSession

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    return PatientService.create_patient(db, data)

@router.get("", response_model=List[PatientResponse])
def list_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return PatientService.list_patients(db, skip=skip, limit=limit)

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = PatientService.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/{patient_id}/screenings", response_model=List[ScreeningResponse])
def get_patient_screenings(patient_id: str, db: Session = Depends(get_db)):
    return db.query(ScreeningSession).filter(ScreeningSession.patient_id == patient_id).order_by(ScreeningSession.started_at.desc()).all()
