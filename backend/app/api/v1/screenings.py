from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.screening import ScreeningCreate, ScreeningUpdate, ScreeningResponse, ScreeningDetailResponse
from app.services.screening_service import ScreeningService

router = APIRouter(prefix="/screenings", tags=["Screenings"])

@router.post("", response_model=ScreeningResponse, status_code=status.HTTP_201_CREATED)
def create_screening(data: ScreeningCreate, db: Session = Depends(get_db)):
    return ScreeningService.create_screening(db, data)

@router.get("", response_model=List[ScreeningResponse])
def list_screenings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return ScreeningService.list_screenings(db, skip=skip, limit=limit)

@router.get("/{screening_id}", response_model=ScreeningDetailResponse)
def get_screening_detail(screening_id: str, db: Session = Depends(get_db)):
    screening = ScreeningService.get_screening(db, screening_id)
    if not screening:
        raise HTTPException(status_code=404, detail="Screening session not found")
    return screening

@router.patch("/{screening_id}", response_model=ScreeningResponse)
def update_screening(screening_id: str, data: ScreeningUpdate, db: Session = Depends(get_db)):
    screening = ScreeningService.update_screening(db, screening_id, data)
    if not screening:
        raise HTTPException(status_code=404, detail="Screening session not found")
    return screening
