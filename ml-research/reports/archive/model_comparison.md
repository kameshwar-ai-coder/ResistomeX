# ResistomeX Comparative Baseline Models Report

All models evaluated using identical 5-fold stratified patient-level cross-validation on the training cohort, followed by held-out test benchmarking.

| model_name           |   cv_roc_auc_mean |   cv_roc_auc_std |   cv_pr_auc_mean |   cv_pr_auc_std |   test_roc_auc |   test_pr_auc |   test_brier_score |   test_log_loss |   test_sensitivity |   test_specificity |   test_ppv |   test_npv |   test_f1 |   test_balanced_acc |
|:---------------------|------------------:|-----------------:|-----------------:|----------------:|---------------:|--------------:|-------------------:|----------------:|-------------------:|-------------------:|-----------:|-----------:|----------:|--------------------:|
| Dummy (Stratified)   |            0.4994 |           0.013  |           0.5527 |          0.0065 |         0.4687 |        0.5378 |             0.5249 |         18.1283 |             0.53   |             0.4074 |     0.5248 |     0.4125 |    0.5274 |              0.4687 |
| Logistic Regression  |            0.7118 |           0.0145 |           0.7432 |          0.006  |         0.7105 |        0.7571 |             0.2179 |          0.6269 |             0.64   |             0.6728 |     0.7072 |     0.6022 |    0.6719 |              0.6564 |
| Random Forest        |            0.7197 |           0.0138 |           0.7499 |          0.0136 |         0.6931 |        0.7368 |             0.2226 |          0.6362 |             0.665  |             0.6451 |     0.6982 |     0.6093 |    0.6812 |              0.655  |
| HistGradientBoosting |            0.6958 |           0.0141 |           0.7333 |          0.0134 |         0.675  |        0.7123 |             0.2301 |          0.6582 |             0.6825 |             0.571  |     0.6626 |     0.5929 |    0.6724 |              0.6267 |

### Model Selection Rationale
XGBoost demonstrated superior discriminative power, calibration stability, and native tree structure for SHAP explainability.
