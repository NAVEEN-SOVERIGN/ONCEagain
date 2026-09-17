from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class FunctionalTestResultCreate(BaseModel):
    metric_name: str
    metric_value: float
    unit: str
    side: str = "BILATERAL"
    quality_flag: str = "VALID"

class FunctionalTestResultResponse(FunctionalTestResultCreate):
    id: str
    functional_test_id: str

    model_config = ConfigDict(from_attributes=True)

class FunctionalTestCreate(BaseModel):
    screening_session_id: str
    test_type: str = Field(..., pattern="^(TUG|SQUAT|ALIGNMENT|STEP_UP|STEP_DOWN)$")
    duration_seconds: Optional[float] = None
    quality_status: str = "PASSED"
    result_summary: Optional[Dict[str, Any]] = None
    results: Optional[List[FunctionalTestResultCreate]] = None

class FunctionalTestResponse(BaseModel):
    id: str
    screening_session_id: str
    test_type: str
    status: str
    duration_seconds: Optional[float] = None
    quality_status: str
    result_summary: Dict[str, Any]
    started_at: datetime
    completed_at: Optional[datetime] = None
    results: List[FunctionalTestResultResponse] = []

    model_config = ConfigDict(from_attributes=True)
