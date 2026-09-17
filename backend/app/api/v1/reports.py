from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.report import ReportResponse
from app.models.report import Report
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("", response_model=List[ReportResponse])
@router.get("/", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.generated_at.desc()).all()

@router.post("/generate/{screening_id}", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(screening_id: str, db: Session = Depends(get_db)):
    report = ReportService.generate_report(db, screening_id)
    if not report:
        raise HTTPException(status_code=404, detail="Screening session not found")
    return report

@router.get("/{screening_id}", response_model=ReportResponse)
def get_latest_report(screening_id: str, db: Session = Depends(get_db)):
    report = ReportService.get_latest_report(db, screening_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not generated for this session")
    return report

