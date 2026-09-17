import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_name = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    action = Column(String(32), nullable=False)  # CREATE, UPDATE, DELETE, REVIEW, SIMULATE
    user_id = Column(String(64), default="system")
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
