"""Phase 2 Master Pipeline Runner for ResistomeX AI."""

import os
import sys
import logging
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.ai.pipeline import run_full_phase2_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Run ResistomeX Phase 2 Pipeline")
    parser.add_argument("--config", default="config/config.yaml", help="Path to config YAML")
    args = parser.parse_args()

    logger.info("Executing Complete ResistomeX Phase 2 Validation Pipeline...")
    res = run_full_phase2_pipeline(config_path=args.config)
    print("\nPhase 2 Pipeline executed successfully!\n")


if __name__ == "__main__":
    main()
