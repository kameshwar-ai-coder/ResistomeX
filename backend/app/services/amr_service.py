import datetime
import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

from app.core.config import settings
from app.core.logging import logger
from app.services.model_registry import model_registry
from app.ai.llm import ClinicalExplanationGenerator, ClinicalHallucinationChecker
from app.ai.evaluation import check_out_of_distribution_and_abstention
from app.schemas.amr import (
    PatientInputSchema,
    AMRPredictResponse,
    PredictionDetailSchema,
    ExplanationSummarySchema,
    ClinicalContextSchema,
    SHAPImpactFactor
)

explanation_generator = ClinicalExplanationGenerator()
hallucination_checker = ClinicalHallucinationChecker()


class AMRService:
    """Production AMR inference and clinical decision support orchestration service."""

    @staticmethod
    def predict_amr_risk(patient_input: PatientInputSchema) -> AMRPredictResponse:
        """
        Execute full inference pipeline:
        Patient features -> Preprocessing -> Model -> Calibration -> SHAP -> LLM narrative.
        """
        if not model_registry.is_loaded or model_registry.model is None or model_registry.preprocessor is None:
            raise RuntimeError("AMR model artifacts are not loaded into memory.")

        # Convert input schema to single-row DataFrame
        patient_dict = patient_input.model_dump()
        df_row = pd.DataFrame([patient_dict])

        # 1. Check Out-of-Distribution / extreme physiological bounds
        patient_series = df_row.iloc[0]
        is_abstained, abstain_reason = check_out_of_distribution_and_abstention(patient_series)

        # 2. Preprocessing & feature transformation
        X_proc = model_registry.preprocessor.transform(df_row)

        # 3. Model Inference (Raw & Calibrated)
        raw_prob = float(model_registry.model.predict_proba(X_proc)[0, 1])
        
        calibrated_prob = raw_prob
        if model_registry.calibrator is not None:
            try:
                # If calibrator is a fitted CalibratedClassifierCV
                calibrated_prob = float(model_registry.calibrator.predict_proba(X_proc)[0, 1])
            except Exception:
                try:
                    calibrated_prob = float(model_registry.calibrator.predict(np.array([raw_prob]))[0])
                except Exception:
                    calibrated_prob = raw_prob

        prob = round(calibrated_prob, 4)
        pct = int(round(prob * 100))

        # 4. Risk Stratification Tier
        if prob >= 0.70:
            risk_level = "High"
            conf_level = "High Confidence"
        elif prob >= 0.40:
            risk_level = "Medium"
            conf_level = "Moderate Confidence"
        else:
            risk_level = "Low"
            conf_level = "Standard Confidence"

        # 5. Local SHAP Attribution
        top_risk_factors = []
        protective_factors = []
        base_val = 0.50

        if model_registry.explainer is not None:
            try:
                shap_res = model_registry.explainer.get_local_explanation(
                    patient_row_features=X_proc.iloc[0],
                    patient_id=patient_input.patient_id,
                    encounter_id=patient_input.encounter_id,
                    pred_prob=prob,
                    top_k=5
                )
                base_val = round(shap_res.base_value, 4)
                
                for r in shap_res.top_risk_factors:
                    top_risk_factors.append(SHAPImpactFactor(
                        feature=r.get("feature", "feature"),
                        value=round(float(r.get("value", 0.0)), 2),
                        shap_value=round(float(r.get("shap_value", 0.0)), 4),
                        direction="increasing_risk"
                    ))
                for p in shap_res.protective_factors:
                    protective_factors.append(SHAPImpactFactor(
                        feature=p.get("feature", "feature"),
                        value=round(float(p.get("value", 0.0)), 2),
                        shap_value=round(float(p.get("shap_value", 0.0)), 4),
                        direction="protective"
                    ))
            except Exception as e:
                logger.warning(f"SHAP explanation calculation failed: {e}")

        # 6. Safety Alerts & LLM Narrative Generation
        safety_warnings = []
        if "penicillin" in patient_input.drug_allergy.lower() or "cephalosporin" in patient_input.drug_allergy.lower():
            safety_warnings.append(f"Documented allergy: {patient_input.drug_allergy}")
        if "severe" in patient_input.kidney_function.lower() or "aki" in patient_input.kidney_function.lower():
            safety_warnings.append(f"Renal impairment detected ({patient_input.kidney_function}): Dose reduction required")

        shap_dicts = [{"feature": f.feature, "shap_value": f.shap_value} for f in top_risk_factors]
        narrative = explanation_generator.generate_explanation(
            patient_id=patient_input.patient_id,
            pred_amr_prob=prob,
            top_risk_factors=shap_dicts,
            infection_source=patient_input.infection_source,
            safety_warnings=safety_warnings
        )

        # 7. Build Standard Output
        model_ver = model_registry.metadata.get("model_version", settings.MODEL_VERSION)
        assessed_now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        prediction_detail = PredictionDetailSchema(
            probability=prob,
            probability_percent=pct,
            raw_probability=round(raw_prob, 4),
            risk_level=risk_level,
            confidence_level=conf_level,
            model_version=model_ver,
            target_name=model_registry.metadata.get("target_version", "any_amr_isolate"),
            abstention_flag=is_abstained,
            abstention_reason=abstain_reason if is_abstained else None,
            assessed_at=assessed_now
        )

        explanation_summary = ExplanationSummarySchema(
            narrative=narrative,
            base_value=base_val,
            top_risk_factors=top_risk_factors,
            protective_factors=protective_factors,
            safety_warnings=safety_warnings
        )

        clinical_ctx = ClinicalContextSchema(
            patient_id=patient_input.patient_id,
            encounter_id=patient_input.encounter_id,
            infection_source=patient_input.infection_source,
            ward=patient_input.ward,
            primary_diagnosis=patient_input.primary_diagnosis,
            drug_allergy=patient_input.drug_allergy,
            kidney_function=patient_input.kidney_function,
            ward_endemic_rate=patient_input.ward_endemic_resistance_rate
        )

        return AMRPredictResponse(
            success=True,
            prediction=prediction_detail,
            features=patient_dict,
            explanation=explanation_summary,
            clinical_context=clinical_ctx
        )
