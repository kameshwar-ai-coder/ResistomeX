# ResistomeX Clinical Dataset Generation Report (v2 — 10,000 Encounters)

**Dataset Name**: `resistomex_cohort_v2_10000.csv`  
**Dataset Version**: `cohort_v2_10000`  
**Random Seed**: `42`  
**Total Generated Encounters**: `10,000`  
**Total Columns**: `62` (Exact preservation of original schema and ordering)

---

## 1. Generation Methodology & Clinical Latent Risk Mechanism

The v2 generator replaces naive independent random distributions with an **epidemiologically grounded latent log-odds mechanism** incorporating:

1. **Prior Antimicrobial Pressure**:
   - 90-day exposure count (0 to 5) and exposure duration (0 to 28 days).
   - Higher weights assigned to repeated and prolonged broad-spectrum therapy (carbapenems, antipseudomonals).
2. **Prior Colonization & Infection History**:
   - Documented history of ESBL, MRSA, CRE, or MDR Pseudomonas significantly elevates resistance odds ($+1.35$ log-odds).
3. **Institutional & Unit-Specific Exposure**:
   - Ward endemic baseline rates (ICU: mean 42%, Surgical: 32%, General Medicine: 26%, Emergency: 18%).
   - Direct unit acuity adjustment ($+0.60$ log-odds for ICU placement).
4. **Host Vulnerability & Site of Infection**:
   - Immunosuppression, CKD, and AKI contribute to opportunistic and resistant colonization.
   - High-risk hospital-acquired sites (HAP, VAP, Catheter-associated bloodstream infections) carry elevated baseline resistance odds.
5. **Non-Deterministic Clinical Overlap**:
   - Stochastic noise term $\epsilon \sim \mathcal{N}(0, 0.65^2)$ ensures realistic clinical overlap:
     - Patients with prior antibiotic exposure do **not** deterministically develop AMR ($~25\%$ remain susceptible).
     - Patients without prior exposure can still acquire resistant community strains ($~18\%$ show resistance).

---

## 2. Cohort Summary & Class Distribution

| Cohort Breakdown | Count ($N$) | Percentage (%) |
|:---|:---:|:---:|
| **Total Encounters** | **10,000** | **100.0%** |
| Unique Patients | 8,500 | 85.0% (15% repeat encounters) |
| **Culture Status: Positive** | **4,791** | **47.9%** |
| - *Resistant Isolates (AMR Positive)* | 2,640 | 55.1% of positive cultures |
| - *Susceptible Isolates (None detected)* | 2,151 | 44.9% of positive cultures |
| Culture Status: Pending | 2,763 | 27.6% |
| Culture Status: No Growth | 1,426 | 14.3% |
| Culture Status: Contaminated | 519 | 5.2% |
| Culture Status: Unavailable / Not Collected | 501 | 5.0% |

---

## 3. Specific Phenotype Prevalence (Among Positive Resistant Cultures)

| Resistance Phenotype | Isolate Count | Proportion of Resistant Isolates |
|:---|:---:|:---:|
| **ESBL** (Extended-Spectrum $\beta$-Lactamase) | 916 | 34.7% |
| **MRSA** (Methicillin-Resistant *S. aureus*) | 569 | 21.6% |
| **Other MDR** (Multidrug-Resistant) | 560 | 21.2% |
| **MDR Pseudomonas** | 324 | 12.3% |
| **CRE** (Carbapenem-Resistant Enterobacterales) | 271 | 10.3% |
| **Total Resistant Isolates** | **2,640** | **100.0%** |

---

## 4. Zero Data Leakage Audit

- Pre-culture features (demographics, vitals, comorbidities, prior antibiotic history, ward endemic resistance) were strictly isolated from post-culture outcome labels.
- Verified that culture status, confirmed organism, AST phenotype, physician decision, and post-admission clinical outcomes were **not** accessible at prediction time.
