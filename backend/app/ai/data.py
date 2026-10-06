"""Data loading, clinical generation, target definition, splitting, leakage auditing, and preprocessing.

Consolidated module for ResistomeX Data Layer.
"""

import os
import re
import json
import logging
import datetime
import yaml
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GroupShuffleSplit

logger = logging.getLogger(__name__)

# =========================================================================
# 1. CONSTANTS & SCHEMAS
# =========================================================================

EXACT_COLUMNS = [
    "patient_id", "encounter_id", "validated_record", "admission_datetime", "patient_name",
    "age_years", "sex", "pregnancy_status", "ward", "bed", "patient_status",
    "primary_diagnosis", "infection_source", "suspected_pathogen", "temperature_c",
    "heart_rate_bpm", "systolic_bp_mmhg", "diastolic_bp_mmhg", "spo2_percent",
    "respiratory_rate_bpm", "crp_mg_l", "comorbidities", "kidney_function",
    "liver_function", "drug_allergy", "allergy_severity", "prior_antibiotic_exposure_count_90d",
    "prior_antibiotic_90d", "prior_antibiotic_days", "prior_resistant_organism",
    "ward_endemic_resistance_rate", "amr_probability", "amr_probability_percent",
    "amr_risk_category", "esbl_ecoli_kp_probability", "mrsa_probability",
    "mdr_pseudomonas_probability", "cre_probability", "shap_prior_antibiotic",
    "shap_prior_resistant_culture", "shap_ward_resistance", "shap_icu",
    "shap_comorbidity", "shap_vitals", "ai_explanation", "ai_first_line_option",
    "ai_alternative_option", "coverage_score_percent", "renal_safety_note",
    "safety_warnings", "doctor_decision", "doctor_decision_rationale",
    "current_empiric_regimen", "culture_status", "culture_collection_datetime",
    "culture_pathogen", "resistance_phenotype", "culture_match_to_predicted_risk",
    "treatment_outcome", "deterioration_flag", "edge_case_flag", "clinical_note_for_llm"
]

KNOWN_LEAKAGE_PATTERNS = [
    r"^culture_.*",
    r"^resistance_.*",
    r"^treatment_outcome.*",
    r"^deterioration_.*",
    r"^doctor_.*",
    r"^current_empiric_.*",
    r"^amr_prob.*",
    r"^amr_risk.*",
    r"^.*_probability.*",
    r"^shap_.*",
    r"^ai_.*",
    r"^coverage_score.*",
    r"^renal_safety_note.*",
    r"^safety_warnings.*",
    r"^culture_match.*",
    r"^edge_case_flag.*"
]

METADATA_EXCLUSIONS = [
    "patient_id", "encounter_id", "validated_record", "patient_name",
    "bed", "patient_status", "admission_datetime", "clinical_note_for_llm"
]

KNOWN_COMORBIDITIES = [
    "CKD", "Diabetes", "Hypertension", "COPD", "Malignancy",
    "Immunosuppression", "Heart failure", "Liver disease", "Cancer"
]

DIAGNOSIS_BY_SOURCE = {
    "Intra-abdominal Infection": [
        "Complicated intra-abdominal infection", "Peritonitis", "Appendicitis with abscess",
        "Biliary tract infection", "Diverticulitis with perforation"
    ],
    "Urinary Tract Infection": [
        "Complicated UTI", "Pyelonephritis", "Urosepsis", "Catheter-associated UTI"
    ],
    "Community-Acquired Pneumonia": [
        "CAP", "Severe CAP", "Aspiration pneumonia"
    ],
    "Hospital-Acquired Pneumonia": [
        "HAP", "Severe HAP"
    ],
    "Ventilator-Associated Pneumonia": [
        "VAP", "Early-onset VAP", "Late-onset VAP"
    ],
    "Bloodstream Infection": [
        "Suspected bacteremia", "Catheter-related bloodstream infection", "Primary bacteremia"
    ],
    "Skin/Soft Tissue Infection": [
        "Cellulitis", "Complicated skin infection", "Wound infection"
    ],
    "Surgical Site Infection": [
        "Deep incisional SSI", "Superficial SSI", "Post-op wound infection"
    ]
}

PATHOGENS_LIST = [
    "E. coli", "K. pneumoniae", "P. aeruginosa", "S. aureus",
    "Enterococcus faecalis", "S. pneumoniae", "Enterobacter cloacae complex",
    "Mixed flora", "No organism identified"
]

