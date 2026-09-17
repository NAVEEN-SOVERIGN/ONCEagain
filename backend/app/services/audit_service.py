from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from typing import Dict, Any

class AuditService:
    @staticmethod
    def log(db: Session, entity_name: str, entity_id: str, action: str, user_id: str = "health_worker", details: Dict[str, Any] = None):
        entry = AuditLog(
            entity_name=entity_name,
            entity_id=entity_id,
            action=action,
            user_id=user_id,
            details=details or {}
        )
        db.add(entry)
        db.commit()
