# ResistomeX Before vs After Pipeline & Dataset Comparison

| Metric / Dimension | Old Pipeline (1,000 Encounters) | Improved Pipeline (10,000 Encounters) |
|:---|:---:|:---:|
| **Dataset Size** | 1,000 total (454 evaluable) | 10,000 total (4791 evaluable) |
| **Test Cohort Size** | 69 encounters | 724 encounters |
| **Test ROC-AUC** | 0.538 (95% CI: 0.406 - 0.669) | **0.695** (95% CI: 0.660 - 0.731) |
| **Test PR-AUC** | 0.575 (95% CI: 0.433 - 0.747) | **0.726** (95% CI: 0.689 - 0.771) |
| **Test Sensitivity (0.50)** | 60.0% | **75.2%** |
| **Test Specificity (0.50)** | 47.1% | **50.0%** |
| **Test F1 Score (0.50)** | 0.568 | **0.698** |
| **Brier Score (Calibrated)** | 0.258 | **0.2205** |
| **Expected Calibration Error** | 0.089 | **0.0371** |
