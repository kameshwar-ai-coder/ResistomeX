"""Unit tests for independent 5,000-cohort generation and schema compatibility."""

import pytest
import os
import pandas as pd
from src.data import generate_10k_clinical_dataset, EXACT_COLUMNS
from src.modeling import verify_cohort_independence


def test_independent_dataset_generation_and_schema():
    """Verify that independent dataset generator matches 62-column schema and unique patient constraints."""
    test_csv = "data/clinical/test_independent_mini_100.csv"
    
    df_indep = generate_10k_clinical_dataset(
        n_records=100,
        random_seed=777,
        output_csv_path=test_csv
    )

    assert len(df_indep) == 100
    assert list(df_indep.columns) == EXACT_COLUMNS
    assert df_indep["patient_id"].nunique() >= 50

    # Test independence check function
    df_mock_dev = df_indep.copy()
    df_mock_dev["patient_id"] = "DEV-" + df_mock_dev["patient_id"]
    df_mock_dev["encounter_id"] = "DEV-" + df_mock_dev["encounter_id"]

    audit = verify_cohort_independence(df_mock_dev, df_indep)
    assert audit["is_independent"] is True
    assert audit["patient_overlap_count"] == 0

    if os.path.exists(test_csv):
        os.remove(test_csv)
