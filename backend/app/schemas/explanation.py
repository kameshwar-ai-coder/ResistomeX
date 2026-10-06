from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SHAPExplainRequest(BaseModel):
    patient_id: str
    encounter_id: str
    features: Dict[str, Any]
    top_k: int = Field(default=5, ge=1, le=20)


class LocalFeatureAttribution(BaseModel):
    feature: str
    display_name: str
    value: Any
    shap_value: float
    impact_direction: str  # "Risk Driver" | "Protective Factor"
    magnitude_rank: int


class SHAPExplainResponse(BaseModel):
    success: bool = True
    patient_id: str
    encounter_id: str
    base_value: float
    predicted_probability: float
    risk_level: str
    top_risk_drivers: List[LocalFeatureAttribution]
    protective_factors: List[LocalFeatureAttribution]
    all_feature_attributions: List[Dict[str, Any]]
    narrative_explanation: str
    disclaimer: str = "TreeSHAP additive attribution based on validated XGBoost AMR model."
