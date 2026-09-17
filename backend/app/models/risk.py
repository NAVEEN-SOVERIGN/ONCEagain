import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    risk_tier = Column(String(32), nullable=False)  # TIER_1_LOW_RISK, TIER_2_ELEVATED_RISK, TIER_3_PROBABLE_OA
    risk_score = Column(Float, nullable=False)      # 0 to 100
    model_version = Column(String(32), default="rule_v1.0_ner_provisional")
    contributing_features = Column(JSON, default=list)  # list of {name, value, weight, direction}
    explanation = Column(Text, nullable=False)
    status = Column(String(32), default="AUTOMATED")  # AUTOMATED, REVIEWED
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening = relationship("ScreeningSession", back_populates="risk_assessment")
