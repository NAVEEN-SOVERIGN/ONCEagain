from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.screening import ScreeningSession
from app.schemas.screening import ScreeningCreate, ScreeningUpdate
from app.services.audit_service import AuditService

class ScreeningService:
    @staticmethod
    def create_screening(db: Session, data: ScreeningCreate, user_id: str = "health_worker") -> ScreeningSession:
        screening = ScreeningSession(
            patient_id=data.patient_id,
            operator_name=data.operator_name or user_id,
            camp_location=data.camp_location or "Community Camp",
            device_metadata=data.device_metadata or {},
            screening_status="IN_PROGRESS"
        )
        db.add(screening)
        db.commit()
        db.refresh(screening)
        AuditService.log(db, "ScreeningSession", screening.id, "CREATE", user_id)
        return screening

    @staticmethod
    def get_screening(db: Session, screening_id: str) -> Optional[ScreeningSession]:
        return db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()

    @staticmethod
    def list_screenings(db: Session, skip: int = 0, limit: int = 100) -> List[ScreeningSession]:
        return db.query(ScreeningSession).order_by(ScreeningSession.started_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def update_screening(db: Session, screening_id: str, data: ScreeningUpdate, user_id: str = "health_worker") -> Optional[ScreeningSession]:
        screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
        if not screening:
            return None
        if data.screening_status:
            screening.screening_status = data.screening_status
        if data.completed_at:
            screening.completed_at = data.completed_at
        db.commit()
        db.refresh(screening)
        AuditService.log(db, "ScreeningSession", screening.id, "UPDATE", user_id, {"status": screening.screening_status})
        return screening
