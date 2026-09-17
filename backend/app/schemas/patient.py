from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class PatientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    age: int = Field(..., ge=1, le=120)
    sex: str = Field(..., pattern="^(MALE|FEMALE|OTHER)$")
    height: float = Field(..., ge=50, le=250, description="Height in cm")
    weight: float = Field(..., ge=20, le=300, description="Weight in kg")
    occupation: Optional[str] = None
    family_history: Optional[str] = None
    previous_joint_injury: bool = False

class PatientCreate(PatientBase):
    patient_identifier: Optional[str] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    occupation: Optional[str] = None
    family_history: Optional[str] = None
    previous_joint_injury: Optional[bool] = None

class PatientResponse(PatientBase):
    id: str
    patient_identifier: str
    bmi: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
