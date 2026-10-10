from fastapi import APIRouter, HTTPException
from app.schemas.decision import (
    DoctorDecisionCreate, 
    DoctorDecisionResponse,
    ActiveLearningStatsResponse
)
from app.services.decision_service import DecisionService

router = APIRouter(prefix="/decisions", tags=["Doctor Clinical Decisions & Active Learning"])


@router.post("", response_model=DoctorDecisionResponse)
def record_decision(decision_in: DoctorDecisionCreate):
    """
    Record physician clinical decision (Accept, Modify, Override)
    with multi-dimensional clinical parameters into immutable EHR audit trail
    and feed into the active learning reinforcement loop.
    """
    try:
        return DecisionService.record_decision(decision_in)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording decision: {str(e)}")


@router.get("/active-learning-stats", response_model=ActiveLearningStatsResponse)
def get_active_learning_stats():
    """
    Retrieve current active learning statistics, reward distribution,
    and clinician-learned preference patterns for model calibration.
    """
    try:
        return DecisionService.get_active_learning_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching active learning stats: {str(e)}")
