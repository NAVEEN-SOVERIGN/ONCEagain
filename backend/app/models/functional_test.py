import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class FunctionalTest(Base):
    __tablename__ = "functional_tests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    test_type = Column(String(64), nullable=False)  # TUG, SQUAT, ALIGNMENT, STEP_UP, STEP_DOWN
    status = Column(String(32), default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    quality_status = Column(String(32), default="PASSED")  # PASSED, QUALITY_INSUFFICIENT, BORDERLINE
    result_summary = Column(JSON, default=dict)

    screening = relationship("ScreeningSession", back_populates="functional_tests")
    results = relationship("FunctionalTestResult", back_populates="functional_test", cascade="all, delete-orphan")
    movement_features = relationship("MovementFeature", back_populates="functional_test", cascade="all, delete-orphan")

class FunctionalTestResult(Base):
    __tablename__ = "functional_test_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    functional_test_id = Column(String(36), ForeignKey("functional_tests.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_name = Column(String(64), nullable=False)
    metric_value = Column(Float, nullable=False)
    unit = Column(String(16), nullable=False)
    side = Column(String(16), default="BILATERAL")  # LEFT, RIGHT, BILATERAL
    quality_flag = Column(String(32), default="VALID")

    functional_test = relationship("FunctionalTest", back_populates="results")
