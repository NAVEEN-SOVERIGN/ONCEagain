from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.patient import PatientResponse
from app.schemas.questionnaire import QuestionnaireResponseSchema
from app.schemas.clinical_assessment import ClinicalAssessmentResponse
from app.schemas.functional_test import FunctionalTestResponse
from app.schemas.flag import AutoFlagResponse
from app.schemas.risk import RiskAssessmentResponse
from app.schemas.red_flag import RedFlagResponse
from app.schemas.review import HealthWorkerReviewResponse
from app.schemas.feature import MovementFeatureResponse

class ScreeningCreate(BaseModel):
    patient_id: str
    operator_name: Optional[str] = None
    camp_location: Optional[str] = "Community Camp"
    device_metadata: Optional[Dict[str, Any]] = None

class ScreeningUpdate(BaseModel):
    screening_status: Optional[str] = None
    completed_at: Optional[datetime] = None

class ScreeningResponse(BaseModel):
    id: str
    patient_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    screening_status: str
    operator_name: Optional[str] = None
    camp_location: Optional[str] = None
    device_metadata: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)

class ScreeningDetailResponse(ScreeningResponse):
    patient: Optional[PatientResponse] = None
    questionnaire_responses: List[QuestionnaireResponseSchema] = []
    clinical_assessment: Optional[ClinicalAssessmentResponse] = None
    functional_tests: List[FunctionalTestResponse] = []
    movement_features: List[MovementFeatureResponse] = []
    auto_flags: List[AutoFlagResponse] = []
    risk_assessment: Optional[RiskAssessmentResponse] = None
    red_flags: List[RedFlagResponse] = []
    health_worker_review: Optional[HealthWorkerReviewResponse] = None

    model_config = ConfigDict(from_attributes=True)
