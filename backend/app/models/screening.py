import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class ScreeningSession(Base):
    __tablename__ = "screening_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    screening_status = Column(String(32), default="IN_PROGRESS")  # IN_PROGRESS, COMPLETED, REVIEWED, QUALITY_INSUFFICIENT
    operator_name = Column(String(128), nullable=True)
    camp_location = Column(String(128), nullable=True)
    device_metadata = Column(JSON, default=dict)

    patient = relationship("Patient", back_populates="screenings")
    questionnaire_responses = relationship("QuestionnaireResponse", back_populates="screening", cascade="all, delete-orphan")
    clinical_assessment = relationship("ClinicalAssessment", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    functional_tests = relationship("FunctionalTest", back_populates="screening", cascade="all, delete-orphan")
    sensor_recordings = relationship("SensorRecording", back_populates="screening", cascade="all, delete-orphan")
    camera_recordings = relationship("CameraRecording", back_populates="screening", cascade="all, delete-orphan")
    movement_features = relationship("MovementFeature", back_populates="screening", cascade="all, delete-orphan")
    auto_flags = relationship("AutoFlag", back_populates="screening", cascade="all, delete-orphan")
    risk_assessment = relationship("RiskAssessment", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    red_flags = relationship("RedFlag", back_populates="screening", cascade="all, delete-orphan")
    health_worker_review = relationship("HealthWorkerReview", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="screening", cascade="all, delete-orphan")
