import os
from typing import List, Optional
from pydantic import BaseModel, Field


class Settings(BaseModel):
    PROJECT_NAME: str = "ResistomeX Backend & AI Inference Service"
    API_V1_STR: str = "/api"
    VERSION: str = "2.0.0"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]
    
    # Model Artifact Paths
    MODELS_DIR: str = Field(default_factory=lambda: os.getenv("MODELS_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/models"))))
    CONFIG_DIR: str = Field(default_factory=lambda: os.getenv("CONFIG_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/config"))))
    MODEL_VERSION: str = Field(default_factory=lambda: os.getenv("MODEL_VERSION", "xgboost_amr_v002"))
    
    # Supabase Integration (Optional/Direct Backend Sync)
    SUPABASE_URL: str = Field(default_factory=lambda: os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", "https://bczedkbdwxczzonbbody.supabase.co")))
    SUPABASE_ANON_KEY: str = Field(default_factory=lambda: os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", "")))
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", None))
    
    # LLM Settings
    LLM_PROVIDER: str = Field(default_factory=lambda: os.getenv("LLM_PROVIDER", "local_adapter"))
    LLM_API_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("LLM_API_KEY", None))


settings = Settings()
