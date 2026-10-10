from fastapi import APIRouter, HTTPException
from app.schemas.culture import (
    CultureReportCreate,
    CultureValidationResponse,
    CultureLearningStatsResponse
)
from app.services.culture_service import CultureService

router = APIRouter(prefix="/culture", tags=["Microbiology Culture & Ground-Truth Validation"])


@router.post("/report", response_model=CultureValidationResponse)
def submit_culture_report(report_in: CultureReportCreate):
    """
    Ingest verified microbiology culture report with antibiogram sensitivities,
    perform ground-truth validation against AI empiric prediction,
    verify prescribed treatment efficacy, and close the active learning loop.
    """
    try:
        return CultureService.process_culture_report(report_in)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating culture report: {str(e)}")


@router.get("/learning-loop-stats", response_model=CultureLearningStatsResponse)
def get_culture_learning_stats():
    """
    Retrieve closed-loop validation statistics (True Positives, False Positives,
    ground-truth concordance rate, and active learning supervision sample count).
    """
    try:
        return CultureService.get_learning_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching culture learning stats: {str(e)}")
