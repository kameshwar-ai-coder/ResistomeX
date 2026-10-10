import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.model_registry import model_registry
from app.schemas.explanation import SHAPExplainRequest, SHAPExplainResponse, LocalFeatureAttribution

logger = logging.getLogger(__name__)


class ExplanationService:
    """SHAP Waterfall & Local Feature Attribution Service."""

    @staticmethod
    def explain_patient(req: SHAPExplainRequest) -> SHAPExplainResponse:
        if not model_registry.is_loaded or model_registry.explainer is None:
            raise RuntimeError("SHAP explainer is not initialized.")

        df_row = pd.DataFrame([req.features])
        X_proc = model_registry.preprocessor.transform(df_row)
        
        prob = float(model_registry.model.predict_proba(X_proc)[0, 1])
        if model_registry.calibrator is not None:
            try:
                prob = float(model_registry.calibrator.predict_proba(X_proc)[0, 1])
            except Exception:
                pass

        risk_level = "High" if prob >= 0.70 else "Medium" if prob >= 0.40 else "Low"

        local_exp = model_registry.explainer.get_local_explanation(
            patient_row_features=X_proc.iloc[0],
            patient_id=req.patient_id,
            encounter_id=req.encounter_id,
            pred_prob=prob,
            top_k=req.top_k
        )

        top_drivers = []
        for rank, item in enumerate(local_exp.top_risk_factors, 1):
            feat = item.get("feature", "")
            top_drivers.append(LocalFeatureAttribution(
                feature=feat,
                display_name=feat.replace("_", " ").title(),
                value=item.get("value", 0.0),
                shap_value=round(float(item.get("shap_value", 0.0)), 4),
                impact_direction="Risk Driver",
                magnitude_rank=rank
            ))

        protective = []
        for rank, item in enumerate(local_exp.protective_factors, 1):
            feat = item.get("feature", "")
            protective.append(LocalFeatureAttribution(
                feature=feat,
                display_name=feat.replace("_", " ").title(),
                value=item.get("value", 0.0),
                shap_value=round(float(item.get("shap_value", 0.0)), 4),
                impact_direction="Protective Factor",
                magnitude_rank=rank
            ))

        narrative = (
            f"TreeSHAP feature attribution indicates patient's AMR probability is {round(prob * 100, 1)}% "
            f"({risk_level} Risk). "
            f"Top risk contributor is {top_drivers[0].display_name if top_drivers else 'Baseline'} "
            f"with a SHAP attribution score of +{top_drivers[0].shap_value if top_drivers else 0.0}."
        )

        return SHAPExplainResponse(
            success=True,
            patient_id=req.patient_id,
            encounter_id=req.encounter_id,
            base_value=round(local_exp.base_value, 4),
            predicted_probability=round(prob, 4),
            risk_level=risk_level,
            top_risk_drivers=top_drivers,
            protective_factors=protective,
            all_feature_attributions=local_exp.all_feature_impacts,
            narrative_explanation=narrative
        )
