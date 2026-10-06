"""Model evaluation CLI for ResistomeX XGBoost Model."""

import os
import sys
import logging
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.ai.pipeline import evaluation_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Evaluate ResistomeX Model on Test Split")
    parser.add_argument("--config", default="config/config.yaml", help="Path to config YAML")
    parser.add_argument("--models-dir", default="models", help="Directory containing saved model artifacts")
    args = parser.parse_args()

    logger.info("Initiating ResistomeX model evaluation...")
    result = evaluation_pipeline(config_path=args.config, models_dir=args.models_dir)
    print("\nEvaluation completed successfully!")
    print(f"ROC-AUC: {result['metrics']['roc_auc']:.4f}")
    print(f"PR-AUC:  {result['metrics']['pr_auc']:.4f}")
    print(f"Brier:   {result['metrics']['brier_score']:.4f}\n")


if __name__ == "__main__":
    main()
