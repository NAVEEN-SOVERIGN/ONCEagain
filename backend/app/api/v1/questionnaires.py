from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.questionnaire import QuestionnaireBatchSubmit, QuestionnaireResponseSchema
from app.models.questionnaire import QuestionnaireResponse

router = APIRouter(prefix="/questionnaires", tags=["Questionnaires"])

@router.post("/batch", response_model=List[QuestionnaireResponseSchema], status_code=status.HTTP_201_CREATED)
def submit_questionnaire(data: QuestionnaireBatchSubmit, db: Session = Depends(get_db)):
    # Clear existing items for same questionnaire
    db.query(QuestionnaireResponse).filter(
        QuestionnaireResponse.screening_session_id == data.screening_session_id,
        QuestionnaireResponse.questionnaire_type == data.questionnaire_type
    ).delete()
    
    saved = []
    for item in data.items:
        qr = QuestionnaireResponse(
            screening_session_id=data.screening_session_id,
            questionnaire_type=data.questionnaire_type,
            question_code=item.question_code,
            question_text=item.question_text,
            response_value=item.response_value,
            response_label=item.response_label
        )
        db.add(qr)
        saved.append(qr)
    db.commit()
    for s in saved:
        db.refresh(s)
    return saved

@router.get("/{screening_id}", response_model=List[QuestionnaireResponseSchema])
def get_questionnaire_responses(screening_id: str, db: Session = Depends(get_db)):
    return db.query(QuestionnaireResponse).filter(QuestionnaireResponse.screening_session_id == screening_id).all()
