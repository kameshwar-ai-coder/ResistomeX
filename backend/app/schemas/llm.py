from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ClinicalNoteExtractRequest(BaseModel):
    raw_clinical_note: str = Field(description="Unstructured clinical admission note text")
    patient_id: Optional[str] = None
    encounter_id: Optional[str] = None


class ExtractedClinicalFeatures(BaseModel):
    temperature_c: Optional[float] = None
    heart_rate_bpm: Optional[int] = None
    systolic_bp_mmhg: Optional[int] = None
    diastolic_bp_mmhg: Optional[int] = None
    spo2_percent: Optional[int] = None
    respiratory_rate_bpm: Optional[int] = None
    crp_mg_l: Optional[float] = None
    comorbidities: List[str] = []
    previous_antibiotic_exposure: bool = False
    previous_antibiotics: List[str] = []
    prior_resistant_organism: str = "None known"
    drug_allergy: str = "None known"
    allergy_severity: Optional[str] = None
    infection_source: str = "Unknown"


class ClinicalNoteExtractResponse(BaseModel):
    success: bool = True
    extracted_features: ExtractedClinicalFeatures
    hallucination_check_passed: bool
    hallucination_warnings: List[str] = []
    sanitized_note: str
    disclaimer: str = "Extracted using deterministic, injection-safe clinical parser."
