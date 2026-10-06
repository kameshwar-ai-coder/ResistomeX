import os
import sys
import json
import logging
import joblib
from typing import Optional, Dict, Any, Tuple

# Ensure backward compatibility for pre-trained joblib objects referencing 'src' and 'src.data'
import app.ai as ai_pkg
import app.ai.data as ai_data
import app.ai.modeling as ai_modeling
import app.ai.validation as ai_validation
import app.ai.explainability as ai_explainability

sys.modules.setdefault('src', ai_pkg)
sys.modules.setdefault('src.data', ai_data)
sys.modules.setdefault('src.modeling', ai_modeling)
sys.modules.setdefault('src.validation', ai_validation)
sys.modules.setdefault('src.explainability', ai_explainability)

from app.core.config import settings
from app.core.logging import logger
from app.ai.explainability import ResistomeXSHAPExplainer


class ModelRegistry:
    """Singleton registry for loading, caching, and serving model artifacts."""
    
    _instance: Optional["ModelRegistry"] = None
    
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.calibrator = None
        self.metadata = {}
        self.explainer = None
        self.is_loaded = False
        self._load_artifacts()

    @classmethod
    def get_instance(cls) -> "ModelRegistry":
        if cls._instance is None:
            cls._instance = ModelRegistry()
        return cls._instance

    def _load_artifacts(self):
        """Load XGBoost model, preprocessing pipeline, calibrator, and metadata once."""
        models_dir = settings.MODELS_DIR
        logger.info(f"[ModelRegistry] Loading model artifacts from: {models_dir}")
        
        best_model_path = os.path.join(models_dir, "best_model.joblib")
        if not os.path.exists(best_model_path):
            best_model_path = os.path.join(models_dir, "xgboost_amr_v002.joblib")
        if not os.path.exists(best_model_path):
            best_model_path = os.path.join(models_dir, "xgboost_amr_v001.joblib")

        prep_path = os.path.join(models_dir, "preprocessing_pipeline.joblib")
        if not os.path.exists(prep_path):
            prep_path = os.path.join(models_dir, "xgboost_amr_v001_preprocessor.joblib")

        calib_path = os.path.join(models_dir, "calibration_model.joblib")
        meta_path = os.path.join(models_dir, "model_metadata.json")
        if not os.path.exists(meta_path):
            meta_path = os.path.join(models_dir, "metadata_xgboost_amr_v001.json")

        try:
            if os.path.exists(best_model_path):
                self.model = joblib.load(best_model_path)
                logger.info(f"[ModelRegistry] Loaded model from {best_model_path}")
            else:
                logger.error(f"[ModelRegistry] Model binary not found at {best_model_path}")

            if os.path.exists(prep_path):
                self.preprocessor = joblib.load(prep_path)
                logger.info(f"[ModelRegistry] Loaded preprocessor from {prep_path}")
            else:
                logger.error(f"[ModelRegistry] Preprocessor binary not found at {prep_path}")

            if os.path.exists(calib_path):
                self.calibrator = joblib.load(calib_path)
                logger.info(f"[ModelRegistry] Loaded calibrator from {calib_path}")

            if os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                logger.info(f"[ModelRegistry] Loaded metadata ({self.metadata.get('model_version', 'v2')})")

            if self.model is not None and self.preprocessor is not None:
                feat_names = getattr(self.preprocessor, "feature_names", [])
                if not feat_names and "feature_names" in self.metadata:
                    feat_names = self.metadata["feature_names"]
                self.explainer = ResistomeXSHAPExplainer(self.model, feat_names)
                self.is_loaded = True
                logger.info(f"[ModelRegistry] Initialized TreeSHAP explainer with {len(feat_names)} features.")

        except Exception as e:
            logger.error(f"[ModelRegistry] Error loading model artifacts: {e}", exc_info=True)
            self.is_loaded = False


# Global singleton access
model_registry = ModelRegistry.get_instance()
