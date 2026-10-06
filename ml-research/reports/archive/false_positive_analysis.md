# ResistomeX False-Positive Clinical Analysis (Unnecessary Escalation Risk)

**Total Evaluated Test Cases**: 724
**Total False Positives (Type I Errors)**: 114 (15.7%)

### Clinical Characterization of False Positives

False positives occur when the model predicts high AMR risk, but the culture demonstrates a fully susceptible wild-type pathogen (`None detected`).

#### Recurring Drivers of Overestimation:
1. **Heavy Prior Antibiotic History**: Patients with $\ge 3$ prior antibiotic courses who nonetheless harbored a susceptible isolate.
2. **High Ward Endemic Resistance**: Encounters in high-acuity ICUs where ward-level prevalence drives up baseline probability.
3. **Severe Inflammatory Markers**: Extreme CRP ($>150$ mg/L) and tachycardia which signal sepsis severity rather than microbiological resistance specifically.

### Sample False-Positive Cases

| patient_id   | encounter_id   | ward                 | infection_source                |   prior_antibiotic_exposure_count_90d |   predicted_probability | resistance_phenotype   |
|:-------------|:---------------|:---------------------|:--------------------------------|--------------------------------------:|------------------------:|:-----------------------|
| PX-100030    | ENC-20250030   | Surgical Ward        | Intra-abdominal Infection       |                                     3 |                0.574209 | None detected          |
| PX-100181    | ENC-20250181   | ICU                  | Intra-abdominal Infection       |                                     0 |                0.541794 | None detected          |
| PX-100251    | ENC-20250251   | General Medicine     | Intra-abdominal Infection       |                                     2 |                0.518856 | None detected          |
| PX-100292    | ENC-20250292   | General Medicine     | Intra-abdominal Infection       |                                     0 |                0.61142  | None detected          |
| PX-100334    | ENC-20250334   | General Medicine     | Ventilator-Associated Pneumonia |                                     2 |                0.545864 | None detected          |
| PX-100587    | ENC-20250587   | ICU                  | Surgical Site Infection         |                                     0 |                0.573127 | None detected          |
| PX-100619    | ENC-20250619   | ICU                  | Surgical Site Infection         |                                     1 |                0.724477 | None detected          |
| PX-100719    | ENC-20250719   | ICU                  | Bloodstream Infection           |                                     0 |                0.86014  | None detected          |
| PX-100735    | ENC-20250735   | General Medicine     | Community-Acquired Pneumonia    |                                     0 |                0.630314 | None detected          |
| PX-100814    | ENC-20250814   | Emergency Department | Community-Acquired Pneumonia    |                                     2 |                0.625016 | None detected          |
