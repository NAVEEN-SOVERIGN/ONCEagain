from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.review import HealthWorkerReviewCreate, HealthWorkerReviewResponse
from app.models.review import HealthWorkerReview
from app.services.review_service import ReviewService

router = APIRouter(prefix="/reviews", tags=["Health Worker Review"])

@router.post("", response_model=HealthWorkerReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(data: HealthWorkerReviewCreate, db: Session = Depends(get_db)):
    try:
        return ReviewService.submit_review(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{screening_id}", response_model=HealthWorkerReviewResponse)
def get_review(screening_id: str, db: Session = Depends(get_db)):
    review = db.query(HealthWorkerReview).filter(HealthWorkerReview.screening_session_id == screening_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found for this session")
    return review
