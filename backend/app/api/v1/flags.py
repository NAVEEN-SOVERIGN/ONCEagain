from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.flag import AutoFlagResponse
from app.models.flag import AutoFlag
from app.services.autoflag_service import AutoFlaggingService

router = APIRouter(prefix="/flags", tags=["Auto-Flagging"])

@router.post("/evaluate/{screening_id}", response_model=List[AutoFlagResponse], status_code=status.HTTP_200_OK)
def evaluate_flags(screening_id: str, db: Session = Depends(get_db)):
    return AutoFlaggingService.evaluate_and_store_flags(db, screening_id)

@router.get("/{screening_id}", response_model=List[AutoFlagResponse])
def get_flags(screening_id: str, db: Session = Depends(get_db)):
    return db.query(AutoFlag).filter(AutoFlag.screening_session_id == screening_id).all()
