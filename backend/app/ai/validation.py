"""Pydantic schemas and data validation models for ResistomeX AI Pipeline.

Consolidated module for ResistomeX Validation & Safety Layer.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator


class PatientFeatureSchema(BaseModel):
    """Schema for pre-culture clinical features of a patient encounter."""
    patient_id: str
    encounter_id: str
    admission_datetime: Optional[str] = None
    age_years: float = Field(ge=0, le=125)
    sex: str
    pregnancy_status: Optional[str] = "Not applicable"
    ward: str
    primary_diagnosis: str
    infection_source: str
    suspected_pathogen: Optional[str] = None
    temperature_c: float = Field(ge=30.0, le=45.0)
    heart_rate_bpm: float = Field(ge=20, le=260)
    systolic_bp_mmhg: float = Field(ge=40, le=260)
    diastolic_bp_mmhg: float = Field(ge=20, le=180)
    spo2_percent: float = Field(ge=50, le=100)
    respiratory_rate_bpm: float = Field(ge=5, le=60)
    crp_mg_l: Optional[float] = Field(default=None, ge=0.0)
    comorbidities: Optional[str] = None
    kidney_function: str
    liver_function: str
    drug_allergy: str
    allergy_severity: Optional[str] = None
    prior_antibiotic_exposure_count_90d: int = Field(ge=0)
    prior_antibiotic_90d: Optional[str] = None
    prior_antibiotic_days: int = Field(ge=0)
    prior_resistant_organism: Optional[str] = None
    ward_endemic_resistance_rate: float = Field(ge=0.0, le=1.0)


class SHAPFactor(BaseModel):
    """Individual SHAP feature contribution."""
    feature: str
    value: Any
    shap_value: float
    direction: Optional[str] = None


class SHAPExplanationSchema(BaseModel):
    """Structured SHAP explanation output."""
    patient_id: str
    encounter_id: str
    base_value: float
    predicted_amr_probability: float
    top_risk_factors: List[Dict[str, Any]]
    protective_factors: List[Dict[str, Any]]
    all_feature_impacts: List[Dict[str, Any]]


class ModelPredictionOutputSchema(BaseModel):
    """Schema for model prediction output."""
    patient_id: str
    encounter_id: str
    target_name: str
    raw_probability: float = Field(ge=0.0, le=1.0)
    calibrated_probability: float = Field(ge=0.0, le=1.0)
    risk_category: str
    confidence_level: str
    abstention_flag: bool = False
    abstention_reason: Optional[str] = None
    model_version: str
    timestamp: str


class LLMExtractionSchema(BaseModel):
    """Schema for structured clinical information extracted from clinical notes."""
    previous_antibiotic_exposure: Optional[bool] = None
    previous_antibiotics: Optional[List[str]] = Field(default_factory=list)
    prior_resistant_organism: Optional[str] = "None known"
    drug_allergy: Optional[str] = "None known"
    allergy_severity: Optional[str] = None
    infection_source: Optional[str] = "Unknown"
    temperature_c: Optional[float] = None
    heart_rate_bpm: Optional[int] = None
    systolic_bp_mmhg: Optional[int] = None
    diastolic_bp_mmhg: Optional[int] = None
    spo2_percent: Optional[int] = None
    respiratory_rate_bpm: Optional[int] = None
    crp_mg_l: Optional[float] = None
    comorbidities: Optional[List[str]] = Field(default_factory=list)


class CandidateRegimenSchema(BaseModel):
    """Individual candidate antibiotic regimen."""
    regimen_id: str
    antibiotic_name: str
    spectrum: str
    line_type: str
    dosing_guidance: str
    contraindications: List[str]
    renal_adjustment_required: bool = False


class TreatmentRecommendationSchema(BaseModel):
    """Structured clinical decision support recommendation output."""
    patient_id: str
    encounter_id: str
    predicted_amr_probability: float
    risk_category: str
    infection_source: str
    candidate_regimens: List[CandidateRegimenSchema]
    safety_warnings: List[str]
    antimicrobial_stewardship_rationale: str
    disclaimer: str = "SUPPORTING DOCTORS, NOT REPLACING DOCTORS. Advisory decision-support only."


# Aliases for backward compatibility
PatientFeatures = PatientFeatureSchema
SHAPExplanation = SHAPExplanationSchema
ModelPrediction = ModelPredictionOutputSchema
LLMExtraction = LLMExtractionSchema
TreatmentOption = CandidateRegimenSchema
RecommendationOutput = TreatmentRecommendationSchema
