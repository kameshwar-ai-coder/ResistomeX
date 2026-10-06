from fastapi import APIRouter, HTTPException
from app.schemas.amr import PatientInputSchema, AMRPredictResponse
from app.schemas.explanation import SHAPExplainRequest, SHAPExplainResponse
from app.services.amr_service import AMRService
from app.services.explanation_service import ExplanationService

router = APIRouter(prefix="/amr", tags=["AMR Prediction & Explainability"])


@router.post("/predict", response_model=AMRPredictResponse)
def predict_amr_risk(patient_data: PatientInputSchema):
    """
    Predict pre-culture Antimicrobial Resistance (AMR) probability,
    risk level, SHAP attribution, and LLM clinical summary.
    """
    try:
        return AMRService.predict_amr_risk(patient_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference error during AMR prediction: {str(e)}"
        )


@router.post("/explain", response_model=SHAPExplainResponse)
def explain_amr_risk(explain_req: SHAPExplainRequest):
    """
    Compute TreeSHAP feature attribution breakdown for a specific patient encounter.
    """
    try:
        return ExplanationService.explain_patient(explain_req)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating SHAP explanation: {str(e)}"
        )