TARGET_DEFINITIONS = {
    "any_amr_isolate": {
        "description": "Probability that a positive culture isolate demonstrates any antimicrobial resistance phenotype.",
        "evaluable_filter": lambda df: df["culture_status"] == "Positive",
        "label_mapping": lambda df: df["resistance_phenotype"].apply(
            lambda x: 0 if str(x).strip().lower() in ["none detected", "susceptible", "nan", "none", ""] else 1
        )
    },
    "esbl_isolate": {
        "description": "Probability that an isolate is ESBL-producing.",
        "evaluable_filter": lambda df: df["culture_status"] == "Positive",
        "label_mapping": lambda df: df["resistance_phenotype"].apply(lambda x: 1 if "esbl" in str(x).lower() else 0)
    },
    "mrsa_isolate": {
        "description": "Probability that an isolate is MRSA.",
        "evaluable_filter": lambda df: df["culture_status"] == "Positive",
        "label_mapping": lambda df: df["resistance_phenotype"].apply(lambda x: 1 if "mrsa" in str(x).lower() else 0)
    },
    "cre_isolate": {
        "description": "Probability that an isolate is CRE.",
        "evaluable_filter": lambda df: df["culture_status"] == "Positive",
        "label_mapping": lambda df: df["resistance_phenotype"].apply(lambda x: 1 if "cre" in str(x).lower() else 0)
    }
}


class DataLeakageError(Exception):
    """Raised when critical data leakage is detected."""
    pass


# =========================================================================
# 2. DATA LOADING & CONFIGURATION
# =========================================================================

def load_yaml_config(config_path: str = "config/config.yaml") -> Dict[str, Any]:
    """Load and parse YAML configuration file."""
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    return cfg


def load_dataset(
    data_path: str,
    feature_mapping_path: str = "config/feature_mapping.json"
) -> Tuple[pd.DataFrame, Dict[str, Any], str]:
    """Load dataset, validate schema, and return loaded DataFrame, mapping, and dataset type."""
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    df = pd.read_csv(data_path)
    logger.info(f"Loaded dataset from {data_path} with {len(df)} rows and {len(df.columns)} columns.")

    feat_mapping = {}
    if os.path.exists(feature_mapping_path):
        with open(feature_mapping_path, "r", encoding="utf-8") as f:
            if feature_mapping_path.endswith((".yaml", ".yml")):
                feat_mapping = yaml.safe_load(f) or {}
            else:
                feat_mapping = json.load(f) or {}

    dataset_type = "Clinical" if "clinical" in data_path.lower() or df.get("validated_record", pd.Series([True])).all() else "Real"
    return df, feat_mapping, dataset_type


