import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class SensorDevice(Base):
    __tablename__ = "sensor_devices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    device_type = Column(String(32), default="IMU_6AXIS")  # IMU_6AXIS, IMU_9AXIS, SMARTPHONE
    firmware_version = Column(String(32), default="1.0.0")
    status = Column(String(32), default="DISCONNECTED")  # CONNECTED, DISCONNECTED, STREAMING

    recordings = relationship("SensorRecording", back_populates="device")

class SensorRecording(Base):
    __tablename__ = "sensor_recordings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_session_id = Column(String(36), ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_device_id = Column(String(36), ForeignKey("sensor_devices.id", ondelete="SET NULL"), nullable=True)
    sensor_type = Column(String(32), default="IMU")
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    sampling_rate_hz = Column(Float, default=50.0)
    recording_status = Column(String(32), default="COMPLETED")  # RECORDING, COMPLETED, FAILED

    screening = relationship("ScreeningSession", back_populates="sensor_recordings")
    device = relationship("SensorDevice", back_populates="recordings")
    samples = relationship("SensorSample", back_populates="recording", cascade="all, delete-orphan")

class SensorSample(Base):
    __tablename__ = "sensor_samples"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sensor_recording_id = Column(String(36), ForeignKey("sensor_recordings.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp_ms = Column(Float, nullable=False)
    accel_x = Column(Float, nullable=False)
    accel_y = Column(Float, nullable=False)
    accel_z = Column(Float, nullable=False)
    gyro_x = Column(Float, nullable=False)
    gyro_y = Column(Float, nullable=False)
    gyro_z = Column(Float, nullable=False)

    recording = relationship("SensorRecording", back_populates="samples")

    __table_args__ = (
        Index("idx_recording_time", "sensor_recording_id", "timestamp_ms"),
    )
