from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class QuestionnaireItemInput(BaseModel):
    question_code: str
    question_text: str
    response_value: float
    response_label: Optional[str] = None

class QuestionnaireBatchSubmit(BaseModel):
    screening_session_id: str
    questionnaire_type: str = "KOOS_OA"
    items: List[QuestionnaireItemInput]

class QuestionnaireResponseSchema(BaseModel):
    id: str
    screening_session_id: str
    questionnaire_type: str
    question_code: str
    question_text: str
    response_value: float
    response_label: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
