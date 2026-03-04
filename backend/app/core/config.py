"""
Core configuration settings for AI Guardian
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AI Guardian"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "Production-grade AI evaluation platform"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    API_KEY_HEADER: str = "X-API-Key"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ai_guardian"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # ML Models
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    SAFETY_MODEL: str = "unitary/toxic-bert"
    
    # Evaluation Thresholds
    HALLUCINATION_THRESHOLD: float = 0.7
    SAFETY_THRESHOLD: float = 0.8
    CONFIDENCE_THRESHOLD: float = 0.6
    
    # Performance
    MAX_WORKERS: int = 4
    CACHE_TTL: int = 3600  # 1 hour

    # OpenTelemetry
    OTEL_ENABLED: bool = False
    OTEL_EXPORTER_ENDPOINT: str = "http://localhost:4317"
    OTEL_SERVICE_NAME: str = "ai-guardian"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
