from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.red_flag import RedFlagResponse
from app.models.red_flag import RedFlag
from app.services.red_flag_service import RedFlagService

router = APIRouter(prefix="/red-flags", tags=["Red Flags"])

@router.post("/check/{screening_id}", response_model=List[RedFlagResponse], status_code=status.HTTP_200_OK)
def check_red_flags(screening_id: str, db: Session = Depends(get_db)):
    return RedFlagService.evaluate_red_flags(db, screening_id)

@router.get("/{screening_id}", response_model=List[RedFlagResponse])
def get_red_flags(screening_id: str, db: Session = Depends(get_db)):
    return db.query(RedFlag).filter(RedFlag.screening_session_id == screening_id).all()
