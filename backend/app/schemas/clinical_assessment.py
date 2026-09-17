from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class ClinicalAssessmentBase(BaseModel):
    morning_stiffness_minutes: int = Field(0, ge=0, le=240)
    joint_swelling: bool = False
    pain_nrs_score: int = Field(0, ge=0, le=10)
    knee_flexion_rom_deg: Optional[float] = Field(None, ge=0, le=160)
    knee_extension_rom_deg: Optional[float] = Field(None, ge=-30, le=30)
    crepitus_present: bool = False
    joint_line_tenderness: bool = False
    alignment_observation: str = Field("NORMAL", pattern="^(NORMAL|VARUS|VALGUS)$")
    clinician_notes: Optional[str] = None

class ClinicalAssessmentCreate(ClinicalAssessmentBase):
    screening_session_id: str

class ClinicalAssessmentResponse(ClinicalAssessmentBase):
    id: str
    screening_session_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
