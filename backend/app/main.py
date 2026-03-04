"""
AI Guardian - FastAPI Application

Production-grade AI evaluation platform for monitoring LLM outputs.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import evaluate, health, auth, analytics, keys, audit, policies
from app.services.tracing import setup_tracing, instrument_app

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    health.router,
    prefix=settings.API_V1_PREFIX,
    tags=["health"]
)

app.include_router(
    evaluate.router,
    prefix=settings.API_V1_PREFIX,
    tags=["evaluation"]
)

app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["authentication"]
)

app.include_router(
    analytics.router,
    prefix=f"{settings.API_V1_PREFIX}/analytics",
    tags=["analytics"]
)

app.include_router(
    keys.router,
    prefix=f"{settings.API_V1_PREFIX}/keys",
    tags=["api-keys"]
)

app.include_router(
    audit.router,
    prefix=f"{settings.API_V1_PREFIX}/audit",
    tags=["audit"]
)

app.include_router(
    policies.router,
    prefix=settings.API_V1_PREFIX,
    tags=["policies"]
)


@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"API docs: http://localhost:8000{settings.API_V1_PREFIX}/docs")

    init_db()
    logger.info("Database initialized")

    setup_tracing()
    instrument_app(app)

    logger.info("Loading ML models...")
    from app.services.embedding import get_embedding_service
    get_embedding_service()
    logger.info("Models loaded successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI Guardian")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs": f"{settings.API_V1_PREFIX}/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
