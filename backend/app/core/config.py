import os
from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Offline OA Screening Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # SQLite offline-first database
    DATA_DIR: Path = BASE_DIR / "data"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/data/oa_screening.db"
    
    # CORS settings for frontend local access
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    
    # Audit and logging
    ENABLE_AUDIT_LOGS: bool = True
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
os.makedirs(settings.DATA_DIR, exist_ok=True)
