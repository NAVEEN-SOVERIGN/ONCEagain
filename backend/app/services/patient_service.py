import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from app.utils.bmi import calculate_bmi
from app.services.audit_service import AuditService

class PatientService:
    @staticmethod
    def create_patient(db: Session, data: PatientCreate, user_id: str = "health_worker") -> Patient:
        bmi = calculate_bmi(data.height, data.weight)
        identifier = data.patient_identifier or f"NER-PT-{uuid.uuid4().hex[:8].upper()}"
        
        patient = Patient(
            patient_identifier=identifier,
            name=data.name,
            age=data.age,
            sex=data.sex,
            height=data.height,
            weight=data.weight,
            bmi=bmi,
            occupation=data.occupation,
            family_history=data.family_history,
            previous_joint_injury=data.previous_joint_injury
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        AuditService.log(db, "Patient", patient.id, "CREATE", user_id, {"patient_identifier": identifier})
        return patient

    @staticmethod
    def get_patient(db: Session, patient_id: str) -> Optional[Patient]:
        return db.query(Patient).filter(Patient.id == patient_id).first()

    @staticmethod
    def list_patients(db: Session, skip: int = 0, limit: int = 100) -> List[Patient]:
        return db.query(Patient).order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()
