import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class QuestionnaireResponse(Base):
    __tablename__ = "questionnaire_responses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    questionnaire_type = Column(String(64), default="KOOS_OA")
    question_code = Column(String(32), nullable=False)
    question_text = Column(String(256), nullable=False)
    response_value = Column(Float, nullable=False)
    response_label = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening = relationship("ScreeningSession", back_populates="questionnaire_responses")
