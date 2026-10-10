import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.api.routes import api_router
from app.api.routes.health import router as health_root_router
from app.services.model_registry import model_registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: load model artifacts on startup."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    if not model_registry.is_loaded:
        logger.warning("Model registry could not load all artifacts on initialization.")
    else:
        logger.info(
            f"Model registry loaded successfully: version={model_registry.metadata.get('model_version', settings.MODEL_VERSION)}"
        )
    yield
    logger.info("Shutting down ResistomeX backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "ResistomeX Clinical Antimicrobial Resistance (AMR) Decision Support Backend. "
        "Provides pre-culture risk prediction, TreeSHAP feature attribution, rule-filtered empiric treatment recommendations, "
        "and injection-safe clinical note extraction."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler to sanitize errors and protect system internals
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal Server Error",
            "message": "An error occurred while processing the clinical request. Please contact system support.",
            "path": request.url.path
        }
    )

# Register Root Health and API Routes
app.include_router(health_root_router)
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
