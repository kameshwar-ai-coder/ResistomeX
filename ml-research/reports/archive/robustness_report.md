# ResistomeX Robustness, Missing Data & Stability Report

- **Input Perturbation (Noise $\pm 5\%$) Mean Delta**: 0.0108
- **Stability Status**: PASS
- **Missing Data Degradation Analysis**:
|   missing_fraction | missing_percentage   |   roc_auc |   pr_auc |
|-------------------:|:---------------------|----------:|---------:|
|                0   | 0%                   |    0.7012 |   0.7504 |
|                0.1 | 10%                  |    0.6978 |   0.7385 |
|                0.2 | 20%                  |    0.6676 |   0.7103 |
|                0.3 | 30%                  |    0.6873 |   0.7305 |
|                0.4 | 40%                  |    0.6697 |   0.7146 |

Plot generated: `plots/missingness_degradation.png`.
