import uuid
from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class MovementFeature(Base):
    __tablename__ = "movement_features"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    functional_test_id = Column(String(36), ForeignKey("functional_tests.id", ondelete="SET NULL"), nullable=True)
    feature_name = Column(String(64), nullable=False)
    feature_value = Column(Float, nullable=False)
    unit = Column(String(16), nullable=False)
    body_side = Column(String(16), default="BILATERAL")
    confidence = Column(Float, default=1.0)
    source = Column(String(64), default="CAMERA_ESTIMATE")  # CAMERA_ESTIMATE, IMU_KINEMATICS, MANUAL

    screening = relationship("ScreeningSession", back_populates="movement_features")
    functional_test = relationship("FunctionalTest", back_populates="movement_features")
