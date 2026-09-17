from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.functional_test import FunctionalTestCreate, FunctionalTestResponse
from app.services.functional_test_service import FunctionalTestService

router = APIRouter(prefix="/functional-tests", tags=["Functional Tests"])

@router.post("", response_model=FunctionalTestResponse, status_code=status.HTTP_201_CREATED)
def record_test(data: FunctionalTestCreate, db: Session = Depends(get_db)):
    return FunctionalTestService.record_test(db, data)

@router.get("/{screening_id}", response_model=List[FunctionalTestResponse])
def get_tests(screening_id: str, db: Session = Depends(get_db)):
    return FunctionalTestService.get_tests_for_session(db, screening_id)
