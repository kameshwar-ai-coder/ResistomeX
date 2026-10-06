from typing import List, Optional
from pydantic import BaseModel, Field


class TreatmentSupportRequest(BaseModel):
    patient_id: str
    encounter_id: str
    predicted_amr_probability: float = Field(ge=0.0, le=1.0)
    infection_source: str
    drug_allergy: str = "None known"
    kidney_function: str = "Normal"


class AntibioticOptionSchema(BaseModel):
    regimen_id: str
    antibiotic_name: str
    spectrum: str
    line_type: str
    dosing_guidance: str
    contraindications: List[str] = []
    renal_adjustment_required: bool = False
    coverage_score_percent: int = 85


class TreatmentSupportResponse(BaseModel):
    success: bool = True
    patient_id: str
    encounter_id: str
    predicted_amr_probability: float
    risk_category: str
    infection_source: str
    candidate_regimens: List[AntibioticOptionSchema]
    safety_warnings: List[str]
    stewardship_rationale: str
    disclaimer: str = "SUPPORTING DOCTORS, NOT REPLACING DOCTORS. Guideline-filtered empiric suggestions."
