# ResistomeX Existing Dataset Schema Specification

**Source File**: `ResistomeX_clinical_1000_encounters.csv`  
**Total Rows**: 1,000  
**Total Columns**: 62  
**Target Column**: `resistance_phenotype` (Target cohort definition: `any_amr_isolate` across `culture_status == 'Positive'`)

---

## 1. Complete Column Ordering & Data Types

| Index | Column Name | Data Type | Missingness | Pre-Culture Availability | Clinical Category |
|:---|:---|:---|:---:|:---:|:---|
| 0 | `patient_id` | string (`PX-100000`...) | 0.0% | Yes | Identifier |
| 1 | `encounter_id` | string (`ENC-20250000`...) | 0.0% | Yes | Identifier |
| 2 | `validated_record` | boolean (`True`) | 0.0% | Yes | Metadata |
| 3 | `admission_datetime` | datetime string (`YYYY-MM-DD HH:MM:SS`) | 0.0% | Yes | Temporal Timestamp |
| 4 | `patient_name` | string (`Clinical Patient XXXX`) | 0.0% | Yes | Demographics |
| 5 | `age_years` | int64 (18–90) | 0.0% | Yes | Demographics |
| 6 | `sex` | string (`Male`, `Female`) | 0.0% | Yes | Demographics |
| 7 | `pregnancy_status` | string (`Not applicable`, `No`, `Yes`, `Unknown`) | 0.0% | Yes | Demographics |
| 8 | `ward` | string (`General Medicine`, `ICU`, `Surgical Ward`, `Emergency Department`) | 0.0% | Yes | Healthcare Context |
| 9 | `bed` | int64 (1–40) | 0.0% | Yes | Healthcare Context |
| 10 | `patient_status` | string (`Active Inpatient`, `Discharged`, `Transferred`) | 0.0% | Yes | Administrative |
| 11 | `primary_diagnosis` | string (15 distinct acute diagnoses) | 0.0% | Yes | Clinical Presentation |
| 12 | `infection_source` | string (8 anatomical infection sources) | 0.0% | Yes | Clinical Presentation |
| 13 | `suspected_pathogen` | string (9 clinically suspected organisms) | 0.0% | Yes | Clinical Presentation |
| 14 | `temperature_c` | float64 (35.0–41.0 °C) | 0.0% | Yes | Physiological Vitals |
| 15 | `heart_rate_bpm` | int64 (45–160 bpm) | 0.0% | Yes | Physiological Vitals |
| 16 | `systolic_bp_mmhg` | int64 (70–190 mmHg) | 0.0% | Yes | Physiological Vitals |
| 17 | `diastolic_bp_mmhg` | int64 (35–110 mmHg) | 0.0% | Yes | Physiological Vitals |
| 18 | `spo2_percent` | int64 (80–100 %) | 0.0% | Yes | Physiological Vitals |
| 19 | `respiratory_rate_bpm` | int64 (10–36 bpm) | 0.0% | Yes | Physiological Vitals |
| 20 | `crp_mg_l` | float64 (0.5–250.0 mg/L) | 0.0% | Yes | Inflammatory Lab |
| 21 | `comorbidities` | string (`CKD; Diabetes`, `COPD`, `Immunosuppression`, etc.) | 34.2% | Yes | Clinical History |
| 22 | `kidney_function` | string (`Normal`, `Mild impairment`, `Moderate impairment`, `Severe impairment`, `AKI`, `Unknown`) | 0.0% | Yes | Organ Function |
| 23 | `liver_function` | string (`Normal`, `Mild impairment`, `Moderate impairment`, `Severe impairment`, `Unknown`) | 0.0% | Yes | Organ Function |
| 24 | `drug_allergy` | string (`None known`, `Penicillin`, `Cephalosporin`, `Sulfonamide`, `Vancomycin`, `Multiple antibiotics`, `Unknown`) | 0.0% | Yes | Safety/Allergy |
| 25 | `allergy_severity` | string (`None`, `Mild/rash`, `IgE-mediated`, `Anaphylaxis`) | 66.0% | Yes | Safety/Allergy |
| 26 | `prior_antibiotic_exposure_count_90d` | int64 (0–5) | 0.0% | Yes | Prior AMR Risk |
| 27 | `prior_antibiotic_90d` | string (13 distinct prior regimens) | 0.0% | Yes | Prior AMR Risk |
| 28 | `prior_antibiotic_days` | int64 (0–30) | 0.0% | Yes | Prior AMR Risk |
| 29 | `prior_resistant_organism` | string (`None known`, `ESBL`, `MRSA`, `CRE`, `MDR Pseudomonas`) | 0.0% | Yes | Prior AMR Risk |
| 30 | `ward_endemic_resistance_rate` | float64 (0.10–0.60) | 0.0% | Yes | Local Antibiogram Context |
| 31 | `amr_probability` | float64 (0.05–0.95) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Decision Support Output |
| 32 | `amr_probability_percent` | float64 (5.0–95.0) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Decision Support Output |
| 33 | `amr_risk_category` | string (`Low`, `Medium`, `High`) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Decision Support Output |
| 34 | `esbl_ecoli_kp_probability` | float64 (0.01–0.90) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Decision Support Output |
| 35 | `mrsa_probability` | float64 (0.01–0.90) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Decision Support Output |
| 36 | `mdr_pseudomonas_probability` | float64 (0.01–0.90) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Decision Support Output |
| 37 | `cre_probability` | float64 (0.01–0.90) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Decision Support Output |
| 38 | `shap_prior_antibiotic` | float64 (-0.15 to +0.25) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical SHAP Attribution |
| 39 | `shap_prior_resistant_culture` | float64 (-0.15 to +0.25) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical SHAP Attribution |
| 40 | `shap_ward_resistance` | float64 (-0.15 to +0.25) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical SHAP Attribution |
| 41 | `shap_icu` | float64 (-0.15 to +0.25) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical SHAP Attribution |
| 42 | `shap_comorbidity` | float64 (-0.15 to +0.25) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical SHAP Attribution |
| 43 | `shap_vitals` | float64 (-0.15 to +0.25) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical SHAP Attribution |
| 44 | `ai_explanation` | string | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical LLM Narrative |
| 45 | `ai_first_line_option` | string (10 distinct antibiotic regimens) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Treatment Support |
| 46 | `ai_alternative_option` | string (10 distinct antibiotic regimens) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Treatment Support |
| 47 | `coverage_score_percent` | float64 (40.0–98.0) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Treatment Support |
| 48 | `renal_safety_note` | string (5 distinct warning notes) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Safety Flag |
| 49 | `safety_warnings` | string (32 distinct safety warning combinations) | 0.0% | **NO (Leakage / Clinical Artifact)** | Clinical Safety Flag |
| 50 | `doctor_decision` | string (`Accept`, `Modify`, `Override`, `Pending`) | 0.0% | **NO (Post-Prediction Clinician Action)** | Clinical Feedback Workflow |
| 51 | `doctor_decision_rationale` | string (10 distinct clinical rationales) | 0.0% | **NO (Post-Prediction Clinician Action)** | Clinical Feedback Workflow |
| 52 | `current_empiric_regimen` | string (12 distinct regimens) | 0.0% | **NO (Post-Prediction Treatment)** | Clinical Feedback Workflow |
| 53 | `culture_status` | string (`Positive`, `Pending`, `No growth`, `Contaminated`, `Unavailable`, `Not collected`) | 0.0% | **NO (Post-Admission Lab Result)** | Microbiology Laboratory |
| 54 | `culture_collection_datetime` | datetime string (`YYYY-MM-DD HH:MM:SS`) | 36.2% | **NO (Post-Admission Timestamp)** | Microbiology Laboratory |
| 55 | `culture_pathogen` | string (12 organism categories) | 0.0% | **NO (Post-Culture Ground Truth)** | Microbiology Laboratory |
| 56 | `resistance_phenotype` | string (`ESBL`, `MRSA`, `CRE`, `MDR Pseudomonas`, `Other MDR`, `None detected`, `Pending/unknown`, `Not interpretable`, `Not available`, `Unknown`) | 0.0% | **TARGET CANDIDATE / Post-Culture AST Ground Truth** | Microbiology Laboratory |
| 57 | `culture_match_to_predicted_risk` | string (`Concordant`, `Discordant`, `Pending`) | 0.0% | **NO (Post-Hoc Verification)** | Evaluation Tracking |
| 58 | `treatment_outcome` | string (`Improved`, `Recovered`, `Deterioration`, `Treatment failure`, `Escalated care`, `No documented outcome`) | 0.0% | **NO (Post-Treatment Outcome)** | Longitudinal Clinical Tracking |
| 59 | `deterioration_flag` | string (`No`, `Yes`) | 0.0% | **NO (Post-Admission Clinical Event)** | Patient Deterioration Monitoring |
| 60 | `edge_case_flag` | string (6 clinical scenario flags) | 0.0% | Yes | Cohort Stratification Tag |
| 61 | `clinical_note_for_llm` | string (Unstructured admission note) | 0.0% | Yes | Unstructured EHR Clinical Text |

---

## 2. Structural Preservation Guarantee

- **Exact Schema Invariant**: All 62 column names, order, types, and categorical enumerations will be identically preserved in `data/clinical/resistomex_cohort_v2_10000.csv`.
- **Pre-Culture Feature Boundary**: The machine learning model will strictly train on columns 5–29, 30, and 61 (plus encoded comorbidity flags).
- **Leakage Prevention**: All post-prediction columns (31–60) are prohibited from the ML feature input matrix.
