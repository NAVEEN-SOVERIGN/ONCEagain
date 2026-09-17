from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.feature import MovementFeatureCreate, MovementFeatureResponse
from app.models.feature import MovementFeature

router = APIRouter(prefix="/features", tags=["Movement Features"])

@router.post("", response_model=MovementFeatureResponse, status_code=status.HTTP_201_CREATED)
def create_feature(data: MovementFeatureCreate, db: Session = Depends(get_db)):
    mf = MovementFeature(**data.model_dump())
    db.add(mf)
    db.commit()
    db.refresh(mf)
    return mf

@router.get("/{screening_id}", response_model=List[MovementFeatureResponse])
def get_features(screening_id: str, db: Session = Depends(get_db)):
    return db.query(MovementFeature).filter(MovementFeature.screening_session_id == screening_id).all()
