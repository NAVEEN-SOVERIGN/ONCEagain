import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class HealthWorkerReview(Base):
    __tablename__ = "health_worker_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    automated_result = Column(String(32), nullable=False)
    final_result = Column(String(32), nullable=False)  # CONFIRMED_TIER_1, CONFIRMED_TIER_2, CONFIRMED_TIER_3, OVERRIDDEN_TIER_1, etc.
    reviewed_by = Column(String(128), nullable=False)
    review_notes = Column(Text, nullable=True)
    override_reason = Column(String(256), nullable=True)
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening = relationship("ScreeningSession", back_populates="health_worker_review")
