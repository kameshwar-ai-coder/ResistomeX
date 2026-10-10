"""Comprehensive unit tests for ResistomeX AI Pipeline components."""

import pytest
import numpy as np
import pandas as pd
from src.data import build_target, audit_feature_set, split_data_by_patient_group, ResistomeXPreprocessor
from src.modeling import train_xgboost_model
from src.explainability import ResistomeXSHAPExplainer
from src.llm import ClinicalNoteExtractor, ClinicalHallucinationChecker, RuleConstrainedRecommendationEngine
from src.evaluation import check_out_of_distribution_and_abstention


@pytest.fixture
def sample_dataset():
    """Create a controlled mini dataset representing clinical encounters."""
    data = {
        "patient_id": [f"PT-{i}" for i in range(100)],
        "encounter_id": [f"ENC-{i}" for i in range(100)],
        "age_years": np.random.randint(18, 90, size=100),
        "sex": np.random.choice(["Male", "Female"], size=100),
        "pregnancy_status": ["Not applicable"] * 100,
        "ward": np.random.choice(["ICU", "General Medicine", "Emergency"], size=100),
        "primary_diagnosis": ["Sepsis", "Pneumonia", "UTI", "Intra-abdominal"] * 25,
        "infection_source": ["Respiratory", "Urinary Tract", "Intra-abdominal"] * 33 + ["Respiratory"],
        "suspected_pathogen": ["E. coli", "K. pneumoniae", "P. aeruginosa", "S. aureus"] * 25,
        "temperature_c": np.random.uniform(36.5, 39.5, size=100),
        "heart_rate_bpm": np.random.randint(60, 130, size=100),
        "systolic_bp_mmhg": np.random.randint(90, 160, size=100),
        "diastolic_bp_mmhg": np.random.randint(50, 95, size=100),
        "spo2_percent": np.random.randint(92, 100, size=100),
        "respiratory_rate_bpm": np.random.randint(12, 28, size=100),
        "crp_mg_l": np.random.uniform(5.0, 150.0, size=100),
        "comorbidities": ["CKD; Diabetes", "Hypertension", "", "CKD"] * 25,
        "kidney_function": np.random.choice(["Normal", "Mild impairment", "Moderate impairment"], size=100),
        "liver_function": ["Normal"] * 100,
        "drug_allergy": ["None known"] * 80 + ["Penicillin"] * 20,
        "allergy_severity": [None] * 100,
        "prior_antibiotic_exposure_count_90d": np.random.choice([0, 1, 2], size=100),
        "prior_antibiotic_90d": ["None"] * 60 + ["Ceftriaxone"] * 40,
        "prior_antibiotic_days": np.random.choice([0, 5, 10], size=100),
        "prior_resistant_organism": ["None known"] * 70 + ["ESBL E. coli"] * 30,
        "ward_endemic_resistance_rate": np.random.uniform(0.1, 0.4, size=100),
        "culture_status": ["Positive"] * 80 + ["No growth"] * 20,
        "resistance_phenotype": ["ESBL"] * 35 + ["MRSA"] * 15 + ["None detected"] * 50,
        "clinical_note_for_llm": [
            "Admitted to General Medicine with UTI. Initial vitals: T 38.5 C, HR 105, BP 120/70, SpO2 98%. History: CKD; allergy None known; prior antibiotic exposure in 90d 1; previous resistant organism None known."
        ] * 100
    }
    return pd.DataFrame(data)


def test_target_generation(sample_dataset):
    """Verify target builder produces valid binary classification labels."""
    cohort_df, y, info = build_target(sample_dataset, target_name="any_amr_isolate", min_samples=20, min_positive_samples=5)
    assert len(cohort_df) == 80
    assert y.isin([0, 1]).all()
    assert info["positive_samples"] == 50
    assert info["negative_samples"] == 30


def test_leakage_detector():
    """Verify data leakage auditor catches forbidden post-culture and outcome fields."""
    all_cols = ["age_years", "culture_pathogen", "treatment_outcome", "amr_probability", "temperature_c"]
    candidate = ["age_years", "culture_pathogen", "treatment_outcome", "temperature_c"]
    passed, clean, rejected, rep = audit_feature_set(all_cols, candidate)
    
    assert "culture_pathogen" in rejected
    assert "treatment_outcome" in rejected
    assert "age_years" in clean
    assert "temperature_c" in clean


def test_patient_splitting(sample_dataset):
    """Verify patient-level splitting guarantees zero patient leakage."""
    cohort_df, y, _ = build_target(sample_dataset, "any_amr_isolate", min_samples=20, min_positive_samples=5)
    df_train, df_val, df_test, y_tr, y_v, y_te, stats = split_data_by_patient_group(
        cohort_df, y, patient_id_col="patient_id", test_size=0.2, val_size=0.2, random_state=42
    )

    tr_pts = set(df_train["patient_id"])
    val_pts = set(df_val["patient_id"])
    te_pts = set(df_test["patient_id"])

    assert len(tr_pts.intersection(te_pts)) == 0
    assert len(tr_pts.intersection(val_pts)) == 0
    assert len(val_pts.intersection(te_pts)) == 0
    assert stats["patient_overlap_verified_zero"] is True


