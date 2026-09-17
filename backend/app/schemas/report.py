from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Optional
from datetime import datetime

class ReportResponse(BaseModel):
    id: str
    screening_session_id: str
    report_type: str
    reviewed_status: str
    report_data: Dict[str, Any]
    pdf_path: Optional[str] = None
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)
