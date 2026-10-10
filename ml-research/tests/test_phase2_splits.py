"""Unit tests for Phase 2 dataset splitting and patient-level isolation."""

import pytest
import numpy as np
import pandas as pd
from src.data import split_data_by_patient_group, build_target


def test_zero_patient_overlap_in_splits():
    """Verify that split_data_by_patient_group produces strictly 0 patient overlap across train, val, test."""
    n_encounters = 500
    n_patients = 150
    rng = np.random.RandomState(42)
    
    patient_pool = [f"PT-{i:04d}" for i in range(n_patients)]
    patients = rng.choice(patient_pool, size=n_encounters)
    encounters = [f"ENC-{i:05d}" for i in range(n_encounters)]
    targets = rng.choice([0, 1], size=n_encounters)

    df = pd.DataFrame({
        "patient_id": patients,
        "encounter_id": encounters,
        "culture_status": ["Positive"] * n_encounters,
        "resistance_phenotype": ["ESBL" if t == 1 else "None detected" for t in targets]
    })

    cohort_df, y, _ = build_target(df, "any_amr_isolate", min_samples=50, min_positive_samples=10)

    df_train, df_val, df_test, y_train, y_val, y_test, stats = split_data_by_patient_group(
        cohort_df, y, patient_id_col="patient_id", test_size=0.20, val_size=0.20, random_state=42
    )

    tr_pts = set(df_train["patient_id"])
    va_pts = set(df_val["patient_id"])
    te_pts = set(df_test["patient_id"])

    assert len(tr_pts.intersection(va_pts)) == 0
    assert len(tr_pts.intersection(te_pts)) == 0
    assert len(va_pts.intersection(te_pts)) == 0
    assert stats["patient_overlap_verified_zero"] is True
