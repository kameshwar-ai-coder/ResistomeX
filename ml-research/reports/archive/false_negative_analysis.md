# ResistomeX False-Negative Clinical Analysis (Missed Resistance)

**Total Evaluated Test Cases**: 724
**Total False Negatives (Type II Errors)**: 137 (18.9%)

### Clinical Characterization of False Negatives

False negatives occur when a patient with a confirmed resistant isolate is predicted as low risk by the model.

#### Recurring Patterns Identified:
1. **Absence of Documented Prior Antibiotics**: Patients admitted from the community with 0 recorded 90-day prior exposures who acquired resistant organisms (e.g. community-acquired ESBL *E. coli*).
2. **Atypical/Subclinical Vitals**: Patients presenting with normal baseline body temperature or pulse despite resistant bacteremia.
3. **Non-ICU Ward Placement**: Encounters admitted to lower-endemic wards where baseline environmental prevalence is lower.

### Sample False-Negative Cases

| patient_id   | encounter_id   | ward                 | infection_source                |   prior_antibiotic_exposure_count_90d | prior_resistant_organism   |   predicted_probability | resistance_phenotype   |
|:-------------|:---------------|:---------------------|:--------------------------------|--------------------------------------:|:---------------------------|------------------------:|:-----------------------|
| PX-100038    | ENC-20250038   | General Medicine     | Hospital-Acquired Pneumonia     |                                     0 | None known                 |                0.296867 | CRE                    |
| PX-100084    | ENC-20250084   | Surgical Ward        | Intra-abdominal Infection       |                                     1 | None known                 |                0.355527 | ESBL                   |
| PX-100358    | ENC-20250358   | Surgical Ward        | Intra-abdominal Infection       |                                     0 | None known                 |                0.422528 | MDR Pseudomonas        |
| PX-100394    | ENC-20250394   | Emergency Department | Community-Acquired Pneumonia    |                                     0 | None known                 |                0.237093 | ESBL                   |
| PX-100427    | ENC-20250427   | General Medicine     | Ventilator-Associated Pneumonia |                                     0 | None known                 |                0.279627 | MDR Pseudomonas        |
| PX-100461    | ENC-20250461   | General Medicine     | Hospital-Acquired Pneumonia     |                                     0 | None known                 |                0.3057   | CRE                    |
| PX-100528    | ENC-20250528   | General Medicine     | Intra-abdominal Infection       |                                     0 | None known                 |                0.209123 | ESBL                   |
| PX-100541    | ENC-20250541   | General Medicine     | Community-Acquired Pneumonia    |                                     0 | None known                 |                0.289818 | ESBL                   |
| PX-100620    | ENC-20250620   | Emergency Department | Community-Acquired Pneumonia    |                                     0 | None known                 |                0.226193 | ESBL                   |
| PX-100767    | ENC-20250767   | General Medicine     | Surgical Site Infection         |                                     1 | None known                 |                0.408454 | ESBL                   |
