"""High-level analytical experiment orchestration for ResistomeX.

Coordinates benchmarks, independent generalization, feature ablation, subgroup fairness,
false-negative errors, temporal validation, and missingness robustness.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional

from .data import (
    load_dataset,
    load_yaml_config,
    build_target,
    run_leakage_check,
    split_data_by_patient_group,
    generate_10k_clinical_dataset,
    ResistomeXPreprocessor
)
from .modeling import (
    train_xgboost_model,
    fit_calibrated_model,
    run_benchmark_comparison,
    evaluate_independent_cohort,
    verify_cohort_independence,
    save_model_artifacts
)
from .evaluation import (
    evaluate_model_comprehensive,
    compute_bootstrap_ci,
    test_perturbation_stability,
    test_missing_data_degradation,
    run_temporal_validation,
    run_subgroup_analysis,
    run_false_negative_deep_dive,
    run_feature_sanity_checks,
    run_feature_ablation_experiments,
    evaluate_cohort_counterfactual_scenarios
)
from .explainability import ResistomeXSHAPExplainer, plot_shap_summary
from .llm import evaluate_llm_extraction_layer, evaluate_llm_explanation_fidelity, test_prompt_injection_robustness
from .reporting import (
    generate_roc_and_pr_plots,
    generate_confusion_matrix_plot,
    compare_and_plot_calibration,
    plot_threshold_tradeoff,
    plot_benchmark_comparison,
    plot_independent_comparison,
    plot_ablation_results,
    plot_subgroup_analysis,
    plot_temporal_performance,
    plot_missingness_curve,
    build_final_html_report,
    generate_phase2_master_report,
    write_all_markdown_reports
)

logger = logging.getLogger(__name__)


def run_phase1_analysis(config_path: str = "config/config.yaml") -> Dict[str, Any]:
    """Execute complete Phase 1 pipeline (Training, Baseline Benchmark, SHAP, Calibration, Evaluation)."""
    cfg = load_yaml_config(config_path)
    data_path = cfg["data"]["clinical_path"]
    feat_map_path = cfg["data"]["feature_mapping_path"]
    random_seed = cfg.get("random_seed", 42)

    # 1. Load data & target
    df_raw, feat_mapping, dataset_type = load_dataset(data_path, feat_map_path)
    target_cfg = cfg.get("target", {})
    target_name = target_cfg.get("selected_target", "any_amr_isolate")
    cohort_df, y, target_info = build_target(
        df=df_raw,
        target_name=target_name,
        min_samples=target_cfg.get("min_samples", 50),
        min_positive_samples=target_cfg.get("min_positive_samples", 10)
    )

    # 2. Leakage check & split
    clean_features, leakage_rep = run_leakage_check(cohort_df, feat_mapping)
    split_cfg = cfg.get("splitting", {})
    df_train, df_val, df_test, y_train, y_val, y_test, split_stats = split_data_by_patient_group(
        df=cohort_df,
        y=y,
        patient_id_col=cfg["data"]["patient_id_col"],
        test_size=split_cfg.get("test_size", 0.15),
        val_size=split_cfg.get("val_size", 0.15),
        random_state=random_seed
    )

    # 3. Preprocess
    num_feats = [f for f in feat_mapping.get("numeric_features", []) if f in clean_features]
    cat_feats = [f for f in feat_mapping.get("categorical_features", []) if f in clean_features]
    mv_feats = [f for f in feat_mapping.get("multivalue_categorical_features", []) if f in clean_features]

    preprocessor = ResistomeXPreprocessor(num_feats, cat_feats, mv_feats)
    X_train = preprocessor.fit_transform(df_train, y_train)
    X_val = preprocessor.transform(df_val)
    X_test = preprocessor.transform(df_test)

    # 4. Train Model & Calibrate
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

    # 5. Evaluate
    metrics = evaluate_model_comprehensive(y_test.values, y_test_probs)
    boot_ci = compute_bootstrap_ci(y_test.values, y_test_probs)

    # Save artifacts
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

    # 6. Baselines & Plots
    df_baselines = run_benchmark_comparison(X_train, y_train, X_test, y_test, trained_xgboost=model, random_seed=random_seed)
    df_subgroups = run_subgroup_analysis(df_test, y_test, y_test_probs)

    generate_roc_and_pr_plots(y_test.values, y_test_probs, metrics["roc_auc"], metrics["pr_auc"])
    generate_confusion_matrix_plot(y_test.values, y_test_probs, threshold=0.5)
    compare_and_plot_calibration(y_test.values, model.predict_proba(X_test)[:, 1], y_test_probs)
    plot_threshold_tradeoff(pd.DataFrame(metrics["threshold_metrics"]))

    # 7. Explainability
    explainer = ResistomeXSHAPExplainer(model, preprocessor.feature_names)
    plot_shap_summary(explainer, X_test)

    # 8. Reports
    llm_eval = evaluate_llm_extraction_layer(df_test, n_samples=30)
    write_all_markdown_reports(cohort_df, y, target_info, clean_features, split_stats, metrics, boot_ci, df_baselines, df_subgroups, llm_eval)
    build_final_html_report(
        meta_dict={"all_major_metrics": metrics},
        metrics_dict=metrics,
        baselines_df=df_baselines,
        thresholds_df=pd.DataFrame(metrics["threshold_metrics"]),
        subgroups_df=df_subgroups
    )

    return {
        "model": model,
        "preprocessor": preprocessor,
        "calibrator": calibrator,
        "metrics": metrics,
        "boot_ci": boot_ci
    }


def run_phase2_analysis(config_path: str = "config/config.yaml") -> Dict[str, Any]:
    """Execute complete Phase 2 validation (Benchmarks, Independent 5k, Ablations, Subgroups, Errors, Temporal, Missingness)."""
    cfg = load_yaml_config(config_path)
    data_path = cfg["data"]["clinical_path"]
    feat_map_path = cfg["data"]["feature_mapping_path"]
    random_seed = cfg.get("random_seed", 42)

    df_raw, feat_mapping, _ = load_dataset(data_path, feat_map_path)
    target_cfg = cfg.get("target", {})
    target_name = target_cfg.get("selected_target", "any_amr_isolate")
    cohort_df, y, target_info = build_target(
        df=df_raw,
        target_name=target_name,
        min_samples=target_cfg.get("min_samples", 50),
        min_positive_samples=target_cfg.get("min_positive_samples", 10)
    )

    clean_features, leakage_rep = run_leakage_check(cohort_df, feat_mapping)
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

    from .modeling import load_model_artifacts
    model, preprocessor, calibrator, meta_dict = load_model_artifacts("models")

    X_train = preprocessor.transform(df_train)
    X_test = preprocessor.transform(df_test)
    y_test_probs = calibrator.predict_proba(X_test)[:, 1] if calibrator else model.predict_proba(X_test)[:, 1]

    # Task 1: Benchmarks
    benchmark_df = run_benchmark_comparison(X_train, y_train, X_test, y_test, trained_xgboost=model, random_seed=random_seed)
    plot_benchmark_comparison(benchmark_df)
    benchmark_df.to_csv("reports/benchmark_comparison.csv", index=False)

    # Task 2: Independent 5k
    indep_5k_path = "data/clinical/resistomex_independent_test_5000.csv"
    if not os.path.exists(indep_5k_path):
        df_5k = generate_10k_clinical_dataset(n_records=5000, random_seed=999, output_csv_path=indep_5k_path)
    else:
        df_5k = pd.read_csv(indep_5k_path)

    indep_cohort, y_5k, _ = build_target(df_5k, "any_amr_isolate")
    indep_comp_df, indep_summary = evaluate_independent_cohort(
        model=model,
        preprocessor=preprocessor,
        df_independent=indep_cohort,
        y_independent=y_5k,
        calibrator=calibrator,
        existing_metrics=meta_dict.get("all_major_metrics")
    )
    plot_independent_comparison(indep_comp_df)
    indep_comp_df.to_csv("reports/independent_5000_results.csv", index=False)

    # Task 3: Feature Sanity & Ablation
    feat_sanity_df, feat_imp_df = run_feature_sanity_checks(cohort_df, y, model, preprocessor, X_test, y_test)
    feat_sanity_df.to_csv("reports/feature_sanity_report.csv", index=False)

    xgb_params = meta_dict.get("hyperparameters", {"n_estimators": 200, "max_depth": 3, "learning_rate": 0.03, "subsample": 0.7, "random_state": 42})
    feat_ablation_df = run_feature_ablation_experiments(df_train, y_train, df_test, y_test, num_feats, cat_feats, mv_feats, xgb_params)
    plot_ablation_results(feat_ablation_df)
    feat_ablation_df.to_csv("reports/feature_ablation_results.csv", index=False)

    # Task 4: Subgroups
    subgroup_df = run_subgroup_analysis(df_test, y_test, y_test_probs)
    plot_subgroup_analysis(subgroup_df)
    subgroup_df.to_csv("reports/subgroup_analysis.csv", index=False)

    # Task 5: False Negatives
    fn_stats_df, fn_cases_df, fn_tax_df = run_false_negative_deep_dive(df_test, y_test, y_test_probs, threshold=0.50)
    fn_stats_df.to_csv("reports/false_negative_analysis.csv", index=False)
    fn_cases_df.to_csv("reports/false_negative_cases.csv", index=False)

    # Task 6: Temporal
    temporal_df, has_temporal = run_temporal_validation(df_raw, num_feats, cat_feats, mv_feats, xgb_params)
    if has_temporal:
        plot_temporal_performance(temporal_df)
        temporal_df.to_csv("reports/temporal_validation.csv", index=False)

    # Task 7: Missingness
    missingness_df = test_missing_data_degradation(model, preprocessor, df_test, y_test)
    plot_missingness_curve(missingness_df)
    missingness_df.to_csv("reports/missingness_curve.csv", index=False)

    # Master Report
    generate_phase2_master_report(
        benchmark_df=benchmark_df,
        independent_comp_df=indep_comp_df,
        feature_sanity_df=feat_sanity_df,
        feature_ablation_df=feat_ablation_df,
        subgroup_df=subgroup_df,
        fn_stats_df=fn_stats_df,
        fn_tax_df=fn_tax_df,
        temporal_df=temporal_df,
        missingness_df=missingness_df,
        meta_dict=meta_dict,
        output_path="reports/phase2_final_report.html"
    )

    return {
        "benchmark_df": benchmark_df,
        "independent_comp_df": indep_comp_df,
        "feature_ablation_df": feat_ablation_df,
        "subgroup_df": subgroup_df,
        "temporal_df": temporal_df,
        "missingness_df": missingness_df,
        "indep_summary": indep_summary
    }
