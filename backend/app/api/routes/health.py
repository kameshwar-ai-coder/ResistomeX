from fastapi import APIRouter
from app.services.model_registry import model_registry
from app.core.config import settings

router = APIRouter(tags=["Health & Status"])


@router.get("/health")
def health_check():
    """Return backend status, loaded model version, and system health."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_loaded": model_registry.is_loaded,
        "model_version": model_registry.metadata.get("model_version", settings.MODEL_VERSION),
        "target_version": model_registry.metadata.get("target_version", "any_amr_isolate"),
        "disclaimer": "SUPPORTING DOCTORS, NOT REPLACING DOCTORS. Clinical Decision Support System."
    }