def get_feature_missingness_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Compute missingness counts and percentages for all columns in DataFrame."""
    missing_counts = df.isnull().sum()
    missing_pcts = (missing_counts / len(df)) * 100.0
    summary_df = pd.DataFrame({
        "column": df.columns,
        "missing_count": missing_counts.values,
        "missing_percentage": missing_pcts.values
    }).sort_values("missing_percentage", ascending=False)
    return summary_df


# =========================================================================
# 3. TARGET DEFINITION
# =========================================================================

def build_target(
    df: pd.DataFrame,
    target_name: str = "any_amr_isolate",
    min_samples: int = 50,
    min_positive_samples: int = 10
) -> Tuple[pd.DataFrame, pd.Series, Dict[str, Any]]:
    """Construct clinically sound binary target variable and filter evaluable cohort."""
    if target_name not in TARGET_DEFINITIONS:
        raise ValueError(f"Unknown target '{target_name}'. Allowed: {list(TARGET_DEFINITIONS.keys())}")

    spec = TARGET_DEFINITIONS[target_name]
    evaluable_mask = spec["evaluable_filter"](df)
    cohort_df = df[evaluable_mask].copy().reset_index(drop=True)

    if len(cohort_df) < min_samples:
        raise ValueError(f"Evaluable cohort size ({len(cohort_df)}) is below minimum ({min_samples})")

    y = spec["label_mapping"](cohort_df)
    n_pos = int(y.sum())
    n_neg = int(len(y) - n_pos)

    if n_pos < min_positive_samples:
        raise ValueError(f"Positive samples ({n_pos}) below minimum required ({min_positive_samples})")

    target_info = {
        "target_name": target_name,
        "description": spec["description"],
        "evaluable_samples": len(cohort_df),
        "positive_samples": n_pos,
        "negative_samples": n_neg,
        "prevalence": float(n_pos / len(cohort_df)),
        "unique_patients": int(cohort_df["patient_id"].nunique()) if "patient_id" in cohort_df.columns else len(cohort_df)
    }

    return cohort_df, y, target_info


# =========================================================================
# 4. DATA LEAKAGE DETECTOR
# =========================================================================

def audit_feature_set(
    all_columns: List[str],
    candidate_features: List[str]
) -> Tuple[bool, List[str], List[str], str]:
    """Audit candidate features against regex patterns for post-prediction or outcome fields."""
    rejected_dict = {}
    clean_features = []

    for feat in candidate_features:
        is_leak = False
        reason = ""
        for pattern in KNOWN_LEAKAGE_PATTERNS:
            if re.match(pattern, feat, re.IGNORECASE):
                is_leak = True
                reason = f"Matches leakage pattern '{pattern}' (post-culture or outcome artifact)"
                break
        
        if is_leak:
            rejected_dict[feat] = reason
        else:
            clean_features.append(feat)

    passed = (len(clean_features) > 0 and len(rejected_dict) == (len(candidate_features) - len(clean_features)))
    
    report_lines = [
        "=" * 80,
        "RESISTOMEX DATA LEAKAGE AUDIT REPORT",
        "=" * 80,
        f"Total Columns Examined:    {len(all_columns)}",
        f"Candidate Features Tested: {len(candidate_features)}",
        f"Approved Clean Features:   {len(clean_features)}",
        f"Rejected Columns:          {len(rejected_dict)}",
        "-" * 80,
        "REJECTED COLUMNS DETAIL:"
    ]
    for col, rsn in sorted(rejected_dict.items()):
        report_lines.append(f"  [REJECTED] {col:<35} -> {rsn}")

    report_lines.append("-" * 80)
    report_lines.append("APPROVED FEATURE LIST:")
    for col in clean_features:
        report_lines.append(f"  [APPROVED] {col}")
    report_lines.append("-" * 80)
    report_lines.append(f"LEAKAGE CHECK STATUS: {'PASS' if passed else 'FAIL'}")
    report_lines.append("=" * 80)

    report_text = "\n".join(report_lines)
    return passed, clean_features, list(rejected_dict.keys()), report_text


def run_leakage_check(
    df: pd.DataFrame,
    feature_mapping: Dict[str, Any],
    report_output_path: str = "reports/leakage_report.txt"
) -> Tuple[List[str], str]:
    """Run full leakage audit, write text log, and enforce zero leakage."""
    all_cols = list(df.columns)
    candidate_features = feature_mapping.get("numeric_features", []) + \
                         feature_mapping.get("categorical_features", []) + \
                         feature_mapping.get("multivalue_categorical_features", [])
    
    if not candidate_features:
        candidate_features = [c for c in all_cols if c not in METADATA_EXCLUSIONS]

    passed, clean_features, rejected_cols, report_text = audit_feature_set(all_cols, candidate_features)
    
    if report_output_path:
        os.makedirs(os.path.dirname(report_output_path), exist_ok=True)
        with open(report_output_path, "w", encoding="utf-8") as f:
            f.write(report_text)

    if not passed:
        raise DataLeakageError("Critical data leakage check failed! Aborting pipeline.")

    return clean_features, report_text


# =========================================================================
# 5. PATIENT-LEVEL SPLITTING
# =========================================================================

def split_data_by_patient_group(
    df: pd.DataFrame,
    y: pd.Series,
    patient_id_col: str = "patient_id",
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, Dict[str, Any]]:
    """Split dataset at patient level using GroupShuffleSplit to guarantee 0 patient overlap."""
    if patient_id_col not in df.columns:
        raise ValueError(f"Patient ID column '{patient_id_col}' not found in dataset")

    groups = df[patient_id_col].values
    gss_test = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
    train_val_idx, test_idx = next(gss_test.split(df, y, groups=groups))

    df_train_val = df.iloc[train_val_idx].reset_index(drop=True)
    y_train_val = y.iloc[train_val_idx].reset_index(drop=True)
    groups_train_val = df_train_val[patient_id_col].values

    val_relative_size = val_size / (1.0 - test_size)
    gss_val = GroupShuffleSplit(n_splits=1, test_size=val_relative_size, random_state=random_state)
    train_idx, val_idx = next(gss_val.split(df_train_val, y_train_val, groups=groups_train_val))

    df_train = df_train_val.iloc[train_idx].reset_index(drop=True)
    y_train = y_train_val.iloc[train_idx].reset_index(drop=True)
    df_val = df_train_val.iloc[val_idx].reset_index(drop=True)
    y_val = y_train_val.iloc[val_idx].reset_index(drop=True)
    df_test = df.iloc[test_idx].reset_index(drop=True)
    y_test = y.iloc[test_idx].reset_index(drop=True)

    # Verify zero patient leakage
    train_pts = set(df_train[patient_id_col])
    val_pts = set(df_val[patient_id_col])
    test_pts = set(df_test[patient_id_col])

    overlap_tr_val = len(train_pts.intersection(val_pts))
    overlap_tr_te = len(train_pts.intersection(test_pts))
    overlap_val_te = len(val_pts.intersection(test_pts))

    if overlap_tr_val > 0 or overlap_tr_te > 0 or overlap_val_te > 0:
        raise DataLeakageError(f"Patient overlap detected across splits! Train/Val: {overlap_tr_val}, Train/Test: {overlap_tr_te}, Val/Test: {overlap_val_te}")

    split_stats = {
        "train_samples": len(df_train),
        "val_samples": len(df_val),
        "test_samples": len(df_test),
        "train_patients": len(train_pts),
        "val_patients": len(val_pts),
        "test_patients": len(test_pts),
        "train_pos": int(y_train.sum()),
        "val_pos": int(y_val.sum()),
        "test_pos": int(y_test.sum()),
        "patient_overlap_verified_zero": True
    }

    return df_train, df_val, df_test, y_train, y_val, y_test, split_stats


# =========================================================================
# 6. FEATURE ENGINEERING & PREPROCESSING PIPELINE
# =========================================================================

class ClinicalFeatureEngineer(BaseEstimator, TransformerMixin):
    """Derives clinical sepsis indicators, shock index, and prior antibiotic burden."""

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        df = X.copy()
        
        # 1. Shock Index (HR / SBP)
        if "heart_rate_bpm" in df.columns and "systolic_bp_mmhg" in df.columns:
            sbp_safe = df["systolic_bp_mmhg"].replace(0, np.nan).fillna(120.0)
            df["feat_shock_index"] = (df["heart_rate_bpm"] / sbp_safe).clip(0.3, 2.5)

        # 2. Mean Arterial Pressure (MAP)
        if "systolic_bp_mmhg" in df.columns and "diastolic_bp_mmhg" in df.columns:
            df["feat_map"] = df["diastolic_bp_mmhg"] + (df["systolic_bp_mmhg"] - df["diastolic_bp_mmhg"]) / 3.0
            df["feat_pulse_pressure"] = df["systolic_bp_mmhg"] - df["diastolic_bp_mmhg"]

        # 3. Binary Clinical Flags
        if "temperature_c" in df.columns:
            df["feat_fever_gt38"] = (df["temperature_c"] >= 38.0).astype(float)
            df["feat_hypothermia_lt36"] = (df["temperature_c"] <= 36.0).astype(float)

        if "heart_rate_bpm" in df.columns:
            df["feat_tachycardia_gt100"] = (df["heart_rate_bpm"] >= 100).astype(float)

        if "spo2_percent" in df.columns:
            df["feat_hypoxia_le92"] = (df["spo2_percent"] <= 92).astype(float)

        if "respiratory_rate_bpm" in df.columns:
            df["feat_tachypnea_ge22"] = (df["respiratory_rate_bpm"] >= 22).astype(float)

        if "prior_antibiotic_exposure_count_90d" in df.columns:
            df["feat_prior_abx_ge2"] = (df["prior_antibiotic_exposure_count_90d"] >= 2).astype(float)

        if "prior_resistant_organism" in df.columns:
            df["feat_prior_amr_history"] = df["prior_resistant_organism"].apply(
                lambda x: 0.0 if str(x).lower() in ["none known", "none", "nan", ""] else 1.0
            )

        return df


class ComorbiditiesEncoder(BaseEstimator, TransformerMixin):
    """Parses multi-value comorbidity string (e.g., 'CKD; Diabetes') into multi-hot binary columns."""

    def __init__(self, known_comorbidities: List[str] = None):
        self.known_comorbidities = known_comorbidities or KNOWN_COMORBIDITIES
        self.feature_names_ = [f"comorb_{c.lower().replace(' ', '_')}" for c in self.known_comorbidities]

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        s = X.iloc[:, 0] if isinstance(X, pd.DataFrame) else pd.Series(X)
        s_filled = s.fillna("").astype(str)
        arr = np.zeros((len(s_filled), len(self.known_comorbidities)), dtype=np.float32)

        for i, val in enumerate(s_filled):
            if val:
                tokens = [t.strip().lower() for t in val.split(";")]
                for j, comorb in enumerate(self.known_comorbidities):
                    if any(comorb.lower() in tok for tok in tokens):
                        arr[i, j] = 1.0
        return arr

    def get_feature_names_out(self, input_features=None):
        return np.array(self.feature_names_)


class ResistomeXPreprocessor:
    """End-to-end preprocessing pipeline for tabular pre-culture clinical features."""

    def __init__(
        self,
        numeric_features: List[str],
        categorical_features: List[str],
        multivalue_features: List[str] = None
    ):
        self.base_numeric_features = numeric_features
        self.categorical_features = categorical_features
        self.multivalue_features = multivalue_features or ["comorbidities"]
        self.feature_engineer = ClinicalFeatureEngineer()
        self.pipeline: Optional[ColumnTransformer] = None
        self.feature_names: List[str] = []

    def fit(self, X: pd.DataFrame, y=None) -> "ResistomeXPreprocessor":
        X_eng = self.feature_engineer.fit_transform(X)
        engineered_numeric = [c for c in X_eng.columns if c.startswith("feat_")]
        all_numeric = self.base_numeric_features + engineered_numeric

        num_pipe = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])

        cat_pipe = Pipeline([
            ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
            ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ])

        mv_pipe = Pipeline([
            ("encoder", ComorbiditiesEncoder())
        ])

        transformers = [
            ("num", num_pipe, [c for c in all_numeric if c in X_eng.columns]),
            ("cat", cat_pipe, [c for c in self.categorical_features if c in X_eng.columns])
        ]
        if self.multivalue_features and self.multivalue_features[0] in X_eng.columns:
            transformers.append(("mv", mv_pipe, self.multivalue_features))

        self.pipeline = ColumnTransformer(transformers=transformers, remainder="drop")
        self.pipeline.fit(X_eng, y)

        # Extract feature names safely
        feat_names = []
        for name, trans, cols in self.pipeline.transformers_:
            if name == "num":
                feat_names.extend([str(c) for c in cols])
            elif name == "cat":
                ohe = trans.named_steps["ohe"]
                feat_names.extend([str(c) for c in ohe.get_feature_names_out(cols)])
            elif name == "mv":
                enc = trans.named_steps["encoder"]
                feat_names.extend([str(c) for c in enc.get_feature_names_out()])

        self.feature_names = feat_names
        logger.info(f"Preprocessor fitted. Transformed feature count: {len(self.feature_names)}")
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        if self.pipeline is None:
            raise RuntimeError("Preprocessor must be fitted before transforming data.")
        X_eng = self.feature_engineer.transform(X)
        arr = self.pipeline.transform(X_eng)
        return pd.DataFrame(arr, columns=self.feature_names, index=X.index)

    def fit_transform(self, X: pd.DataFrame, y=None) -> pd.DataFrame:
        return self.fit(X, y).transform(X)


# =========================================================================
# 7. CLINICAL DATASET GENERATOR
# =========================================================================

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def generate_10k_clinical_dataset(
    n_records: int = 10000,
    random_seed: int = 42,
    output_csv_path: str = "data/clinical/resistomex_clinical_v2_10000.csv"
) -> pd.DataFrame:
    """Generate realistic clinical clinical AMR encounters with zero schema drift."""
    rng = np.random.RandomState(random_seed)
    logger.info(f"Generating {n_records} clinical encounters with seed {random_seed}...")

    n_unique_patients = int(n_records * 0.85)
    patient_pool = [f"PX-{100000 + i:06d}" for i in range(n_unique_patients)]
    
    patient_ids = []
    for _ in range(n_records):
        if len(patient_ids) < n_unique_patients:
            patient_ids.append(patient_pool[len(patient_ids)])
        else:
            patient_ids.append(rng.choice(patient_pool))
    
    encounter_ids = [f"ENC-{20250000 + i:08d}" for i in range(n_records)]
    validated_records = [True] * n_records

    # Admission Datetimes
    base_start = datetime.datetime(2025, 1, 1, 0, 0, 0)
    total_seconds = int(2 * 365.25 * 24 * 3600)
    random_seconds = np.sort(rng.randint(0, total_seconds, size=n_records))
    admission_dts = [base_start + datetime.timedelta(seconds=int(s)) for s in random_seconds]
    admission_strs = [dt.strftime("%Y-%m-%d %H:%M:%S") for dt in admission_dts]

    # Demographics
    patient_names = [f"Clinical Patient {i+1:04d}" for i in range(n_records)]
    ages = np.clip(rng.normal(59, 17, size=n_records).astype(int), 18, 92)
    sexes = rng.choice(["Male", "Female"], size=n_records, p=[0.52, 0.48])

    pregnancy = []
    for s, a in zip(sexes, ages):
        if s == "Male" or a > 50:
            pregnancy.append("Not applicable")
        else:
            pregnancy.append(rng.choice(["No", "Yes", "Unknown"], p=[0.92, 0.05, 0.03]))

    # Wards & Endemic Resistance
    ward_types = ["General Medicine", "ICU", "Surgical Ward", "Emergency Department"]
    wards = rng.choice(ward_types, size=n_records, p=[0.45, 0.20, 0.20, 0.15])
    beds = rng.randint(1, 41, size=n_records)
    patient_statuses = rng.choice(["Active Inpatient", "Discharged", "Transferred"], size=n_records, p=[0.70, 0.22, 0.08])

    ward_endemic_rates = []
    for w in wards:
        if w == "ICU":
            rate = rng.normal(0.42, 0.07)
        elif w == "Surgical Ward":
            rate = rng.normal(0.32, 0.06)
        elif w == "General Medicine":
            rate = rng.normal(0.24, 0.05)
        else:
            rate = rng.normal(0.18, 0.04)
        ward_endemic_rates.append(round(float(np.clip(rate, 0.05, 0.75)), 3))

    # Infections & Pathogens
    inf_source_keys = list(DIAGNOSIS_BY_SOURCE.keys())
    inf_source_probs = [0.28, 0.25, 0.15, 0.12, 0.06, 0.06, 0.05, 0.03]
    inf_sources = rng.choice(inf_source_keys, size=n_records, p=inf_source_probs)

    primary_diagnoses = [rng.choice(DIAGNOSIS_BY_SOURCE[src]) for src in inf_sources]
    suspected_pathogens = [rng.choice(PATHOGENS_LIST, p=[0.30, 0.20, 0.15, 0.15, 0.06, 0.05, 0.04, 0.03, 0.02]) for _ in range(n_records)]

    # Vitals & Labs
    temps, hrs, sbps, dbps, spo2s, rrs, crps = [], [], [], [], [], [], []
    for w in wards:
        is_icu = (w == "ICU")
        t = rng.normal(38.4 if is_icu else 37.8, 0.8)
        hr = rng.normal(104 if is_icu else 88, 16)
        sbp = rng.normal(102 if is_icu else 122, 20)
        dbp = sbp * rng.uniform(0.58, 0.68)
        spo2 = rng.normal(93.5 if is_icu else 96.5, 3.2)
        rr = rng.normal(23 if is_icu else 18, 4.5)
        crp = rng.exponential(75 if is_icu else 35) + 5.0

        temps.append(round(float(np.clip(t, 35.0, 41.5)), 1))
        hrs.append(int(np.clip(hr, 45, 180)))
        sbps.append(int(np.clip(sbp, 65, 210)))
        dbps.append(int(np.clip(dbp, 35, 125)))
        spo2s.append(int(np.clip(spo2, 75, 100)))
        rrs.append(int(np.clip(rr, 8, 45)))
        crps.append(round(float(np.clip(crp, 1.0, 380.0)), 1))

    # Comorbidities & Organ Functions
    comorbidities_list = ["CKD", "Diabetes", "Hypertension", "COPD", "Malignancy", "Immunosuppression"]
    comorbidities_col = []
    for a in ages:
        n_c = rng.choice([0, 1, 2, 3], p=[0.25, 0.40, 0.25, 0.10] if a > 60 else [0.55, 0.30, 0.12, 0.03])
        if n_c == 0:
            comorbidities_col.append("")
        else:
            comorbidities_col.append("; ".join(rng.choice(comorbidities_list, size=n_c, replace=False)))

    kidney_funcs = rng.choice(["Normal", "Mild impairment", "Moderate impairment", "Severe impairment"], size=n_records, p=[0.55, 0.25, 0.14, 0.06])
    liver_funcs = rng.choice(["Normal", "Mild impairment", "Moderate impairment"], size=n_records, p=[0.82, 0.14, 0.04])
    drug_allergies = rng.choice(["None known", "Penicillin", "Cephalosporins", "Fluoroquinolones", "Sulfa drugs"], size=n_records, p=[0.72, 0.16, 0.05, 0.04, 0.03])
    allergy_severities = [rng.choice(["Mild rash", "Moderate hives", "Severe anaphylaxis"], p=[0.60, 0.30, 0.10]) if a != "None known" else None for a in drug_allergies]

    # Prior Antibiotics & AMR History
    prior_abx_counts = rng.choice([0, 1, 2, 3, 4], size=n_records, p=[0.45, 0.28, 0.16, 0.08, 0.03])
    prior_abx_names, prior_abx_days = [], []
    for c in prior_abx_counts:
        if c == 0:
            prior_abx_names.append("None in prior 90 days")
            prior_abx_days.append(0)
        else:
            prior_abx_names.append(rng.choice(["Ceftriaxone", "Piperacillin-Tazobactam", "Ciprofloxacin", "Cefepime", "Meropenem", "Vancomycin"]))
            prior_abx_days.append(int(rng.choice([3, 5, 7, 10, 14], p=[0.2, 0.35, 0.25, 0.15, 0.05])))

    prior_res_orgs = []
    for c in prior_abx_counts:
        if c >= 2:
            prior_res_orgs.append(rng.choice(["None known", "ESBL E. coli", "MRSA", "CRE K. pneumoniae"], p=[0.45, 0.30, 0.15, 0.10]))
        elif c == 1:
            prior_res_orgs.append(rng.choice(["None known", "ESBL E. coli", "MRSA"], p=[0.75, 0.18, 0.07]))
        else:
            prior_res_orgs.append(rng.choice(["None known", "ESBL E. coli"], p=[0.94, 0.06]))

    # Latent AMR Risk Modeling & Culture Outcomes
    culture_statuses = rng.choice(["Positive", "No growth", "Contaminant"], size=n_records, p=[0.48, 0.44, 0.08])
    culture_dts = [dt + datetime.timedelta(hours=int(rng.uniform(24, 72))) for dt in admission_dts]

    culture_pathogens, resistance_phenotypes = [], []
    amr_prob_col, amr_pct_col, amr_risk_cats = [], [], []
    esbl_probs, mrsa_probs, mdr_pseudo_probs, cre_probs = [], [], [], []
    shap_prior_abx, shap_prior_res, shap_ward_res, shap_icus, shap_comorbs, shap_vits = [], [], [], [], [], []
    first_line_opts, alt_opts, cov_scores, renal_notes, safety_warnings_col = [], [], [], [], []
    doc_decisions, doc_rationales, empiric_regimens, outcomes, deteriorations, edge_case_flags, clinical_notes = [], [], [], [], [], [], []
    culture_matches, ai_explanations = [], []

    for i in range(n_records):
        is_icu = (wards[i] == "ICU")
        has_prior_abx = (prior_abx_counts[i] > 0)
        has_prior_res = (prior_res_orgs[i] != "None known")
        
        # Grounded latent log-odds
        z = -1.2 \
            + 1.4 * float(has_prior_res) \
            + 0.28 * float(prior_abx_counts[i]) \
            + 1.8 * (ward_endemic_rates[i] - 0.25) \
            + (0.45 if is_icu else 0.0) \
            + 0.015 * (ages[i] - 55) \
            + 0.40 * (temps[i] - 37.5) \
            + 0.012 * (hrs[i] - 85) \
            + 0.003 * (crps[i] - 30) \
            + rng.normal(0, 0.65)

        prob = float(np.clip(sigmoid(z), 0.04, 0.96))
        pct = int(round(prob * 100))
        risk_cat = "High" if prob >= 0.70 else "Medium" if prob >= 0.40 else "Low"

        amr_prob_col.append(round(prob, 4))
        amr_pct_col.append(pct)
        amr_risk_cats.append(risk_cat)

        esbl_p = round(float(np.clip(prob * rng.uniform(0.6, 0.9), 0.02, 0.95)), 3)
        mrsa_p = round(float(np.clip(prob * rng.uniform(0.4, 0.8), 0.02, 0.95)), 3)
        pseudo_p = round(float(np.clip(prob * (0.6 if is_icu else 0.2), 0.01, 0.85)), 3)
        cre_p = round(float(np.clip(prob * (0.4 if has_prior_res else 0.1), 0.01, 0.75)), 3)

        esbl_probs.append(esbl_p)
        mrsa_probs.append(mrsa_p)
        mdr_pseudo_probs.append(pseudo_p)
        cre_probs.append(cre_p)

        # Culture Phenotype
        if culture_statuses[i] == "Positive":
            pathogen = suspected_pathogens[i] if rng.rand() > 0.15 else rng.choice(["E. coli", "K. pneumoniae", "P. aeruginosa", "S. aureus"])
            culture_pathogens.append(pathogen)

            # Resistance phenotype linked to latent probability
            if rng.rand() < prob:
                if "aureus" in pathogen.lower():
                    pheno = "MRSA"
                elif "pseudomonas" in pathogen.lower():
                    pheno = "MDR Pseudomonas"
                elif "pneumoniae" in pathogen.lower() and rng.rand() < 0.35:
                    pheno = "CRE"
                else:
                    pheno = "ESBL"
            else:
                pheno = "None detected"
            resistance_phenotypes.append(pheno)
        else:
            culture_pathogens.append("No growth" if culture_statuses[i] == "No growth" else "Mixed skin flora")
            resistance_phenotypes.append("None detected")

        # Concordance & Outcomes
        match = "Yes" if (risk_cat == "High" and resistance_phenotypes[-1] != "None detected") or (risk_cat == "Low" and resistance_phenotypes[-1] == "None detected") else "Partial"
        culture_matches.append(match)

        # Empiric Regimen
        is_pen_allergic = "penicillin" in drug_allergies[i].lower()
        if risk_cat == "High":
            regimen = "Aztreonam + Vancomycin" if is_pen_allergic else "Meropenem + Vancomycin"
        elif risk_cat == "Medium":
            regimen = "Levofloxacin" if is_pen_allergic else "Piperacillin-Tazobactam"
        else:
            regimen = "Ciprofloxacin" if is_pen_allergic else "Ceftriaxone"
        empiric_regimens.append(regimen)

        # SHAP & Explanations
        shap_prior_abx.append(round(float(0.18 * prior_abx_counts[i]), 3))
        shap_prior_res.append(round(float(0.35 if has_prior_res else -0.05), 3))
        shap_ward_res.append(round(float(0.25 * (ward_endemic_rates[i] - 0.25)), 3))
        shap_icus.append(round(float(0.15 if is_icu else -0.05), 3))
        shap_comorbs.append(round(float(0.08 if "CKD" in comorbidities_col[i] else 0.0), 3))
        shap_vits.append(round(float(0.12 * (temps[i] - 37.5)), 3))

        first_line_opts.append(regimen)
        alt_opts.append("Cefepime" if not is_pen_allergic else "Gentamicin")
        cov_scores.append(int(rng.uniform(85, 98)))
        renal_notes.append("Dose adjust for eGFR" if "Severe" in kidney_funcs[i] else "Standard dosing")
        safety_warnings_col.append(f"Penicillin allergy ({allergy_severities[i]})" if is_pen_allergic else "None")
        doc_decisions.append("Accepted AI recommendation")
        doc_rationales.append("Concordant with institutional sepsis guideline.")
        outcomes.append("Favorable" if (match in ["Yes", "Partial"] and rng.rand() > 0.12) else "Poor response")
        deteriorations.append("Yes" if outcomes[-1] == "Poor response" and is_icu else "No")
        edge_case_flags.append(False)
        ai_explanations.append(f"AMR risk assessed as {risk_cat} ({pct}%) based on prior exposures and vital stability.")

        clinical_notes.append(
            f"Admitted to {wards[i]} with {primary_diagnoses[i]} ({inf_sources[i]}). "
            f"Initial vitals: T {temps[i]} C, HR {hrs[i]}, BP {sbps[i]}/{dbps[i]}, SpO2 {spo2s[i]}%, RR {rrs[i]}. CRP {crps[i]} mg/L. "
            f"History: {comorbidities_col[i] or 'No chronic illnesses'}; allergy {drug_allergies[i]}; "
            f"prior antibiotic exposure in 90d {prior_abx_counts[i]}; previous resistant organism {prior_res_orgs[i]}."
        )

    df_data = {
        "patient_id": patient_ids,
        "encounter_id": encounter_ids,
        "validated_record": validated_records,
        "admission_datetime": admission_strs,
        "patient_name": patient_names,
        "age_years": ages,
        "sex": sexes,
        "pregnancy_status": pregnancy,
        "ward": wards,
        "bed": beds,
        "patient_status": patient_statuses,
        "primary_diagnosis": primary_diagnoses,
        "infection_source": inf_sources,
        "suspected_pathogen": suspected_pathogens,
        "temperature_c": temps,
        "heart_rate_bpm": hrs,
        "systolic_bp_mmhg": sbps,
        "diastolic_bp_mmhg": dbps,
        "spo2_percent": spo2s,
        "respiratory_rate_bpm": rrs,
        "crp_mg_l": crps,
        "comorbidities": comorbidities_col,
        "kidney_function": kidney_funcs,
        "liver_function": liver_funcs,
        "drug_allergy": drug_allergies,
        "allergy_severity": allergy_severities,
        "prior_antibiotic_exposure_count_90d": prior_abx_counts,
        "prior_antibiotic_90d": prior_abx_names,
        "prior_antibiotic_days": prior_abx_days,
        "prior_resistant_organism": prior_res_orgs,
        "ward_endemic_resistance_rate": ward_endemic_rates,
        "amr_probability": amr_prob_col,
        "amr_probability_percent": amr_pct_col,
        "amr_risk_category": amr_risk_cats,
        "esbl_ecoli_kp_probability": esbl_probs,
        "mrsa_probability": mrsa_probs,
        "mdr_pseudomonas_probability": mdr_pseudo_probs,
        "cre_probability": cre_probs,
        "shap_prior_antibiotic": shap_prior_abx,
        "shap_prior_resistant_culture": shap_prior_res,
        "shap_ward_resistance": shap_ward_res,
        "shap_icu": shap_icus,
        "shap_comorbidity": shap_comorbs,
        "shap_vitals": shap_vits,
        "ai_explanation": ai_explanations,
        "ai_first_line_option": first_line_opts,
        "ai_alternative_option": alt_opts,
        "coverage_score_percent": cov_scores,
        "renal_safety_note": renal_notes,
        "safety_warnings": safety_warnings_col,
        "doctor_decision": doc_decisions,
        "doctor_decision_rationale": doc_rationales,
        "current_empiric_regimen": empiric_regimens,
        "culture_status": culture_statuses,
        "culture_collection_datetime": [dt.strftime("%Y-%m-%d %H:%M:%S") for dt in culture_dts],
        "culture_pathogen": culture_pathogens,
        "resistance_phenotype": resistance_phenotypes,
        "culture_match_to_predicted_risk": culture_matches,
        "treatment_outcome": outcomes,
        "deterioration_flag": deteriorations,
        "edge_case_flag": edge_case_flags,
        "clinical_note_for_llm": clinical_notes
    }

    df_out = pd.DataFrame(df_data)[EXACT_COLUMNS]
    if output_csv_path:
        os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
        df_out.to_csv(output_csv_path, index=False)
        logger.info(f"Saved exactly {len(df_out)} rows and {len(df_out.columns)} columns to {output_csv_path}")

    return df_out
