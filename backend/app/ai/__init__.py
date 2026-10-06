"""ResistomeX AI Clinical Decision Support System.

Consolidated package for pre-culture antimicrobial resistance (AMR) risk prediction,
explainability, safety auditing, and clinical research evaluation.
"""

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
    save_model_artifacts,
    load_model_artifacts,
    run_benchmark_comparison,
    evaluate_independent_cohort
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
    run_feature_ablation_experiments
)
from .explainability import ResistomeXSHAPExplainer
from .llm import (
    ClinicalNoteExtractor,
    ClinicalExplanationGenerator,
    ClinicalHallucinationChecker,
    RuleConstrainedRecommendationEngine
)
from .pipeline import (
    train_pipeline,
    evaluation_pipeline,
    run_full_phase1_pipeline,
    run_full_phase2_pipeline
)

__all__ = [
    "load_dataset",
    "load_yaml_config",
    "build_target",
    "run_leakage_check",
    "split_data_by_patient_group",
    "generate_10k_clinical_dataset",
    "ResistomeXPreprocessor",
    "train_xgboost_model",
    "fit_calibrated_model",
    "save_model_artifacts",
    "load_model_artifacts",
    "run_benchmark_comparison",
    "evaluate_independent_cohort",
    "evaluate_model_comprehensive",
    "compute_bootstrap_ci",
    "test_perturbation_stability",
    "test_missing_data_degradation",
    "run_temporal_validation",
    "run_subgroup_analysis",
    "run_false_negative_deep_dive",
    "run_feature_sanity_checks",
    "run_feature_ablation_experiments",
    "ResistomeXSHAPExplainer",
    "ClinicalNoteExtractor",
    "ClinicalExplanationGenerator",
    "ClinicalHallucinationChecker",
    "RuleConstrainedRecommendationEngine",
    "train_pipeline",
    "evaluation_pipeline",
    "run_full_phase1_pipeline",
    "run_full_phase2_pipeline"
]
