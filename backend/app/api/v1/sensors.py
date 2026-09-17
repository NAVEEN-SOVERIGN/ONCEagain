from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.sensor import SensorDeviceCreate, SensorDeviceResponse, SensorBatchInput, SensorRecordingResponse, SensorSampleResponse
from app.models.sensor import SensorDevice, SensorRecording, SensorSample
from app.services.quality_service import QualityService

router = APIRouter(prefix="/sensors", tags=["Sensors & IMU"])

@router.post("/devices", response_model=SensorDeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(data: SensorDeviceCreate, db: Session = Depends(get_db)):
    device = db.query(SensorDevice).filter(SensorDevice.device_id == data.device_id).first()
    if not device:
        device = SensorDevice(**data.model_dump(), status="CONNECTED")
        db.add(device)
        db.commit()
        db.refresh(device)
    return device

@router.get("/devices", response_model=List[SensorDeviceResponse])
def list_devices(db: Session = Depends(get_db)):
    return db.query(SensorDevice).all()

@router.post("/batch", response_model=SensorRecordingResponse, status_code=status.HTTP_201_CREATED)
def ingest_sensor_batch(data: SensorBatchInput, db: Session = Depends(get_db)):
    # Validate data quality layer first
    quality_check = QualityService.validate_sensor_samples([s.model_dump() for s in data.samples])
    
    device = db.query(SensorDevice).filter(SensorDevice.device_id == data.device_id).first()
    device_id = device.id if device else None
    
    rec = SensorRecording(
        screening_session_id=data.screening_session_id,
        sensor_device_id=device_id,
        sensor_type=data.sensor_type,
        sampling_rate_hz=data.sampling_rate_hz,
        recording_status="COMPLETED" if quality_check["valid"] else "QUALITY_INSUFFICIENT"
    )
    db.add(rec)
    db.flush()
    
    for s in data.samples:
        sample = SensorSample(
            sensor_recording_id=rec.id,
            timestamp_ms=s.timestamp_ms,
            accel_x=s.accel_x,
            accel_y=s.accel_y,
            accel_z=s.accel_z,
            gyro_x=s.gyro_x,
            gyro_y=s.gyro_y,
            gyro_z=s.gyro_z
        )
        db.add(sample)
        
    db.commit()
    db.refresh(rec)
    return rec

@router.get("/recordings/{screening_id}", response_model=List[SensorRecordingResponse])
def get_recordings(screening_id: str, db: Session = Depends(get_db)):
    return db.query(SensorRecording).filter(SensorRecording.screening_session_id == screening_id).all()

@router.get("/samples/{recording_id}", response_model=List[SensorSampleResponse])
def get_samples(recording_id: str, limit: int = 500, db: Session = Depends(get_db)):
    return db.query(SensorSample).filter(SensorSample.sensor_recording_id == recording_id).order_by(SensorSample.timestamp_ms.asc()).limit(limit).all()

@router.get("/generate-stream")
def generate_stream(
    test_type: str = "TUG",
    duration_sec: float = 4.0,
    sampling_rate_hz: float = 50.0,
    severity: str = "NORMAL",
    inject_artifact: bool = False
):
    from app.domain.sensor_adapter import SimulatedSensorAdapter
    adapter = SimulatedSensorAdapter()
    samples = adapter.generate_or_read_samples(
        duration_sec=duration_sec,
        sampling_rate_hz=sampling_rate_hz,
        test_type=test_type,
        severity=severity
    )
    if inject_artifact and len(samples) > 20:
        # Inject artificial clipping to demonstrate quality gating
        samples[20]["accel_z"] = 99.0
        samples[21]["gyro_x"] = 45.0
    return {
        "test_type": test_type,
        "duration_sec": duration_sec,
        "sampling_rate_hz": sampling_rate_hz,
        "severity": severity,
        "sample_count": len(samples),
        "samples": samples
    }

