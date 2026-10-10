from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SensitivityEntry(BaseModel):
    antibiotic: str
    mic: str = Field(description="e.g. <= 0.5 µg/mL or >= 64 µg/mL")
    result: str = Field(description="Susceptible | Intermediate | Resistant")
    clsi_breakpoint: Optional[str] = None


class CultureReportCreate(BaseModel):
    patient_id: str
    specimen: str = Field(description="Blood, Urine, Sputum, Deep Tissue, BAL, etc.")
    collection_datetime: Optional[str] = None
    incubation_hours: Optional[int] = 48
    gram_stain: Optional[str] = "Gram-negative bacilli"
    organism: str = Field(description="Identified Pathogen Species")
    resistance_phenotype: Optional[str] = "ESBL Producer"
    sensitivities: List[SensitivityEntry] = Field(default_factory=list)
    lab_technician: Optional[str] = "Microbiology Lab Specialist"
    notes: Optional[str] = None
    raw_lab_note: Optional[str] = None

    # Contextual fields for closing the AI learning loop
    prescribed_regimen: Optional[str] = None
    predicted_amr_prob: Optional[float] = None
    predicted_risk_level: Optional[str] = None


class CultureValidationResponse(BaseModel):
    success: bool = True
    report_id: str
    patient_id: str
    specimen: str
    organism: str
    resistance_phenotype: str
    ground_truth_label: int = Field(description="1 for Resistant isolate, 0 for Susceptible")
    ai_prediction_concordance: str
    concordance_status: str = Field(description="CONCORDANT | FALSE_POSITIVE | FALSE_NEGATIVE | TRUE_NEGATIVE")
    prescribed_regimen_effective: bool
    prescribed_regimen_coverage_status: str
    learning_loop_closed: bool = True
    model_calibration_adjustment: Dict[str, Any] = Field(default_factory=dict)
    clinical_action_advisory: str
    created_at: str
    sensitivities_count: int = 0
    message: str = "Microbiology culture verified and ground-truth active learning loop closed."


class CultureLearningStatsResponse(BaseModel):
    total_cultures_validated: int
    true_positives: int
    true_negatives: int
    false_positives: int
    false_negatives: int
    overall_concordance_rate_percent: float
    effective_prescribing_rate_percent: float
    supervised_active_learning_samples: int
    recent_validated_cultures: List[Dict[str, Any]]
