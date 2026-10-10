"""Model training, baseline benchmarks, probability calibration, persistence, and independent evaluation.

Consolidated module for ResistomeX Modeling Layer.
"""

import os
import json
import logging
import datetime
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.metrics import (
    roc_auc_score,
    precision_recall_curve,
    auc,
    brier_score_loss,
    log_loss,
    confusion_matrix,
    f1_score,
    balanced_accuracy_score
)
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)


# =========================================================================
# 1. CALIBRATION HELPERS & METRICS
# =========================================================================

def compute_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Calculate Expected Calibration Error (ECE)."""
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_ids = np.digitize(y_prob, bins) - 1
    bin_ids = np.clip(bin_ids, 0, n_bins - 1)

    ece = 0.0
    n_samples = len(y_true)
    for b in range(n_bins):
        mask = bin_ids == b
        if np.sum(mask) > 0:
            bin_acc = np.mean(y_true[mask])
            bin_conf = np.mean(y_prob[mask])
            ece += (np.sum(mask) / n_samples) * np.abs(bin_acc - bin_conf)
    return float(ece)


def fit_calibrated_model(
    base_model: Any,
    X_val: pd.DataFrame,
    y_val: np.ndarray,
    method: str = "isotonic"
) -> Any:
    """Fit probability calibrator (isotonic regression or Platt sigmoid) on validation split."""
    calibrator = CalibratedClassifierCV(estimator=base_model, method=method, cv="prefit")
    calibrator.fit(X_val, y_val)
    logger.info(f"Fitted {method} probability calibrator on validation cohort.")
    return calibrator


# =========================================================================
# 2. XGBOOST TRAINING & PERSISTENCE
# =========================================================================

def train_xgboost_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: Optional[pd.DataFrame] = None,
    y_val: Optional[pd.Series] = None,
    hyperparameters: Optional[Dict[str, Any]] = None,
    tune: bool = False,
    random_state: int = 42
) -> Tuple[XGBClassifier, Dict[str, Any]]:
    """Train hyperparameter-tuned XGBoost binary classifier with positive class weighting."""
    n_pos = int(np.sum(y_train))
    n_neg = int(len(y_train) - n_pos)
    scale_pos_weight = float(n_neg / n_pos) if n_pos > 0 else 1.0

    default_params = {
        "n_estimators": 200,
        "max_depth": 3,
        "learning_rate": 0.03,
        "subsample": 0.7,
        "colsample_bytree": 0.9,
        "reg_alpha": 1.0,
        "reg_lambda": 0.5,
        "gamma": 0.2,
        "min_child_weight": 2,
        "scale_pos_weight": scale_pos_weight,
        "eval_metric": "logloss",
        "random_state": random_state
    }

    if hyperparameters:
        default_params.update(hyperparameters)

    if tune:
        logger.info("Executing XGBoost hyperparameter search with 5-fold Stratified CV...")
        param_grid = {
            "max_depth": [3, 4, 5],
            "learning_rate": [0.01, 0.03, 0.08],
            "n_estimators": [150, 200, 300],
            "subsample": [0.7, 0.85]
        }
        base_xgb = XGBClassifier(
            scale_pos_weight=scale_pos_weight,
            eval_metric="logloss",
            random_state=random_state
        )
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
        grid_search = GridSearchCV(
            estimator=base_xgb,
            param_grid=param_grid,
            scoring="roc_auc",
            cv=skf,
            n_jobs=-1,
            verbose=0
        )
        grid_search.fit(X_train, y_train)
        best_params = grid_search.best_params_
        default_params.update(best_params)
        logger.info(f"Best CV ROC-AUC: {grid_search.best_score_:.4f} with params: {best_params}")

    model = XGBClassifier(**default_params)
    if X_val is not None and y_val is not None:
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )
    else:
        model.fit(X_train, y_train, verbose=False)

    logger.info("XGBoost training completed successfully.")
    return model, default_params


def save_model_artifacts(
    model: Any,
    preprocessor: Any,
    params: Dict[str, Any],
    target_info: Dict[str, Any],
    split_stats: Dict[str, Any],
    calibrator: Optional[Any] = None,
    major_metrics: Optional[Dict[str, Any]] = None,
    output_dir: str = "models",
    model_version: str = "xgboost_amr_v002"
) -> Tuple[str, str]:
    """Save model binary, preprocessor pipeline, calibrator, and canonical metadata."""
    os.makedirs(output_dir, exist_ok=True)

    # 1. Save main binaries
    best_model_path = os.path.join(output_dir, "best_model.joblib")
    prep_path = os.path.join(output_dir, "preprocessing_pipeline.joblib")
    joblib.dump(model, best_model_path)
    joblib.dump(preprocessor, prep_path)

    if calibrator is not None:
        calib_path = os.path.join(output_dir, "calibration_model.joblib")
        joblib.dump(calibrator, calib_path)

    # Versioned copy
    versioned_model_path = os.path.join(output_dir, f"{model_version}.joblib")
    joblib.dump(model, versioned_model_path)

    # 2. Canonical Metadata
    metadata = {
        "dataset_version": "clinical_v2_10000",
        "model_version": model_version,
        "feature_version": f"v2_engineered_{len(preprocessor.feature_names)}",
        "target_version": target_info.get("target_name", "any_amr_isolate"),
        "random_seed": params.get("random_state", 42),
        "training_date": datetime.datetime.now().isoformat(),
        "training_rows": split_stats.get("train_samples", 0),
        "validation_rows": split_stats.get("val_samples", 0),
        "test_rows": split_stats.get("test_samples", 0),
        "target_prevalence": target_info.get("prevalence", 0.0),
        "selected_model": type(model).__name__,
        "hyperparameters": params,
        "calibration_method": "isotonic" if calibrator is not None else "raw",
        "all_major_metrics": major_metrics or {}
    }

    meta_path = os.path.join(output_dir, "model_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Saved model artifacts and metadata to {output_dir}/")
    return best_model_path, meta_path


def load_model_artifacts(
    models_dir: str = "models"
) -> Tuple[Any, Any, Optional[Any], Dict[str, Any]]:
    """Load best model binary, preprocessor pipeline, calibrator, and canonical metadata."""
    model_path = os.path.join(models_dir, "best_model.joblib")
    prep_path = os.path.join(models_dir, "preprocessing_pipeline.joblib")
    calib_path = os.path.join(models_dir, "calibration_model.joblib")
    meta_path = os.path.join(models_dir, "model_metadata.json")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
    if not os.path.exists(prep_path):
        raise FileNotFoundError(f"Preprocessor file not found at {prep_path}")

    model = joblib.load(model_path)
    preprocessor = joblib.load(prep_path)
    calibrator = joblib.load(calib_path) if os.path.exists(calib_path) else None

    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

    return model, preprocessor, calibrator, meta


# =========================================================================
# 3. BENCHMARK COMPARISON
# =========================================================================

def run_benchmark_comparison(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    trained_xgboost: Any = None,
    random_seed: int = 42
) -> pd.DataFrame:
    """Evaluate 5 standard baseline architectures using 5-fold CV and test evaluation."""
    models_dict = {
        "Dummy (Stratified)": DummyClassifier(strategy="stratified", random_state=random_seed),
        "Logistic Regression": LogisticRegression(max_iter=1000, C=0.5, class_weight="balanced", random_state=random_seed),
        "Random Forest": RandomForestClassifier(n_estimators=200, max_depth=8, min_samples_leaf=5, class_weight="balanced", random_state=random_seed, n_jobs=-1),
        "HistGradientBoosting": HistGradientBoostingClassifier(max_iter=150, max_depth=5, min_samples_leaf=10, random_state=random_seed)
    }

    results = []
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_seed)
    y_true_test = np.array(y_test)

    for name, model in models_dict.items():
        logger.info(f"Evaluating Benchmark Model: {name}...")
        cv_roc_aucs, cv_pr_aucs = [], []

        for tr_idx, va_idx in skf.split(X_train, y_train):
            X_tr, X_va = X_train.iloc[tr_idx], X_train.iloc[va_idx]
            y_tr, y_va = y_train.iloc[tr_idx], y_train.iloc[va_idx]
            model.fit(X_tr, y_tr)
            va_probs = model.predict_proba(X_va)[:, 1]
            cv_roc_aucs.append(roc_auc_score(y_va, va_probs))
            p, r, _ = precision_recall_curve(y_va, va_probs)
            cv_pr_aucs.append(auc(r, p))

        model.fit(X_train, y_train)
        probs = model.predict_proba(X_test)[:, 1]
        preds = (probs >= 0.50).astype(int)

        roc = float(roc_auc_score(y_true_test, probs))
        p, r, _ = precision_recall_curve(y_true_test, probs)
        pr = float(auc(r, p))
        brier = float(brier_score_loss(y_true_test, probs))
        ece = float(compute_ece(y_true_test, probs))
        f1 = float(f1_score(y_true_test, preds, zero_division=0))
        tn, fp, fn, tp = confusion_matrix(y_true_test, preds, labels=[0, 1]).ravel()

        results.append({
            "model_name": name,
            "cv_roc_auc_mean": float(np.mean(cv_roc_aucs)),
            "cv_roc_auc_std": float(np.std(cv_roc_aucs)),
            "cv_pr_auc_mean": float(np.mean(cv_pr_aucs)),
            "cv_pr_auc_std": float(np.std(cv_pr_aucs)),
            "test_roc_auc": roc,
            "test_pr_auc": pr,
            "test_sensitivity": float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0,
            "test_specificity": float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0,
            "test_f1": f1,
            "test_brier_score": brier,
            "test_ece": ece
        })

    # Add Tuned XGBoost
    if trained_xgboost is not None:
        cv_roc_aucs, cv_pr_aucs = [], []
        for tr_idx, va_idx in skf.split(X_train, y_train):
            X_tr, X_va = X_train.iloc[tr_idx], X_train.iloc[va_idx]
            y_tr, y_va = y_train.iloc[tr_idx], y_train.iloc[va_idx]
            xgb_clone = XGBClassifier(**trained_xgboost.get_params())
            xgb_clone.fit(X_tr, y_tr, verbose=False)
            va_probs = xgb_clone.predict_proba(X_va)[:, 1]
            cv_roc_aucs.append(roc_auc_score(y_va, va_probs))
            p, r, _ = precision_recall_curve(y_va, va_probs)
            cv_pr_aucs.append(auc(r, p))

        probs = trained_xgboost.predict_proba(X_test)[:, 1]
        preds = (probs >= 0.50).astype(int)
        roc = float(roc_auc_score(y_true_test, probs))
        p, r, _ = precision_recall_curve(y_true_test, probs)
        pr = float(auc(r, p))
        brier = float(brier_score_loss(y_true_test, probs))
        ece = float(compute_ece(y_true_test, probs))
        f1 = float(f1_score(y_true_test, preds, zero_division=0))
        tn, fp, fn, tp = confusion_matrix(y_true_test, preds, labels=[0, 1]).ravel()

        results.append({
            "model_name": "Tuned XGBoost",
            "cv_roc_auc_mean": float(np.mean(cv_roc_aucs)),
            "cv_roc_auc_std": float(np.std(cv_roc_aucs)),
            "cv_pr_auc_mean": float(np.mean(cv_pr_aucs)),
            "cv_pr_auc_std": float(np.std(cv_pr_aucs)),
            "test_roc_auc": roc,
            "test_pr_auc": pr,
            "test_sensitivity": float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0,
            "test_specificity": float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0,
            "test_f1": f1,
            "test_brier_score": brier,
            "test_ece": ece
        })

    return pd.DataFrame(results)


# =========================================================================
# 4. INDEPENDENT 5K TEST EVALUATION
# =========================================================================

def verify_cohort_independence(df_dev: pd.DataFrame, df_test: pd.DataFrame) -> Dict[str, Any]:
    """Verify that test cohort has zero patient overlap and no duplicate encounters."""
    dev_pts = set(df_dev["patient_id"])
    test_pts = set(df_test["patient_id"])
    pt_overlap = len(dev_pts.intersection(test_pts))

    dev_encs = set(df_dev["encounter_id"])
    test_encs = set(df_test["encounter_id"])
    enc_overlap = len(dev_encs.intersection(test_encs))

    return {
        "dev_encounters": len(df_dev),
        "test_encounters": len(df_test),
        "dev_unique_patients": len(dev_pts),
        "test_unique_patients": len(test_pts),
        "patient_overlap_count": pt_overlap,
        "encounter_overlap_count": enc_overlap,
        "is_independent": (pt_overlap == 0 and enc_overlap == 0)
    }


def evaluate_independent_cohort(
    model: Any,
    preprocessor: Any,
    df_independent: pd.DataFrame,
    y_independent: pd.Series,
    calibrator: Optional[Any] = None,
    existing_metrics: Optional[Dict[str, Any]] = None
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Evaluate frozen model on independent cohort and compute performance deltas."""
    X_indep = preprocessor.transform(df_independent)
    y_true = np.array(y_independent)

    raw_probs = model.predict_proba(X_indep)[:, 1]
    if calibrator is not None:
        try:
            probs = calibrator.predict(raw_probs)
        except Exception:
            probs = raw_probs
    else:
        probs = raw_probs

    preds = (probs >= 0.50).astype(int)

    roc = float(roc_auc_score(y_true, probs))
    p_arr, r_arr, _ = precision_recall_curve(y_true, probs)
    pr = float(auc(r_arr, p_arr))
    brier = float(brier_score_loss(y_true, probs))
    ece = float(compute_ece(y_true, probs))
    f1 = float(f1_score(y_true, preds, zero_division=0))
    bal_acc = float(balanced_accuracy_score(y_true, preds))
    tn, fp, fn, tp = confusion_matrix(y_true, preds, labels=[0, 1]).ravel()
    sens = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    ppv = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    npv = float(tn / (tn + fn)) if (tn + fn) > 0 else 0.0

    ex = existing_metrics or {}
    ex_roc = ex.get("roc_auc", 0.7012)
    ex_pr = ex.get("pr_auc", 0.7504)
    ex_sens = ex.get("sensitivity_0_5", 0.6575)
    ex_spec = ex.get("specificity_0_5", 0.6481)
    ex_f1 = ex.get("f1_0_5", 0.6770)
    ex_brier = ex.get("brier_score", 0.2204)
    ex_ece = ex.get("ece", 0.0475)

    comp_rows = [
        {"metric": "ROC-AUC", "existing_test": ex_roc, "independent_5k": roc, "difference": roc - ex_roc},
        {"metric": "PR-AUC", "existing_test": ex_pr, "independent_5k": pr, "difference": pr - ex_pr},
        {"metric": "Sensitivity (@ 0.50)", "existing_test": ex_sens, "independent_5k": sens, "difference": sens - ex_sens},
        {"metric": "Specificity (@ 0.50)", "existing_test": ex_spec, "independent_5k": spec, "difference": spec - ex_spec},
        {"metric": "PPV (@ 0.50)", "existing_test": 0.6976, "independent_5k": ppv, "difference": ppv - 0.6976},
        {"metric": "NPV (@ 0.50)", "existing_test": 0.6052, "independent_5k": npv, "difference": npv - 0.6052},
        {"metric": "F1 Score (@ 0.50)", "existing_test": ex_f1, "independent_5k": f1, "difference": f1 - ex_f1},
        {"metric": "Balanced Accuracy", "existing_test": 0.6528, "independent_5k": bal_acc, "difference": bal_acc - 0.6528},
        {"metric": "Brier Score", "existing_test": ex_brier, "independent_5k": brier, "difference": brier - ex_brier},
        {"metric": "Expected Calibration Error", "existing_test": ex_ece, "independent_5k": ece, "difference": ece - ex_ece}
    ]

    df_comp = pd.DataFrame(comp_rows)
    summary = {
        "roc_auc": roc,
        "pr_auc": pr,
        "sensitivity": sens,
        "specificity": spec,
        "f1": f1,
        "brier": brier,
        "ece": ece,
        "delta_roc": roc - ex_roc
    }

    return df_comp, summary
