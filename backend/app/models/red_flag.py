import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class RedFlag(Base):
    __tablename__ = "red_flags"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    flag_code = Column(String(64), nullable=False)
    flag_name = Column(String(128), nullable=False)
    severity = Column(String(16), default="CRITICAL")  # CRITICAL, URGENT
    detected = Column(Boolean, default=False)
    explanation = Column(String(256), nullable=False)
    action_required = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening = relationship("ScreeningSession", back_populates="red_flags")
