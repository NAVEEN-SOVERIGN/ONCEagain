from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class SensorDeviceCreate(BaseModel):
    device_id: str
    device_type: str = "IMU_6AXIS"
    firmware_version: str = "1.0.0"

class SensorDeviceResponse(BaseModel):
    id: str
    device_id: str
    device_type: str
    firmware_version: str
    status: str

    model_config = ConfigDict(from_attributes=True)

class SensorSampleInput(BaseModel):
    timestamp_ms: float
    accel_x: float
    accel_y: float
    accel_z: float
    gyro_x: float
    gyro_y: float
    gyro_z: float

class SensorBatchInput(BaseModel):
    screening_session_id: str
    device_id: str
    sensor_type: str = "IMU"
    sampling_rate_hz: float = 50.0
    samples: List[SensorSampleInput]

class SensorSampleResponse(SensorSampleInput):
    id: str

    model_config = ConfigDict(from_attributes=True)

class SensorRecordingResponse(BaseModel):
    id: str
    screening_session_id: str
    sensor_device_id: Optional[str] = None
    sensor_type: str
    sampling_rate_hz: float
    recording_status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    samples_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