def test_preprocessing_and_model_pipeline(sample_dataset):
    """Verify end-to-end preprocessing, encoding, and XGBoost fit/predict."""
    cohort_df, y, _ = build_target(sample_dataset, "any_amr_isolate", min_samples=20, min_positive_samples=5)
    
    num_cols = ["age_years", "temperature_c", "heart_rate_bpm", "ward_endemic_resistance_rate"]
    cat_cols = ["sex", "ward", "kidney_function", "drug_allergy"]
    mv_cols = ["comorbidities"]

    prep = ResistomeXPreprocessor(num_cols, cat_cols, mv_cols)
    X = prep.fit_transform(cohort_df, y)
    
    assert X.shape[0] == len(cohort_df)
    assert not X.isna().any().any()

    model, params = train_xgboost_model(X, y, random_state=42)
    probs = model.predict_proba(X)[:, 1]
    assert len(probs) == len(cohort_df)
    assert (probs >= 0.0).all() and (probs <= 1.0).all()


def test_shap_explainer(sample_dataset):
    """Verify SHAP attributions, additivity, and local explanation formatting."""
    cohort_df, y, _ = build_target(sample_dataset, "any_amr_isolate", min_samples=20, min_positive_samples=5)
    num_cols = ["age_years", "temperature_c", "heart_rate_bpm", "ward_endemic_resistance_rate"]
    prep = ResistomeXPreprocessor(num_cols, ["sex", "ward"], ["comorbidities"])
    X = prep.fit_transform(cohort_df, y)

    model, _ = train_xgboost_model(X, y, random_state=42)
    explainer = ResistomeXSHAPExplainer(model, prep.feature_names)
    
    local_exp = explainer.get_local_explanation(
        X.iloc[0], "PT-0", "ENC-0", pred_prob=0.75, top_k=3
    )
    assert len(local_exp.top_risk_factors) <= 3
    assert local_exp.patient_id == "PT-0"

    faith_res = explainer.test_shap_faithfulness(X, n_samples=10)
    assert faith_res["additivity_check_passed"] is True


def test_llm_json_extraction_and_hallucination():
    """Verify note parser extracts strict types and hallucination detector catches ungrounded facts."""
    extractor = ClinicalNoteExtractor()
    checker = ClinicalHallucinationChecker()

    note = "Admitted to General Medicine with UTI. Initial vitals: T 38.5 C, HR 105, BP 120/70, SpO2 98%. History: CKD; allergy Penicillin; prior antibiotic exposure in 90d 2; previous resistant organism ESBL E. coli."
    extracted = extractor.extract(note)

    assert extracted is not None
    assert extracted.temperature_c == 38.5
    assert extracted.heart_rate_bpm == 105
    assert extracted.previous_antibiotic_exposure is True
    assert extracted.drug_allergy == "Penicillin"

    # Hallucination test
    is_hallu, unsupp = checker.check_extraction_hallucination(extracted.model_dump(), note)
    assert is_hallu is False

    # Inject unsupported drug
    bad_dict = extracted.model_dump()
    bad_dict["previous_antibiotics"] = ["Meropenem"]
    is_hallu2, unsupp2 = checker.check_extraction_hallucination(bad_dict, note)
    assert is_hallu2 is True
    assert len(unsupp2) > 0


def test_recommendation_engine_safety():
    """Verify that recommendation engine enforces allergy and renal safety rules."""
    engine = RuleConstrainedRecommendationEngine()
    
    # High risk, Penicillin allergic, Renal impairment
    rec = engine.generate_recommendations(
        patient_id="PT-99",
        encounter_id="ENC-99",
        predicted_amr_prob=0.85,
        infection_source="Intra-abdominal",
        drug_allergy="Penicillin anaphylaxis",
        kidney_function="Severe impairment (eGFR 20)"
    )

    assert rec.risk_category == "High"
    assert any("Penicillin allergy" in w for w in rec.safety_warnings)
    assert any("Renal impairment" in w for w in rec.safety_warnings)
    # Ensure first-line does not contain beta-lactams
    assert "Piperacillin" not in rec.candidate_regimens[0].antibiotic_name


def test_out_of_distribution_abstention():
    """Verify OOD detector flags extreme physiologic values or missingness."""
    extreme_patient = pd.Series({
        "temperature_c": 44.5, # Lethal/extreme fever
        "heart_rate_bpm": 240,
        "age_years": 45
    })
    abstained, reason = check_out_of_distribution_and_abstention(extreme_patient)
    assert abstained is True
    assert "extreme" in reason.lower()
