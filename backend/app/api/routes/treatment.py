from fastapi import APIRouter, HTTPException
from app.schemas.treatment import TreatmentSupportRequest, TreatmentSupportResponse
from app.services.treatment_service import TreatmentService

router = APIRouter(prefix="/treatment", tags=["Treatment Support"])


@router.post("/support", response_model=TreatmentSupportResponse)
def get_treatment_support(req: TreatmentSupportRequest):
    """
    Generate guideline-concordant, rule-filtered empiric antibiotic regimens
    conditioned on predicted AMR risk, allergy status, and renal impairment.
    """
    try:
        return TreatmentService.get_treatment_support(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating treatment recommendations: {str(e)}")
