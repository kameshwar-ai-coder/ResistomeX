from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PatientInputSchema(BaseModel):
    """Input EHR / clinical features for AMR risk prediction."""
    patient_id: str = Field(default="PT-001", description="Unique patient identifier")
    encounter_id: str = Field(default="ENC-001", description="Unique clinical encounter identifier")
    patient_name: Optional[str] = "Clinical Patient"
    admission_datetime: Optional[str] = None
    age_years: float = Field(ge=0, le=125, default=65.0)
    sex: str = Field(default="Female", description="Male | Female | Other")
    pregnancy_status: Optional[str] = "Not applicable"
    ward: str = Field(default="General Medicine", description="ICU | General Medicine | Emergency Department | Surgical Ward")
    bed: Optional[str] = "Bed 101"
    primary_diagnosis: str = Field(default="Complicated UTI", description="Clinical primary diagnosis")
    infection_source: str = Field(default="Urinary Tract Infection", description="Infection source classification")
    suspected_pathogen: Optional[str] = "E. coli"
    
    # Vital signs
    temperature_c: float = Field(ge=30.0, le=45.0, default=38.4)
    heart_rate_bpm: float = Field(ge=20, le=260, default=98.0)
    systolic_bp_mmhg: float = Field(ge=40, le=260, default=115.0)
    diastolic_bp_mmhg: float = Field(ge=20, le=180, default=72.0)
    spo2_percent: float = Field(ge=50, le=100, default=97.0)
    respiratory_rate_bpm: float = Field(ge=5, le=60, default=18.0)
    crp_mg_l: Optional[float] = Field(default=45.0, ge=0.0)
    
    # Comorbidities & Organ function
    comorbidities: Optional[str] = Field(default="Diabetes; Hypertension", description="Semicolon-separated comorbidities")
    kidney_function: str = Field(default="Normal", description="Normal | Mild impairment | Moderate impairment | Severe impairment | AKI")
    liver_function: str = Field(default="Normal", description="Normal | Mild impairment | Moderate impairment | Severe impairment")
    
    # Allergies & Exposures
    drug_allergy: str = Field(default="None known", description="Reported drug allergy")
    allergy_severity: Optional[str] = None
    prior_antibiotic_exposure_count_90d: int = Field(ge=0, default=1)
    prior_antibiotic_90d: Optional[str] = "Ceftriaxone"
    prior_antibiotic_days: int = Field(ge=0, default=7)
    prior_resistant_organism: Optional[str] = "None known"
    ward_endemic_resistance_rate: float = Field(ge=0.0, le=1.0, default=0.22)


class SHAPImpactFactor(BaseModel):
    feature: str
    value: float
    shap_value: float
    direction: str = "increasing_risk" # increasing_risk | protective


class PredictionDetailSchema(BaseModel):
    probability: float = Field(description="Calibrated probability of resistance (0.0 - 1.0)")
    probability_percent: int = Field(description="Percentage score (0 - 100)")
    raw_probability: float
    risk_level: str = Field(description="Low | Medium | High")
    confidence_level: str = Field(default="High Confidence")
    model_version: str
    target_name: str = "any_amr_isolate"
    abstention_flag: bool = False
    abstention_reason: Optional[str] = None
    assessed_at: str


class ExplanationSummarySchema(BaseModel):
    narrative: str
    base_value: float
    top_risk_factors: List[SHAPImpactFactor]
    protective_factors: List[SHAPImpactFactor]
    safety_warnings: List[str] = []


class ClinicalContextSchema(BaseModel):
    patient_id: str
    encounter_id: str
    infection_source: str
    ward: str
    primary_diagnosis: str
    drug_allergy: str
    kidney_function: str
    ward_endemic_rate: float


class AMRPredictResponse(BaseModel):
    success: bool = True
    prediction: PredictionDetailSchema
    features: Dict[str, Any]
    explanation: ExplanationSummarySchema
    clinical_context: ClinicalContextSchema
    disclaimer: str = "SUPPORTING DOCTORS, NOT REPLACING DOCTORS. Pre-culture decision support only."
