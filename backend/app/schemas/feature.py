from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MovementFeatureCreate(BaseModel):
    screening_session_id: str
    functional_test_id: Optional[str] = None
    feature_name: str
    feature_value: float
    unit: str
    body_side: str = "BILATERAL"
    confidence: float = 1.0
    source: str = "CAMERA_ESTIMATE"

class MovementFeatureResponse(MovementFeatureCreate):
    id: str

    model_config = ConfigDict(from_attributes=True)
