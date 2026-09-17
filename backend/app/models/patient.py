import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_identifier = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(16), nullable=False)  # MALE, FEMALE, OTHER
    height = Column(Float, nullable=False)     # in cm
    weight = Column(Float, nullable=False)     # in kg
    bmi = Column(Float, nullable=False)
    occupation = Column(String(128), nullable=True)
    family_history = Column(String(256), nullable=True)
    previous_joint_injury = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    screenings = relationship("ScreeningSession", back_populates="patient", cascade="all, delete-orphan")
