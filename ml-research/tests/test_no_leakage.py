"""Unit tests for leakage detection and pre-culture feature approval."""

import pytest
from src.data import audit_feature_set, KNOWN_LEAKAGE_PATTERNS


def test_leakage_audit_catches_all_post_culture_fields():
    """Verify that any post-culture or post-treatment column is strictly flagged and rejected."""
    candidate_list = [
        "age_years", "temperature_c", "heart_rate_bpm",
        "culture_pathogen", "resistance_phenotype", "treatment_outcome",
        "culture_match_to_predicted_risk", "amr_probability", "amr_risk_category"
    ]
    all_cols = candidate_list + ["patient_id", "sex", "ward"]

    passed, clean, rejected, report = audit_feature_set(all_cols, candidate_list)

    assert len(rejected) == 6
    assert "culture_pathogen" in rejected
    assert "resistance_phenotype" in rejected
    assert "treatment_outcome" in rejected
    assert "amr_probability" in rejected
    assert "amr_risk_category" in rejected
    assert "culture_match_to_predicted_risk" in rejected

    assert "age_years" in clean
    assert "temperature_c" in clean
    assert "heart_rate_bpm" in clean
