from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.review import HealthWorkerReview
from app.models.screening import ScreeningSession
from app.schemas.review import HealthWorkerReviewCreate
from app.services.audit_service import AuditService

class ReviewService:
    @staticmethod
    def submit_review(db: Session, data: HealthWorkerReviewCreate, user_id: str = "health_worker") -> HealthWorkerReview:
        screening = db.query(ScreeningSession).filter(ScreeningSession.id == data.screening_session_id).first()
        if not screening:
            raise ValueError("Screening session not found")
            
        auto_result = "TIER_1_LOW_RISK"
        if screening.risk_assessment:
            auto_result = screening.risk_assessment.risk_tier
            screening.risk_assessment.status = "REVIEWED"
            
        screening.screening_status = "REVIEWED"
        screening.completed_at = datetime.now(timezone.utc)
        
        existing = db.query(HealthWorkerReview).filter(HealthWorkerReview.screening_session_id == data.screening_session_id).first()
        if existing:
            existing.automated_result = auto_result
            existing.final_result = data.final_result
            existing.reviewed_by = data.reviewed_by
            existing.review_notes = data.review_notes
            existing.override_reason = data.override_reason
            existing.reviewed_at = datetime.now(timezone.utc)
            review = existing
        else:
            review = HealthWorkerReview(
                screening_session_id=data.screening_session_id,
                automated_result=auto_result,
                final_result=data.final_result,
                reviewed_by=data.reviewed_by,
                review_notes=data.review_notes,
                override_reason=data.override_reason,
                reviewed_at=datetime.now(timezone.utc)
            )
            db.add(review)
            
        db.commit()
        db.refresh(review)
        AuditService.log(db, "HealthWorkerReview", review.id, "REVIEW", user_id, {
            "automated_result": auto_result,
            "final_result": data.final_result,
            "override": auto_result != data.final_result
        })
        return review
