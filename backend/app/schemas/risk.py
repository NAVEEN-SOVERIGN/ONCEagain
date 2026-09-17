from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class ContributingFeature(BaseModel):
    feature: str
    value: Any
    weight: float
    direction: str  # INCREASES_RISK, PROTECTIVE, NEUTRAL
    explanation: str

class RiskAssessmentResponse(BaseModel):
    id: str
    screening_session_id: str
    risk_tier: str  # TIER_1_LOW_RISK, TIER_2_ELEVATED_RISK, TIER_3_PROBABLE_OA
    risk_score: float
    model_version: str
    contributing_features: List[Dict[str, Any]]
    explanation: str
    status: str
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)
