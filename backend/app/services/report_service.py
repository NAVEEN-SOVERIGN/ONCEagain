from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.report import Report
from app.models.screening import ScreeningSession
from app.services.audit_service import AuditService

class ReportService:
    @staticmethod
    def generate_report(db: Session, screening_session_id: str, user_id: str = "health_worker") -> Optional[Report]:
        screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_session_id).first()
        if not screening:
            return None
            
        patient = screening.patient
        clinical = screening.clinical_assessment
        tests = screening.functional_tests
        risk = screening.risk_assessment
        red_flags = screening.red_flags
        review = screening.health_worker_review
        
        report_data = {
            "patient": {
                "identifier": patient.patient_identifier,
                "name": patient.name,
                "age": patient.age,
                "sex": patient.sex,
                "height_cm": patient.height,
                "weight_kg": patient.weight,
                "bmi": patient.bmi,
                "occupation": patient.occupation,
                "family_history": patient.family_history,
                "previous_joint_injury": patient.previous_joint_injury
            },
            "screening_metadata": {
                "started_at": screening.started_at.isoformat() if screening.started_at else None,
                "completed_at": screening.completed_at.isoformat() if screening.completed_at else None,
                "camp_location": screening.camp_location,
                "operator_name": screening.operator_name,
                "status": screening.screening_status
            },
            "clinical_examination": {
                "morning_stiffness_minutes": clinical.morning_stiffness_minutes if clinical else 0,
                "joint_swelling": clinical.joint_swelling if clinical else False,
                "pain_nrs_score": clinical.pain_nrs_score if clinical else 0,
                "knee_flexion_rom_deg": clinical.knee_flexion_rom_deg if clinical else None,
                "crepitus_present": clinical.crepitus_present if clinical else False,
                "joint_line_tenderness": clinical.joint_line_tenderness if clinical else False,
                "alignment_observation": clinical.alignment_observation if clinical else "NORMAL",
                "clinician_notes": clinical.clinician_notes if clinical else ""
            },
            "functional_tests": [
                {
                    "test_type": t.test_type,
                    "duration_seconds": t.duration_seconds,
                    "quality_status": t.quality_status,
                    "metrics": [
                        {"name": r.metric_name, "value": r.metric_value, "unit": r.unit, "side": r.side}
                        for r in t.results
                    ]
                }
                for t in tests
            ],
            "risk_stratification": {
                "automated_tier": risk.risk_tier if risk else "NOT_SCORED",
                "risk_score": risk.risk_score if risk else 0.0,
                "model_version": risk.model_version if risk else "provisional",
                "contributing_factors": risk.contributing_features if risk else [],
                "explanation": risk.explanation if risk else ""
            },
            "red_flags": [
                {
                    "code": rf.flag_code,
                    "name": rf.flag_name,
                    "severity": rf.severity,
                    "action_required": rf.action_required
                }
                for rf in red_flags if rf.detected
            ],
            "health_worker_review": {
                "final_decision": review.final_result if review else "PENDING_REVIEW",
                "reviewed_by": review.reviewed_by if review else None,
                "notes": review.review_notes if review else None,
                "override_reason": review.override_reason if review else None,
                "reviewed_at": review.reviewed_at.isoformat() if (review and review.reviewed_at) else None
            },
            "patient_guidance": {
                "summary": "This screening platform assesses functional mobility and risk markers for osteoarthritis.",
                "plain_language_action": (
                    "Please consult a doctor or physical therapist for formal examination and joint management."
                    if (review and "TIER_3" in review.final_result) else
                    ("Continue regular low-impact exercise and weight maintenance. Attend follow-up monitoring in 6 months."
                     if (review and "TIER_2" in review.final_result) else
                     "Joint mobility and function are currently within healthy ranges. Maintain an active lifestyle.")
                )
            }
        }
        
        report = Report(
            screening_session_id=screening_session_id,
            report_type="COMPREHENSIVE_TRIAGE",
            reviewed_status="REVIEWED" if review else "PENDING_REVIEW",
            report_data=report_data,
            generated_at=datetime.now(timezone.utc)
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        AuditService.log(db, "Report", report.id, "GENERATE", user_id)
        return report

    @staticmethod
    def get_latest_report(db: Session, screening_session_id: str) -> Optional[Report]:
        return db.query(Report).filter(Report.screening_session_id == screening_session_id).order_by(Report.generated_at.desc()).first()
