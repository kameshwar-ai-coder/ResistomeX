# ResistomeX Subgroup Performance & Fairness Analysis

Stratified evaluation across demographics, ward acuity, infection source, and prior exposure:

| subgroup_category        | subgroup_value                  |   sample_size |   positive_count |   prevalence |   roc_auc |   pr_auc |   sensitivity |   specificity |   ppv |   npv |    f1 |   brier_score |
|:-------------------------|:--------------------------------|--------------:|-----------------:|-------------:|----------:|---------:|--------------:|--------------:|------:|------:|------:|--------------:|
| Age Group                | 40-65 yrs                       |           369 |              209 |        0.566 |     0.671 |    0.753 |         0.603 |         0.662 | 0.7   | 0.561 | 0.648 |        0.2299 |
| Age Group                | >65 yrs                         |           263 |              150 |        0.57  |     0.723 |    0.766 |         0.747 |         0.575 | 0.7   | 0.631 | 0.723 |        0.2103 |
| Age Group                | <40 yrs                         |            92 |               41 |        0.446 |     0.75  |    0.697 |         0.61  |         0.765 | 0.676 | 0.709 | 0.641 |        0.2053 |
| Sex                      | Male                            |           364 |              199 |        0.547 |     0.674 |    0.737 |         0.648 |         0.606 | 0.665 | 0.588 | 0.656 |        0.2268 |
| Sex                      | Female                          |           360 |              201 |        0.558 |     0.728 |    0.765 |         0.667 |         0.692 | 0.732 | 0.621 | 0.698 |        0.2124 |
| Ward                     | Emergency Department            |            95 |               42 |        0.442 |     0.662 |    0.63  |         0.476 |         0.736 | 0.588 | 0.639 | 0.526 |        0.2293 |
| Ward                     | ICU                             |           142 |               89 |        0.627 |     0.686 |    0.786 |         0.82  |         0.321 | 0.67  | 0.515 | 0.737 |        0.211  |
| Ward                     | Surgical Ward                   |           166 |              107 |        0.645 |     0.705 |    0.815 |         0.729 |         0.627 | 0.78  | 0.561 | 0.754 |        0.2145 |
| Ward                     | General Medicine                |           321 |              162 |        0.505 |     0.69  |    0.717 |         0.568 |         0.736 | 0.687 | 0.626 | 0.622 |        0.2233 |
| Infection Source         | Hospital-Acquired Pneumonia     |            86 |               58 |        0.674 |     0.748 |    0.865 |         0.741 |         0.679 | 0.827 | 0.559 | 0.782 |        0.2009 |
| Infection Source         | Intra-abdominal Infection       |           183 |               94 |        0.514 |     0.617 |    0.637 |         0.617 |         0.562 | 0.598 | 0.581 | 0.607 |        0.2449 |
| Infection Source         | Urinary Tract Infection         |           146 |               75 |        0.514 |     0.771 |    0.812 |         0.627 |         0.789 | 0.758 | 0.667 | 0.686 |        0.1979 |
| Infection Source         | Surgical Site Infection         |            35 |               20 |        0.571 |     0.65  |    0.766 |         0.65  |         0.533 | 0.65  | 0.533 | 0.65  |        0.2346 |
| Infection Source         | Community-Acquired Pneumonia    |           122 |               69 |        0.566 |     0.638 |    0.708 |         0.652 |         0.566 | 0.662 | 0.556 | 0.657 |        0.2388 |
| Infection Source         | Bloodstream Infection           |            43 |               21 |        0.488 |     0.645 |    0.633 |         0.571 |         0.545 | 0.545 | 0.571 | 0.558 |        0.2383 |
| Infection Source         | Ventilator-Associated Pneumonia |            71 |               44 |        0.62  |     0.774 |    0.866 |         0.705 |         0.704 | 0.795 | 0.594 | 0.747 |        0.1934 |
| Infection Source         | Skin/Soft Tissue Infection      |            38 |               19 |        0.5   |     0.845 |    0.873 |         0.737 |         0.842 | 0.824 | 0.762 | 0.778 |        0.177  |
| Kidney Function          | Normal                          |           420 |              245 |        0.583 |     0.708 |    0.78  |         0.653 |         0.686 | 0.744 | 0.585 | 0.696 |        0.2182 |
| Kidney Function          | Severe impairment               |            28 |               19 |        0.679 |     0.906 |    0.963 |         0.895 |         0.556 | 0.81  | 0.714 | 0.85  |        0.1581 |
| Kidney Function          | AKI                             |            42 |               24 |        0.571 |     0.674 |    0.752 |         0.625 |         0.611 | 0.682 | 0.55  | 0.652 |        0.2273 |
| Kidney Function          | Mild impairment                 |           135 |               61 |        0.452 |     0.653 |    0.65  |         0.623 |         0.608 | 0.567 | 0.662 | 0.594 |        0.2317 |
| Kidney Function          | Moderate impairment             |            91 |               48 |        0.527 |     0.685 |    0.691 |         0.667 |         0.581 | 0.64  | 0.61  | 0.653 |        0.224  |
| Prior Antibiotics        | No Prior Abx                    |           352 |              161 |        0.457 |     0.613 |    0.549 |         0.422 |         0.743 | 0.581 | 0.604 | 0.489 |        0.2465 |
| Prior Antibiotics        | Prior Abx (>=1)                 |           372 |              239 |        0.642 |     0.747 |    0.84  |         0.816 |         0.511 | 0.75  | 0.607 | 0.782 |        0.1943 |
| Prior Resistance History | No Prior Resistant History      |           521 |              248 |        0.476 |     0.648 |    0.639 |         0.468 |         0.751 | 0.63  | 0.608 | 0.537 |        0.2344 |
| Prior Resistance History | Has Prior Resistance            |           203 |              152 |        0.749 |     0.653 |    0.852 |         0.967 |         0.098 | 0.762 | 0.5   | 0.852 |        0.1817 |

Plot generated: `plots/subgroup_performance.png`.
