from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.functional_test import FunctionalTest, FunctionalTestResult
from app.schemas.functional_test import FunctionalTestCreate
from app.services.audit_service import AuditService

class FunctionalTestService:
    @staticmethod
    def record_test(db: Session, data: FunctionalTestCreate, user_id: str = "health_worker") -> FunctionalTest:
        func_test = FunctionalTest(
            screening_session_id=data.screening_session_id,
            test_type=data.test_type,
            status="COMPLETED",
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            duration_seconds=data.duration_seconds,
            quality_status=data.quality_status,
            result_summary=data.result_summary or {}
        )
        db.add(func_test)
        db.flush()

        if data.results:
            for r in data.results:
                res = FunctionalTestResult(
                    functional_test_id=func_test.id,
                    metric_name=r.metric_name,
                    metric_value=r.metric_value,
                    unit=r.unit,
                    side=r.side,
                    quality_flag=r.quality_flag
                )
                db.add(res)
                
        db.commit()
        db.refresh(func_test)
        AuditService.log(db, "FunctionalTest", func_test.id, "CREATE", user_id, {"test_type": data.test_type})
        return func_test

    @staticmethod
    def get_tests_for_session(db: Session, session_id: str) -> List[FunctionalTest]:
        return db.query(FunctionalTest).filter(FunctionalTest.screening_session_id == session_id).all()
