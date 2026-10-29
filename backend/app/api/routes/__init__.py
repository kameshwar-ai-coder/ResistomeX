from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from .health import router as health_router
from .amr import router as amr_router
from .explainability import router as explain_router
from .treatment import router as treatment_router
from .decisions import router as decisions_router
from .llm import router as llm_router
from .metrics import router as metrics_router
from .dataset import router as dataset_router
from .culture import router as culture_router

api_router = APIRouter()
# Health check remains open for uptime monitors
api_router.include_router(health_router)

# Clinical decision and inference endpoints protected by auth dependency
auth_dep = [Depends(get_current_user)]
api_router.include_router(amr_router, dependencies=auth_dep)
api_router.include_router(explain_router, dependencies=auth_dep)
api_router.include_router(treatment_router, dependencies=auth_dep)
api_router.include_router(decisions_router, dependencies=auth_dep)
api_router.include_router(llm_router, dependencies=auth_dep)
api_router.include_router(metrics_router, dependencies=auth_dep)
api_router.include_router(dataset_router, dependencies=auth_dep)
api_router.include_router(culture_router, dependencies=auth_dep)

__all__ = ["api_router"]

