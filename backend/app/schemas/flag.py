from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AutoFlagResponse(BaseModel):
    id: str
    screening_session_id: str
    category: str
    flag_code: str
    flag_name: str
    severity: str
    detected_value: Optional[float] = None
    threshold_value: Optional[float] = None
    direction: Optional[str] = None
    explanation: str
    threshold_status: str
    source: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
