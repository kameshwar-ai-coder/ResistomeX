# ResistomeX Feature Engineering & Preprocessing Report

### Preprocessing Pipeline Architecture
- **Clinical Feature Derivations**:
  - `feat_shock_index`: Heart rate to systolic blood pressure ratio ($HR / SBP$).
  - `feat_map`: Mean arterial pressure ($DBP + \frac{1}{3}(SBP - DBP)$).
  - `feat_pulse_pressure`: Pulse pressure ($SBP - DBP$).
  - `feat_fever_gt38` & `feat_hypothermia_lt36`: Sepsis temperature dysregulation indicators.
  - `feat_prior_abx_ge2`: High-burden antimicrobial pressure flag.
  - `feat_prior_amr_history`: Binary colonization history flag.
- **Numeric Scaling**: Median imputation + StandardScaler (fitted strictly on training folds).
- **Categorical Encoding**: Missing-constant imputation + OneHotEncoder (`handle_unknown='ignore'`).
- **Multi-value Comorbidities**: Custom multi-hot regex parser (`ComorbiditiesEncoder`).
- **Total Transformed Dimensionality**: 123 features.
