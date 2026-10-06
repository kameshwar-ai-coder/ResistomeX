"""Model training CLI for ResistomeX XGBoost Clinical AMR Pipeline."""

import os
import sys
import logging
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.ai.pipeline import train_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Train ResistomeX XGBoost AMR Model")
    parser.add_argument("--config", default="config/config.yaml", help="Path to config YAML")
    args = parser.parse_args()

    logger.info("Initiating ResistomeX model training...")
    result = train_pipeline(config_path=args.config)
    print("\nTraining completed successfully!")
    print(f"ROC-AUC: {result['metrics']['roc_auc']:.4f}")
    print(f"PR-AUC:  {result['metrics']['pr_auc']:.4f}")
    print(f"Brier:   {result['metrics']['brier_score']:.4f}\n")


if __name__ == "__main__":
    main()
