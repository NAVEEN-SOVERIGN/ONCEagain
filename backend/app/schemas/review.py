from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class HealthWorkerReviewCreate(BaseModel):
    screening_session_id: str
    final_result: str = Field(..., pattern="^(CONFIRMED_TIER_1|CONFIRMED_TIER_2|CONFIRMED_TIER_3|OVERRIDDEN_TIER_1|OVERRIDDEN_TIER_2|OVERRIDDEN_TIER_3|ESCALATED_RED_FLAG)$")
    reviewed_by: str = Field(..., min_length=1, max_length=128)
    review_notes: Optional[str] = None
    override_reason: Optional[str] = None

class HealthWorkerReviewResponse(BaseModel):
    id: str
    screening_session_id: str
    automated_result: str
    final_result: str
    reviewed_by: str
    review_notes: Optional[str] = None
    override_reason: Optional[str] = None
    reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)
