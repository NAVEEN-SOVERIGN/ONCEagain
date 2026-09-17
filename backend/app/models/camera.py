import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class CameraRecording(Base):
    __tablename__ = "camera_recordings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    camera_position = Column(String(32), default="FRONTAL")  # FRONTAL, SAGITTAL
    calibration_status = Column(String(32), default="CALIBRATED")  # CALIBRATED, UNCALIBRATED
    processing_status = Column(String(32), default="COMPLETED")  # PENDING, COMPLETED, ERROR
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)

    screening = relationship("ScreeningSession", back_populates="camera_recordings")
