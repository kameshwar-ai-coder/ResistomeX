from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DoctorDecisionCreate(BaseModel):
    patient_id: str
    assessment_id: Optional[str] = None
    decision_type: str = Field(description="ACCEPT | MODIFY | OVERRIDE")
    chosen_option: str
    rationale: str
    decided_by: Optional[str] = "attending_physician"

    # Contextual Clinical Metadata
    infection_source: Optional[str] = "Unknown"
    patient_age: Optional[int] = None
    patient_ward: Optional[str] = None
    predicted_amr_prob: Optional[float] = None

    # Detailed Structured Dimensions for ACCEPT
    confirmed_pathogens: Optional[List[str]] = Field(default_factory=list)
    confirmed_risk_level: Optional[str] = None
    confirmed_duration_days: Optional[int] = 7
    therapeutic_intent: Optional[str] = "Empiric"
    agreed_shap_features: Optional[List[str]] = Field(default_factory=list)

    # Detailed Structured Dimensions for MODIFY
    modification_category: Optional[str] = None
    modified_drug: Optional[str] = None
    modified_dosage: Optional[str] = None
    modified_frequency: Optional[str] = None
    modified_route: Optional[str] = "IV"
    modified_duration_days: Optional[int] = 7
    clinical_justification: Optional[str] = None
    overweighted_features: Optional[List[str]] = Field(default_factory=list)
    underweighted_features: Optional[List[str]] = Field(default_factory=list)

    # Detailed Structured Dimensions for OVERRIDE
    override_reason: Optional[str] = None
    custom_drug: Optional[str] = None
    custom_dosage: Optional[str] = None
    custom_frequency: Optional[str] = None
    custom_route: Optional[str] = "IV"
    custom_duration_days: Optional[int] = 7
    disagreed_ai_assumptions: Optional[List[str]] = Field(default_factory=list)

    # Active Learning / Reward Feedback
    feedback_reward_score: Optional[float] = None


class ActiveLearningStatsResponse(BaseModel):
    total_decisions_logged: int
    accept_count: int
    modify_count: int
    override_count: int
    active_learning_buffer_size: int
    learned_preferences: List[Dict[str, Any]]
    recent_few_shot_examples: List[Dict[str, Any]]
    model_recalibration_status: str


class DoctorDecisionResponse(BaseModel):
    success: bool = True
    id: Optional[str] = None
    patient_id: str
    decision_type: str
    chosen_option: str
    rationale: str
    decided_by: str
    decided_at: str
    audit_logged: bool = True
    learning_impact: Dict[str, Any] = Field(default_factory=dict)
    message: str = "Doctor decision recorded successfully in audit log and active learning engine."
