from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.services.sync_service import SyncService

router = APIRouter(prefix="/sync", tags=["Offline Sync"])

@router.get("/bundle", response_model=Dict[str, Any])
def export_bundle(db: Session = Depends(get_db)):
    return SyncService.export_pending_records(db)
