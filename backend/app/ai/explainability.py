"""SHAP explainability, additivity verification, and patient-level risk attribution.

Consolidated module for ResistomeX Explainability Layer.
"""

import os
import logging
import numpy as np
import pandas as pd
import shap
import matplotlib.pyplot as plt
from typing import Dict, List, Any, Optional, Tuple
from .validation import SHAPExplanationSchema

logger = logging.getLogger(__name__)


class ResistomeXSHAPExplainer:
    """TreeSHAP explainer with strict additivity checks and patient-level attribution formatting."""

    def __init__(self, model: Any, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        self.explainer = shap.TreeExplainer(model)

    def explain_dataset(self, X: pd.DataFrame) -> Tuple[np.ndarray, float]:
        """Compute global SHAP values and base expected value for dataset."""
        shap_values = self.explainer.shap_values(X)
        expected_value = float(self.explainer.expected_value)
        return shap_values, expected_value

    def get_local_explanation(
        self,
        patient_row_features: pd.Series,
        patient_id: str,
        encounter_id: str,
        pred_prob: float,
        top_k: int = 5
    ) -> SHAPExplanationSchema:
        """Extract sorted top positive risk drivers and protective factors for a single patient."""
        row_arr = patient_row_features.values.reshape(1, -1)
        shap_val = self.explainer.shap_values(row_arr)[0]
        base_val = float(self.explainer.expected_value)

        feat_impacts = []
        for name, val, s_val in zip(self.feature_names, patient_row_features.values, shap_val):
            feat_impacts.append({
                "feature": name,
                "value": float(val),
                "shap_value": float(s_val)
            })

        sorted_impacts = sorted(feat_impacts, key=lambda x: abs(x["shap_value"]), reverse=True)
        top_drivers = [f for f in sorted_impacts if f["shap_value"] > 0][:top_k]
        protective = [f for f in sorted_impacts if f["shap_value"] < 0][:top_k]

        return SHAPExplanationSchema(
            patient_id=patient_id,
            encounter_id=encounter_id,
            predicted_amr_probability=pred_prob,
            base_value=base_val,
            top_risk_factors=top_drivers,
            protective_factors=protective,
            all_feature_impacts=sorted_impacts
        )

    def test_shap_faithfulness(
        self,
        X_test: pd.DataFrame,
        n_samples: int = 20
    ) -> Dict[str, Any]:
        """Verify SHAP additivity: sum(SHAP) + base_val == margin prediction."""
        sub_X = X_test.iloc[:n_samples]
        shap_vals, base_val = self.explain_dataset(sub_X)
        margin_preds = self.model.predict(sub_X, output_margin=True)

        reconstructed = shap_vals.sum(axis=1) + base_val
        max_diff = float(np.max(np.abs(reconstructed - margin_preds)))
        passed = bool(max_diff < 1e-4)

        return {
            "tested_samples": n_samples,
            "max_additivity_error": max_diff,
            "additivity_check_passed": passed
        }


def plot_shap_summary(
    explainer: ResistomeXSHAPExplainer,
    X_test: pd.DataFrame,
    save_path_bar: str = "plots/shap_global.png",
    save_path_beeswarm: str = "plots/shap_beeswarm.png"
):
    """Generate global SHAP bar and beeswarm plots."""
    os.makedirs(os.path.dirname(save_path_bar), exist_ok=True)
    shap_values, _ = explainer.explain_dataset(X_test)

    # Global Mean |SHAP| Bar Plot
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_test, plot_type="bar", show=False, max_display=15)
    plt.title("ResistomeX Global Feature Impact (|SHAP|)", fontsize=12, fontweight="bold")
    plt.tight_layout()
    plt.savefig(save_path_bar, dpi=300)
    plt.close()

    # Beeswarm Plot
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_test, show=False, max_display=15)
    plt.title("ResistomeX Feature Directionality (SHAP Beeswarm)", fontsize=12, fontweight="bold")
    plt.tight_layout()
    plt.savefig(save_path_beeswarm, dpi=300)
    plt.close()
