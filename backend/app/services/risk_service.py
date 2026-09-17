from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.risk import RiskAssessment
from app.models.screening import ScreeningSession
from app.models.flag import AutoFlag
from app.domain.risk_engine import RuleBasedRiskEngine
from app.services.audit_service import AuditService

class RiskAssessmentService:
    engine = RuleBasedRiskEngine()

    @staticmethod
    def calculate_and_save_risk(db: Session, screening_session_id: str, user_id: str = "system") -> Optional[RiskAssessment]:
        screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_session_id).first()
        if not screening:
            return None
            
        patient = screening.patient
        patient_profile = {
            "age": patient.age,
            "sex": patient.sex,
            "bmi": patient.bmi,
            "previous_joint_injury": patient.previous_joint_injury
        }
        
        flags = db.query(AutoFlag).filter(AutoFlag.screening_session_id == screening_session_id).all()
        flags_data = [
            {
                "flag_code": f.flag_code,
                "flag_name": f.flag_name,
                "severity": f.severity,
                "detected_value": f.detected_value,
                "explanation": f.explanation
            }
            for f in flags
        ]
        
        risk_output = RiskAssessmentService.engine.calculate_risk(patient_profile, flags_data, [])
        
        # Check if risk assessment already exists
        existing = db.query(RiskAssessment).filter(RiskAssessment.screening_session_id == screening_session_id).first()
        if existing:
            existing.risk_tier = risk_output["risk_tier"]
            existing.risk_score = risk_output["risk_score"]
            existing.model_version = risk_output["model_version"]
            existing.contributing_features = risk_output["contributing_features"]
            existing.explanation = risk_output["explanation"]
            existing.status = "AUTOMATED"
            record = existing
        else:
            record = RiskAssessment(
                screening_session_id=screening_session_id,
                risk_tier=risk_output["risk_tier"],
                risk_score=risk_output["risk_score"],
                model_version=risk_output["model_version"],
                contributing_features=risk_output["contributing_features"],
                explanation=risk_output["explanation"],
                status="AUTOMATED"
            )
            db.add(record)
            
        db.commit()
        db.refresh(record)
        AuditService.log(db, "RiskAssessment", record.id, "CALCULATE", user_id, {"tier": record.risk_tier, "score": record.risk_score})
        return record
