from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.red_flag import RedFlag
from app.models.screening import ScreeningSession
from app.domain.red_flag_engine import IndependentRedFlagEngine
from app.services.audit_service import AuditService

class RedFlagService:
    engine = IndependentRedFlagEngine()

    @staticmethod
    def evaluate_red_flags(db: Session, screening_session_id: str, user_id: str = "system") -> List[RedFlag]:
        # Delete existing red flags for this session
        db.query(RedFlag).filter(RedFlag.screening_session_id == screening_session_id).delete()
        
        screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_session_id).first()
        if not screening:
            return []
            
        clinical = screening.clinical_assessment
        clinical_dict = {}
        if clinical:
            clinical_dict = {
                "morning_stiffness_minutes": clinical.morning_stiffness_minutes,
                "joint_swelling": clinical.joint_swelling,
                "pain_nrs_score": clinical.pain_nrs_score,
                "clinician_notes": clinical.clinician_notes
            }
            
        detected = RedFlagService.engine.check_red_flags(clinical_dict, {})
        
        saved_flags = []
        for d in detected:
            rf = RedFlag(
                screening_session_id=screening_session_id,
                flag_code=d["flag_code"],
                flag_name=d["flag_name"],
                severity=d["severity"],
                detected=True,
                explanation=d["explanation"],
                action_required=d["action_required"]
            )
            db.add(rf)
            saved_flags.append(rf)
            
        db.commit()
        if saved_flags:
            AuditService.log(db, "RedFlag", screening_session_id, "TRIGGER_RED_FLAG", user_id, {"count": len(saved_flags)})
        return saved_flags
