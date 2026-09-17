from pydantic import BaseModel, ConfigDict
from datetime import datetime

class RedFlagResponse(BaseModel):
    id: str
    screening_session_id: str
    flag_code: str
    flag_name: str
    severity: str
    detected: bool
    explanation: str
    action_required: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RedFlagCheckInput(BaseModel):
    screening_session_id: str
