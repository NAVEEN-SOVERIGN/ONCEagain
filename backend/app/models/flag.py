import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class AutoFlag(Base):
    __tablename__ = "auto_flags"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(32), nullable=False)  # CLINICAL, QUESTIONNAIRE, FUNCTIONAL, KINEMATIC, ANTHROPOMETRIC
    flag_code = Column(String(64), nullable=False)
    flag_name = Column(String(128), nullable=False)
    severity = Column(String(16), default="MEDIUM")  # LOW, MEDIUM, HIGH
    detected_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    direction = Column(String(32), nullable=True)  # ABOVE, BELOW, PRESENT
    explanation = Column(String(256), nullable=False)
    threshold_status = Column(String(32), default="PROVISIONAL")  # PROVISIONAL, RESEARCH_DERIVED, VALIDATED
    source = Column(String(64), default="AUTO_FLAG_ENGINE")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening = relationship("ScreeningSession", back_populates="auto_flags")
