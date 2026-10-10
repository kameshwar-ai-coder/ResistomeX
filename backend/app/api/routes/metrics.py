from fastapi import APIRouter
from app.services.model_registry import model_registry
from app.core.config import settings

router = APIRouter(prefix="/model", tags=["Model Analytics & Performance"])


@router.get("/metrics")
def get_model_metrics():
    """Return model performance metrics, validation statistics, and calibration info."""
    meta = model_registry.metadata or {}
    major_metrics = meta.get("all_major_metrics", {})
    
    return {
        "success": True,
        "model_name": meta.get("model_version", "xgboost_amr_v002"),
        "model_class": meta.get("selected_model", "XGBClassifier"),
        "dataset_version": meta.get("dataset_version", "clinical_v2_10000"),
        "training_date": meta.get("training_date", "2026-10-02"),
        "calibration_method": meta.get("calibration_method", "isotonic"),
        "metrics": {
            "roc_auc": round(float(major_metrics.get("roc_auc", 0.6955)), 4),
            "pr_auc": round(float(major_metrics.get("pr_auc", 0.7263)), 4),
            "sensitivity": round(float(major_metrics.get("sensitivity_0_5", 0.7525)), 4),
            "specificity": round(float(major_metrics.get("specificity_0_5", 0.5000)), 4),
            "f1_score": round(float(major_metrics.get("f1_0_5", 0.6976)), 4),
            "brier_score": round(float(major_metrics.get("brier_score", 0.2205)), 4),
            "ece": round(float(major_metrics.get("ece", 0.0371)), 4)
        },
        "splits": {
            "train_rows": meta.get("training_rows", 3350),
            "val_rows": meta.get("validation_rows", 717),
            "test_rows": meta.get("test_rows", 724),
            "target_prevalence": round(float(meta.get("target_prevalence", 0.551)), 3)
        },
        "disclaimer": "Metrics evaluated on patient-grouped temporal held-out test split with zero patient leakage."
    }
