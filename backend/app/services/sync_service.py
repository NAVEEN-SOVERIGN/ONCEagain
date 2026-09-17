from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.screening import ScreeningSession
from app.models.patient import Patient

class SyncService:
    """
    Offline-first export/bundle service.
    Prepares complete patient and screening records for future encrypted sync
    without coupling the core offline screening workflow.
    """
    @staticmethod
    def export_pending_records(db: Session) -> Dict[str, Any]:
        screenings = db.query(ScreeningSession).all()
        patients = db.query(Patient).all()
        
        return {
            "sync_bundle_id": f"SYNC-{int(datetime.now(timezone.utc).timestamp())}",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "patient_count": len(patients),
            "screening_count": len(screenings),
            "records": [
                {
                    "screening_id": s.id,
                    "patient_identifier": s.patient.patient_identifier,
                    "status": s.screening_status,
                    "risk_tier": s.risk_assessment.risk_tier if s.risk_assessment else None,
                    "final_decision": s.health_worker_review.final_result if s.health_worker_review else None
                }
                for s in screenings
            ]
        }
