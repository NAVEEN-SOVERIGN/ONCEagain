import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class ClinicalAssessment(Base):
    __tablename__ = "clinical_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    morning_stiffness_minutes = Column(Integer, default=0)
    joint_swelling = Column(Boolean, default=False)
    pain_nrs_score = Column(Integer, default=0)  # 0 to 10
    knee_flexion_rom_deg = Column(Float, nullable=True)
    knee_extension_rom_deg = Column(Float, nullable=True)
    crepitus_present = Column(Boolean, default=False)
    joint_line_tenderness = Column(Boolean, default=False)
    alignment_observation = Column(String(32), default="NORMAL")  # NORMAL, VARUS, VALGUS
    clinician_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening = relationship("ScreeningSession", back_populates="clinical_assessment")
