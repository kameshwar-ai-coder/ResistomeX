"""Unit tests for feature ablation pipeline and metric delta consistency."""

import pytest
import numpy as np
import pandas as pd
from src.evaluation import ABLATION_SUITES, run_feature_ablation_experiments


def test_ablation_suites_structure():
    """Verify that ablation suites cover core clinical groupings."""
    assert "A. Full Model (Baseline)" in ABLATION_SUITES
    assert "B. Remove Age" in ABLATION_SUITES
    assert "C. Remove Temperature" in ABLATION_SUITES
    assert "E. Remove All Vital Signs" in ABLATION_SUITES
    assert "F. Remove Prior Antibiotics" in ABLATION_SUITES
    assert "H. Remove Prior AMR & Antibiogram" in ABLATION_SUITES
