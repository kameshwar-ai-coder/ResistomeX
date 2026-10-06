"""Central pipeline execution interface for ResistomeX AI.

Provides unified entry points for training, evaluation, Phase 1 research, and Phase 2 validation.
"""

import os
import json
import logging
from typing import Dict, Any, Optional

from .data import load_dataset, load_yaml_config, build_target, split_data_by_patient_group, ResistomeXPreprocessor
from .modeling import train_xgboost_model, fit_calibrated_model, save_model_artifacts, load_model_artifacts
from .evaluation import evaluate_model_comprehensive, compute_bootstrap_ci
from .reporting import generate_roc_and_pr_plots, generate_confusion_matrix_plot, compare_and_plot_calibration
from .analysis import run_phase1_analysis, run_phase2_analysis

logger = logging.getLogger(__name__)


def train_pipeline(config_path: str = "config/config.yaml") -> Dict[str, Any]:
    """Execute end-to-end model training, preprocessor fitting, and artifact saving."""
    cfg = load_yaml_config(config_path)
    data_path = cfg["data"]["clinical_path"]
    feat_map_path = cfg["data"]["feature_mapping_path"]
    random_seed = cfg.get("random_seed", 42)

    df_raw, feat_mapping, _ = load_dataset(data_path, feat_map_path)
    target_name = cfg.get("target", {}).get("selected_target", "any_amr_isolate")
    cohort_df, y, target_info = build_target(df_raw, target_name)

    from .data import run_leakage_check
    clean_features, _ = run_leakage_check(cohort_df, feat_mapping)

    df_train, df_val, df_test, y_train, y_val, y_test, split_stats = split_data_by_patient_group(
        df=cohort_df,
        y=y,
        patient_id_col=cfg["data"]["patient_id_col"],
        test_size=cfg.get("splitting", {}).get("test_size", 0.15),
        val_size=cfg.get("splitting", {}).get("val_size", 0.15),
        random_state=random_seed
    )

    num_feats = [f for f in feat_mapping.get("numeric_features", []) if f in clean_features]
    cat_feats = [f for f in feat_mapping.get("categorical_features", []) if f in clean_features]
    mv_feats = [f for f in feat_mapping.get("multivalue_categorical_features", []) if f in clean_features]

    preprocessor = ResistomeXPreprocessor(num_feats, cat_feats, mv_feats)
    X_train = preprocessor.fit_transform(df_train, y_train)
    X_val = preprocessor.transform(df_val)
    X_test = preprocessor.transform(df_test)

    xgb_cfg = cfg.get("xgboost", {})
    model, params = train_xgboost_model(
        X_train=X_train,
        y_train=y_train,
        X_val=X_val,
        y_val=y_val,
        hyperparameters=xgb_cfg.get("hyperparameters"),
        tune=xgb_cfg.get("tuning", {}).get("enabled", False),
        random_state=random_seed
    )

    calibrator = fit_calibrated_model(model, X_val, y_val.values, method="isotonic")
    y_test_probs = calibrator.predict_proba(X_test)[:, 1]
    metrics = evaluate_model_comprehensive(y_test.values, y_test_probs)

    save_model_artifacts(
        model=model,
        preprocessor=preprocessor,
        params=params,
        target_info=target_info,
        split_stats=split_stats,
        calibrator=calibrator,
        major_metrics={
            "roc_auc": metrics["roc_auc"],
            "pr_auc": metrics["pr_auc"],
            "brier_score": metrics["brier_score"],
            "sensitivity_0_5": metrics["default_metrics_0_5"]["sensitivity"],
            "specificity_0_5": metrics["default_metrics_0_5"]["specificity"],
            "f1_0_5": metrics["default_metrics_0_5"]["f1"],
            "ece": metrics["expected_calibration_error"]
        }
    )

    logger.info("Training pipeline completed successfully.")
    return {"model": model, "preprocessor": preprocessor, "calibrator": calibrator, "metrics": metrics}


def evaluation_pipeline(
    config_path: str = "config/config.yaml",
    models_dir: str = "models"
) -> Dict[str, Any]:
    """Execute evaluation of saved model artifacts on patient-grouped test split."""
    cfg = load_yaml_config(config_path)
    data_path = cfg["data"]["clinical_path"]
    df_raw, feat_mapping, _ = load_dataset(data_path, cfg["data"]["feature_mapping_path"])
    cohort_df, y, _ = build_target(df_raw, cfg.get("target", {}).get("selected_target", "any_amr_isolate"))

    df_train, df_val, df_test, y_train, y_val, y_test, _ = split_data_by_patient_group(
        df=cohort_df,
        y=y,
        patient_id_col=cfg["data"]["patient_id_col"],
        test_size=cfg.get("splitting", {}).get("test_size", 0.15),
        val_size=cfg.get("splitting", {}).get("val_size", 0.15),
        random_state=cfg.get("random_seed", 42)
    )

    model, preprocessor, calibrator, meta = load_model_artifacts(models_dir)
    X_test = preprocessor.transform(df_test)
    y_test_probs = calibrator.predict_proba(X_test)[:, 1] if calibrator else model.predict_proba(X_test)[:, 1]

    metrics = evaluate_model_comprehensive(y_test.values, y_test_probs)
    boot_ci = compute_bootstrap_ci(y_test.values, y_test_probs)

    generate_roc_and_pr_plots(y_test.values, y_test_probs, metrics["roc_auc"], metrics["pr_auc"])
    generate_confusion_matrix_plot(y_test.values, y_test_probs, threshold=0.5)

    logger.info("Evaluation pipeline completed successfully.")
    return {"metrics": metrics, "boot_ci": boot_ci}


def run_full_phase1_pipeline(config_path: str = "config/config.yaml") -> Dict[str, Any]:
    """Execute complete Phase 1 pipeline."""
    return run_phase1_analysis(config_path)


def run_full_phase2_pipeline(config_path: str = "config/config.yaml") -> Dict[str, Any]:
    """Execute complete Phase 2 validation pipeline."""
    return run_phase2_analysis(config_path)
