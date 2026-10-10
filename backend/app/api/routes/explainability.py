from fastapi import APIRouter, HTTPException
from app.schemas.explanation import SHAPExplainRequest, SHAPExplainResponse
from app.services.explanation_service import ExplanationService

router = APIRouter(prefix="/explainability", tags=["Explainability Layer"])


@router.post("/shap", response_model=SHAPExplainResponse)
def explain_shap(explain_req: SHAPExplainRequest):
    """Compute TreeSHAP feature attributions and risk directionalities."""
    try:
        return ExplanationService.explain_patient(explain_req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explainability calculation error: {str(e)}")
