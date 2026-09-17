import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(String(32), default="COMPREHENSIVE_TRIAGE")
    reviewed_status = Column(String(32), default="PENDING_REVIEW")
    report_data = Column(JSON, default=dict)
    pdf_path = Column(String(256), nullable=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening = relationship("ScreeningSession", back_populates="reports")
