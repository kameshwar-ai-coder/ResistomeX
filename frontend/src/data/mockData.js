// ResistomeX Mock Clinical Dataset

export const INITIAL_PATIENTS = [
  {
    id: "P-72309",
    mrn: "MRN-72309",
    name: "David Sterling",
    age: 74,
    gender: "Male",
    bed: "ICU Bed 12",
    ward: "ICU",
    admissionDate: "2026-09-22",
    dischargeDate: null,
    admissionStatus: "Admitted",
    outcomeNotes: "Active Inpatient under antimicrobial stewardship surveillance.",
    primaryDiagnosis: "Severe Sepsis secondary to Complicated Urinary Tract Infection",
    infectionSource: "Urine / Blood",
    suspectedPathogen: "ESBL-producing Gram-negative Bacilli (E. coli / Klebsiella)",
    attendingDoctor: "Dr. Marcus Vance, MD",
    assignedNurse: "RN Sarah Jenkins",
    amrRiskLevel: "High",
    amrRiskScore: 88,
    status: "Priority Review",
    vitals: {
      temp: "38.9 °C",
      hr: "112 bpm",
      bp: "95/62 mmHg",
      spo2: "94%",
      wbc: "18.4 x10³/µL",
      crp: "142 mg/L",
      lactate: "3.2 mmol/L",
      updatedAt: "10 mins ago"
    },
    history: {
      comorbidities: ["Type 2 Diabetes Mellitus", "Chronic Kidney Disease Stage 3b", "Benign Prostatic Hyperplasia"],
      priorAntibiotics90Days: [
        { name: "Ceftriaxone 1g IV", duration: "7 days", timing: "14 days ago", reason: "Suspected Pyelonephritis" },
        { name: "Ciprofloxacin 500mg PO", duration: "5 days", timing: "45 days ago", reason: "Outpatient UTI" }
      ],
      priorCultures12Months: [
        { date: "2026-03-14", organism: "Klebsiella pneumoniae", resistance: "ESBL Positive (Ceftriaxone-R, Ciprofloxacin-R)", source: "Urine" }
      ],
      allergies: [
        { allergen: "Penicillin", reaction: "Severe Anaphylaxis (Laryngeal Edema)", severity: "High" }
      ],
      unitResistanceRate: "34.2% Gram-Negative ESBL Rate in ICU Ward 22"
    },
    shapFeatures: [
      { feature: "Prior 30d Broad-Spectrum Antibiotic Exposure", impact: 0.32, description: "Ceftriaxone & Ciprofloxacin exposure in last 45 days increases risk score" },
      { feature: "Previous Culture Positive for ESBL Organism", impact: 0.28, description: "K. pneumoniae ESBL (+) in urine 6 months ago" },
      { feature: "ICU Ward 22 Local Resistance Pattern (34.2%)", impact: 0.14, description: "High local endemic rate of ESBL Enterobacterales" },
      { feature: "Age ≥ 70 with CKD Stage 3b", impact: 0.09, description: "Altered pharmacokinetics & frequent healthcare contact" },
      { feature: "Lack of Recent Surgical Intervention", impact: -0.05, description: "Slight reduction due to non-surgical origin" }
    ],
    treatmentSupport: {
      empiricOptions: [
        {
          id: "opt-1",
          name: "Meropenem",
          dose: "1g IV q8h (Adjusted for CrCl 38 mL/min: 500mg IV q8h)",
          coverageScore: 96,
          rationale: "Excellent coverage against ESBL-producing E. coli and K. pneumoniae; safe with Penicillin allergy (cross-reactivity < 1%).",
          isFirstLine: true,
          warnings: ["Renal dose adjustment required", "Monitor renal function daily"]
        },
        {
          id: "opt-2",
          name: "Eravacycline",
          dose: "1mg/kg IV q12h",
          coverageScore: 91,
          rationale: "Novel synthetic fluorocycline effective against ESBL and CRE strains. No renal adjustment needed.",
          isFirstLine: false,
          warnings: ["Higher cost", "Non-penicillin alternative"]
        },
        {
          id: "opt-3",
          name: "Piperacillin-Tazobactam",
          dose: "4.5g IV q6h",
          coverageScore: 42,
          rationale: "NOT RECOMMENDED for high-risk ESBL bacteremia / sepsis due to inoculum effect and high risk of clinical failure.",
          isFirstLine: false,
          warnings: ["HIGH RISK OF TREATMENT FAILURE", "Contraindicated by penicillin allergy"]
        }
      ]
    },
    decisionLog: {
      status: "Accepted",
      chosenOption: "Meropenem 500mg IV q8h",
      rationale: "Accepted AI empiric recommendation for high-risk ESBL sepsis in patient with prior ESBL colonization and penicillin anaphylaxis.",
      decidedBy: "Dr. Marcus Vance, MD",
      decidedAt: "2026-09-25 09:15 AM"
    },
    cultureResult: {
      status: "Completed (Lab Verified)",
      specimen: "Blood Culture x2 Sets",
      collectedDate: "2026-09-24 14:00",
      resultDate: "2026-09-25 08:30",
      organism: "Escherichia coli (ESBL Producer)",
      aiPredictionMatch: "100% Match (High Risk ESBL predicted)",
      sensitivities: [
        { antibiotic: "Ampicillin", result: "Resistant", mic: ">32 µg/mL" },
        { antibiotic: "Ceftriaxone", result: "Resistant", mic: ">64 µg/mL" },
        { antibiotic: "Cefepime", result: "Resistant", mic: "32 µg/mL" },
        { antibiotic: "Ciprofloxacin", result: "Resistant", mic: ">4 µg/mL" },
        { antibiotic: "Piperacillin-Tazobactam", result: "Intermediate", mic: "16/4 µg/mL" },
        { antibiotic: "Meropenem", result: "Susceptible", mic: "0.25 µg/mL" },
        { antibiotic: "Amikacin", result: "Susceptible", mic: "2 µg/mL" },
        { antibiotic: "Eravacycline", result: "Susceptible", mic: "0.5 µg/mL" }
      ]
    },
    monitoringTimeline: [
      { time: "Day 1 - Admission", temp: 39.1, hr: 118, bp: "90/58", crp: 158, status: "Critical - High AMR Sepsis" },
      { time: "Day 1 - Post Empiric Meropenem", temp: 38.4, hr: 104, bp: "105/65", crp: 142, status: "Stabilizing" },
      { time: "Day 2 - Morning", temp: 37.8, hr: 92, bp: "118/72", crp: 110, status: "Improving" },
      { time: "Day 2 - Evening", temp: 37.3, hr: 84, bp: "122/76", crp: 82, status: "Stable Response" }
    ]
  },
  {
    id: "P-58412",
    mrn: "MRN-58412",
    name: "Maria Santos",
    age: 62,
    gender: "Female",
    bed: "Ward 22 Bed 04",
    ward: "General Medical Ward",
    admissionDate: "2026-09-23",
    dischargeDate: null,
    admissionStatus: "Admitted",
    outcomeNotes: "Active Inpatient responding well to Ceftriaxone regimen.",
    primaryDiagnosis: "Community-Acquired Pneumonia (CAP)",
    infectionSource: "Lungs / Sputum",
    suspectedPathogen: "Streptococcus pneumoniae / Methicillin-Susceptible S. aureus",
    attendingDoctor: "Dr. Marcus Vance, MD",
    assignedNurse: "RN Sarah Jenkins",
    amrRiskLevel: "Low",
    amrRiskScore: 18,
    status: "Stable",
    vitals: {
      temp: "37.4 °C",
      hr: "78 bpm",
      bp: "124/78 mmHg",
      spo2: "97%",
      wbc: "9.2 x10³/µL",
      crp: "28 mg/L",
      lactate: "1.1 mmol/L",
      updatedAt: "25 mins ago"
    },
    history: {
      comorbidities: ["Essential Hypertension"],
      priorAntibiotics90Days: [],
      priorCultures12Months: [],
      allergies: [],
      unitResistanceRate: "12.1% Low AMR Rate in General Ward"
    },
    shapFeatures: [
      { feature: "No Antibiotic Exposure in Past 90 Days", impact: -0.28, description: "Clean history lowers resistance probability" },
      { feature: "Community Acquired Setting", impact: -0.22, description: "Low probability of hospital-acquired MDRO" },
      { feature: "Age < 65 without Chronic Lung Disease", impact: -0.10, description: "Low baseline vulnerability" },
      { feature: "Mild Leukocytosis", impact: 0.05, description: "Active infection marker" }
    ],
    treatmentSupport: {
      empiricOptions: [
        {
          id: "opt-1",
          name: "Ceftriaxone + Azithromycin",
          dose: "Ceftriaxone 1g IV q24h + Azithromycin 500mg PO q24h",
          coverageScore: 94,
          rationale: "Standard high-efficacy empiric coverage for Moderate CAP in low AMR risk patients.",
          isFirstLine: true,
          warnings: ["Monitor QTc interval with Azithromycin"]
        },
        {
          id: "opt-2",
          name: "Levofloxacin",
          dose: "750mg IV/PO q24h",
          coverageScore: 89,
          rationale: "Respiratory fluoroquinolone monotherapy option.",
          isFirstLine: false,
          warnings: ["Reserve fluoroquinolones to preserve susceptibility"]
        }
      ]
    },
    decisionLog: {
      status: "Accepted",
      chosenOption: "Ceftriaxone 1g IV q24h + Azithromycin 500mg PO q24h",
      rationale: "Standard CAP protocol for low AMR risk patient.",
      decidedBy: "Dr. Marcus Vance, MD",
      decidedAt: "2026-09-23 11:30 AM"
    },
    cultureResult: {
      status: "Completed",
      specimen: "Sputum Culture",
      collectedDate: "2026-09-23 09:00",
      resultDate: "2026-09-24 16:00",
      organism: "Streptococcus pneumoniae (Pan-Susceptible)",
      aiPredictionMatch: "100% Match (Low AMR predicted)",
      sensitivities: [
        { antibiotic: "Penicillin V", result: "Susceptible", mic: "0.03 µg/mL" },
        { antibiotic: "Ceftriaxone", result: "Susceptible", mic: "0.12 µg/mL" },
        { antibiotic: "Azithromycin", result: "Susceptible", mic: "0.25 µg/mL" },
        { antibiotic: "Levofloxacin", result: "Susceptible", mic: "0.5 µg/mL" }
      ]
    },
    monitoringTimeline: [
      { time: "Day 1 - Admission", temp: 38.6, hr: 96, bp: "130/82", crp: 74, status: "Febrile CAP" },
      { time: "Day 2 - Morning", temp: 37.6, hr: 82, bp: "126/80", crp: 42, status: "Improving" },
      { time: "Day 3 - Today", temp: 37.1, hr: 76, bp: "122/76", crp: 22, status: "Resolving" }
    ]
  },
  {
    id: "P-84901",
    mrn: "MRN-84901",
    name: "Arthur Pendelton",
    age: 68,
    gender: "Male",
    bed: "ICU Bed 08",
    ward: "ICU",
    admissionDate: "2026-09-21",
    dischargeDate: null,
    admissionStatus: "Admitted",
    outcomeNotes: "Active Inpatient under critical care in ICU.",
    primaryDiagnosis: "Ventilator-Associated Pneumonia (VAP) with Septic Shock",
    infectionSource: "Endotracheal Aspirate / Lungs",
    suspectedPathogen: "Carbapenem-Resistant Pseudomonas aeruginosa / CRE",
    attendingDoctor: "Dr. Marcus Vance, MD",
    assignedNurse: "RN Sarah Jenkins",
    amrRiskLevel: "High",
    amrRiskScore: 94,
    status: "High Alert",
    vitals: {
      temp: "39.4 °C",
      hr: "124 bpm",
      bp: "88/54 mmHg",
      spo2: "91%",
      wbc: "22.1 x10³/µL",
      crp: "210 mg/L",
      lactate: "4.5 mmol/L",
      updatedAt: "5 mins ago"
    },
    history: {
      comorbidities: ["COPD Severe", "Tracheostomy", "Long-term Care Facility Resident"],
      priorAntibiotics90Days: [
        { name: "Meropenem 1g IV", duration: "10 days", timing: "20 days ago", reason: "Hospital Acquired Pneumonia" },
        { name: "Vancomycin 1.5g IV", duration: "7 days", timing: "20 days ago", reason: "Empiric MRSA" },
        { name: "Piperacillin-Tazobactam", duration: "14 days", timing: "60 days ago", reason: "Aspiration Pneumonia" }
      ],
      priorCultures12Months: [
        { date: "2026-08-10", organism: "Pseudomonas aeruginosa", resistance: "MDR (Carbapenem-Resistant, Ceftazidime-R)", source: "Sputum" }
      ],
      allergies: [
        { allergen: "Sulfa Drugs", reaction: "Rash", severity: "Moderate" }
      ],
      unitResistanceRate: "41.5% Pseudomonas Carbapenem Resistance in ICU"
    },
    shapFeatures: [
      { feature: "Prior Exposure to Meropenem within 30 days", impact: 0.38, description: "Direct selective pressure for carbapenemase production" },
      { feature: "Long-term Mechanically Ventilated & Tracheostomy", impact: 0.29, description: "High risk of persistent biofilms & MDR colonization" },
      { feature: "Previous Culture MDR Pseudomonas aeruginosa", impact: 0.24, description: "Known past colonization with resistant strain" },
      { feature: "Resided in Nursing Home / LTCF", impact: 0.12, description: "Healthcare facility transmission risk" }
    ],
    treatmentSupport: {
      empiricOptions: [
        {
          id: "opt-1",
          name: "Ceftolozane-Tazobactam + Tobramycin",
          dose: "Ceftolozane-tazobactam 3g IV q8h + Tobramycin 7mg/kg IV q24h",
          coverageScore: 92,
          rationale: "Potent anti-pseudomonal combination specifically designed for MDR/XDR Pseudomonas strains resistant to traditional carbapenems.",
          isFirstLine: true,
          warnings: ["Monitor aminoglycoside peak/trough levels and renal function"]
        },
        {
          id: "opt-2",
          name: "Ceftazidime-Avibactam",
          dose: "2.5g IV q8h",
          coverageScore: 87,
          rationale: "Broad coverage including KPC and OXA-48 carbapenemases.",
          isFirstLine: false,
          warnings: ["Check strain specific carbapenemase class if available"]
        }
      ]
    },
    decisionLog: {
      status: "Accepted",
      chosenOption: "Ceftolozane-Tazobactam 3g IV q8h + Tobramycin",
      rationale: "MDR Pseudomonas coverage initiated immediately based on high AMR risk assessment and septic shock presentation.",
      decidedBy: "Dr. Marcus Vance, MD",
      decidedAt: "2026-09-24 08:00 AM"
    },
    cultureResult: {
      status: "Pending Final Identification",
      specimen: "Endotracheal Aspirate",
      collectedDate: "2026-09-24 07:00",
      resultDate: "Pending (Est. in 6 hours)",
      organism: "Gram-Negative Bacilli growing (Heavy growth)",
      aiPredictionMatch: "Pending Validation",
      sensitivities: []
    },
    monitoringTimeline: [
      { time: "Day 1", temp: 39.4, hr: 124, bp: "88/54", crp: 210, status: "Critical Shock" },
      { time: "Day 2", temp: 38.6, hr: 110, bp: "100/62", crp: 180, status: "Vasopressor Dependent" }
    ]
  },
  {
    id: "P-39102",
    mrn: "MRN-39102",
    name: "Evelyn Vance",
    age: 55,
    gender: "Female",
    bed: "Surgical Ward Bed 18",
    ward: "Surgical Ward",
    admissionDate: "2026-09-24",
    dischargeDate: null,
    admissionStatus: "Admitted",
    outcomeNotes: "Active Inpatient under surgical wound evaluation.",
    primaryDiagnosis: "Post-Operative Surgical Site Infection (Post Hemicolectomy)",
    infectionSource: "Wound Drainage / Abdomen",
    suspectedPathogen: "Enterococcus faecalis / MRSA / Enterobacterales",
    attendingDoctor: "Dr. Marcus Vance, MD",
    assignedNurse: "RN Sarah Jenkins",
    amrRiskLevel: "Medium",
    amrRiskScore: 54,
    status: "Review Needed",
    vitals: {
      temp: "38.2 °C",
      hr: "90 bpm",
      bp: "115/74 mmHg",
      spo2: "96%",
      wbc: "13.8 x10³/µL",
      crp: "88 mg/L",
      lactate: "1.8 mmol/L",
      updatedAt: "40 mins ago"
    },
    history: {
      comorbidities: ["Obesity Class II", "Post-op Day 4 Hemicolectomy"],
      priorAntibiotics90Days: [
        { name: "Cefazolin 2g IV", duration: "1 dose", timing: "4 days ago", reason: "Surgical Prophylaxis" }
      ],
      priorCultures12Months: [],
      allergies: [],
      unitResistanceRate: "22.8% Surgical Ward MRSA / Ampicillin-R Enterococcus Rate"
    },
    shapFeatures: [
      { feature: "Recent Abdominal Surgery & Hospitalization (4 days)", impact: 0.22, description: "Nosocomial wound exposure" },
      { feature: "Surgical Ward Endemic MRSA / Enterococcal Rate", impact: 0.18, description: "Moderate unit risk for Gram-positive resistance" },
      { feature: "Single Dose Surgical Prophylaxis Only", impact: -0.15, description: "No prolonged prior antibiotic pressure" }
    ],
    treatmentSupport: {
      empiricOptions: [
        {
          id: "opt-1",
          name: "Piperacillin-Tazobactam + Vancomycin",
          dose: "Pip-tazo 4.5g IV q6h + Vancomycin 15mg/kg IV q12h",
          coverageScore: 93,
          rationale: "Empiric polymicrobial coverage for deep intra-abdominal surgical wound infection covering anaerobes, Gram-negatives, and MRSA.",
          isFirstLine: true,
          warnings: ["Monitor Vancomycin trough levels (Target 15-20 mcg/mL)"]
        }
      ]
    },
    decisionLog: {
      status: "Pending Review",
      chosenOption: "",
      rationale: "",
      decidedBy: "",
      decidedAt: ""
    },
    cultureResult: {
      status: "In Progress",
      specimen: "Wound Swab Culture",
      collectedDate: "2026-09-24 18:00",
      resultDate: "Pending (Est. in 18 hours)",
      organism: "Gram-positive cocci in clusters & Gram-negative rods seen on Gram Stain",
      aiPredictionMatch: "Pending",
      sensitivities: []
    },
    monitoringTimeline: [
      { time: "Day 1 Post-Op", temp: 37.2, hr: 78, bp: "120/78", crp: 45, status: "Normal Recovery" },
      { time: "Day 4 Today", temp: 38.2, hr: 90, bp: "115/74", crp: 88, status: "Wound Erythema & Purulence" }
    ]
  },
  {
    id: "P-91204",
    mrn: "MRN-91204",
    name: "Robert Chen",
    age: 71,
    gender: "Male",
    bed: "Discharged (ICU)",
    ward: "ICU Ward 22",
    admissionDate: "2026-08-10",
    dischargeDate: "2026-08-28",
    admissionStatus: "Recovered & Discharged",
    outcomeNotes: "Fully Recovered. Successfully completed 14-day IV Meropenem course for ESBL Klebsiella sepsis.",
    primaryDiagnosis: "Severe Urosepsis secondary to ESBL K. pneumoniae",
    infectionSource: "Bloodstream / Sepsis",
    suspectedPathogen: "ESBL-producing Klebsiella pneumoniae",
    attendingDoctor: "Dr. Marcus Vance, MD",
    assignedNurse: "RN Sarah Jenkins",
    amrRiskLevel: "High",
    amrRiskScore: 82,
    status: "Cured & Discharged",
    vitals: {
      temp: "36.6 °C",
      hr: "72 bpm",
      bp: "120/78 mmHg",
      spo2: "99%",
      wbc: "6.4 x10³/µL",
      crp: "4 mg/L",
      lactate: "0.8 mmol/L",
      updatedAt: "Discharged Aug 28"
    },
    history: {
      comorbidities: ["Type 2 Diabetes"],
      priorAntibiotics90Days: [],
      priorCultures12Months: [],
      allergies: [],
      unitResistanceRate: "34.2% Ward Resistance Rate"
    },
    shapFeatures: [],
    treatmentSupport: { empiricOptions: [] },
    decisionLog: { status: "Accepted", chosenOption: "Meropenem 1g IV q8h", rationale: "Targeted ESBL eradication", decidedBy: "Dr. Marcus Vance, MD", decidedAt: "2026-08-11" },
    cultureResult: { status: "Completed (Lab Verified)", specimen: "Blood Culture", organism: "Klebsiella pneumoniae (ESBL+)", sensitivities: [] },
    monitoringTimeline: []
  },
  {
    id: "P-83921",
    mrn: "MRN-83921",
    name: "Eleanor Rigby",
    age: 65,
    gender: "Female",
    bed: "Discharged (Ward 22)",
    ward: "General Medical Ward",
    admissionDate: "2026-08-01",
    dischargeDate: "2026-08-15",
    admissionStatus: "Recovered & Discharged",
    outcomeNotes: "Recovered. Step-down from IV Ceftriaxone to Oral Fosfomycin for CAUTI.",
    primaryDiagnosis: "Complicated Catheter-Associated Urinary Tract Infection",
    infectionSource: "Urinary Tract (CAUTI)",
    suspectedPathogen: "Escherichia coli (Multi-drug Resistant)",
    attendingDoctor: "Dr. Marcus Vance, MD",
    assignedNurse: "RN Sarah Jenkins",
    amrRiskLevel: "Medium",
    amrRiskScore: 58,
    status: "Cured & Discharged",
    vitals: {
      temp: "36.8 °C",
      hr: "70 bpm",
      bp: "118/74 mmHg",
      spo2: "98%",
      wbc: "5.8 x10³/µL",
      crp: "6 mg/L",
      lactate: "0.9 mmol/L",
      updatedAt: "Discharged Aug 15"
    },
    history: {
      comorbidities: ["Neurogenic Bladder"],
      priorAntibiotics90Days: [],
      priorCultures12Months: [],
      allergies: [],
      unitResistanceRate: "18.2% Ward Resistance Rate"
    },
    shapFeatures: [],
    treatmentSupport: { empiricOptions: [] },
    decisionLog: { status: "Accepted", chosenOption: "Oral Fosfomycin Trometamol 3g", rationale: "OPAT step-down therapy", decidedBy: "Dr. Marcus Vance, MD", decidedAt: "2026-08-02" },
    cultureResult: { status: "Completed", specimen: "Urine Culture", organism: "Escherichia coli", sensitivities: [] },
    monitoringTimeline: []
  },
  {
    id: "P-77310",
    mrn: "MRN-77310",
    name: "James O'Connor",
    age: 59,
    gender: "Male",
    bed: "Discharged (Surgical)",
    ward: "Surgical Ward",
    admissionDate: "2026-07-15",
    dischargeDate: "2026-08-02",
    admissionStatus: "Recovered & Discharged",
    outcomeNotes: "Recovered. Surgical debridement + IV Vancomycin targeted MRSA clearance.",
    primaryDiagnosis: "Surgical Site Wound Infection following Orthopedic Procedure",
    infectionSource: "Wound Drainage / Abdomen",
    suspectedPathogen: "Methicillin-Resistant Staphylococcus aureus (MRSA)",
    attendingDoctor: "Dr. Marcus Vance, MD",
    assignedNurse: "RN Sarah Jenkins",
    amrRiskLevel: "High",
    amrRiskScore: 78,
    status: "Cured & Discharged",
    vitals: {
      temp: "36.7 °C",
      hr: "74 bpm",
      bp: "122/80 mmHg",
      spo2: "99%",
      wbc: "7.1 x10³/µL",
      crp: "8 mg/L",
      lactate: "1.0 mmol/L",
      updatedAt: "Discharged Aug 02"
    },
    history: { comorbidities: [], priorAntibiotics90Days: [], priorCultures12Months: [], allergies: [], unitResistanceRate: "22.8% Surgical Ward MRSA Rate" },
    shapFeatures: [],
    treatmentSupport: { empiricOptions: [] },
    decisionLog: { status: "Accepted", chosenOption: "Vancomycin IV 15mg/kg", rationale: "Targeted MRSA treatment", decidedBy: "Dr. Marcus Vance, MD", decidedAt: "2026-07-16" },
    cultureResult: { status: "Completed", specimen: "Wound Swab", organism: "MRSA", sensitivities: [] },
    monitoringTimeline: []
  },
  {
    id: "P-64201",
    mrn: "MRN-64201",
    name: "Clara Barton",
    age: 80,
    gender: "Female",
    bed: "Discharged (Gen Med)",
    ward: "General Medical Ward",
    admissionDate: "2026-08-20",
    dischargeDate: "2026-09-05",
    admissionStatus: "Recovered & Discharged",
    outcomeNotes: "Fully Recovered. Resolved Hospital-Acquired Pseudomonas Pneumonia with Cefepime.",
    primaryDiagnosis: "Hospital-Acquired Pneumonia (HAP)",
    infectionSource: "Lungs / Sputum",
    suspectedPathogen: "Pseudomonas aeruginosa",
    attendingDoctor: "Dr. Marcus Vance, MD",
    assignedNurse: "RN Sarah Jenkins",
    amrRiskLevel: "Medium",
    amrRiskScore: 62,
    status: "Cured & Discharged",
    vitals: {
      temp: "36.5 °C",
      hr: "68 bpm",
      bp: "116/72 mmHg",
      spo2: "97%",
      wbc: "6.0 x10³/µL",
      crp: "5 mg/L",
      lactate: "0.7 mmol/L",
      updatedAt: "Discharged Sep 05"
    },
    history: { comorbidities: [], priorAntibiotics90Days: [], priorCultures12Months: [], allergies: [], unitResistanceRate: "14.6% Rate" },
    shapFeatures: [],
    treatmentSupport: { empiricOptions: [] },
    decisionLog: { status: "Accepted", chosenOption: "Cefepime 2g IV q8h", rationale: "Pseudomonas eradication", decidedBy: "Dr. Marcus Vance, MD", decidedAt: "2026-08-21" },
    cultureResult: { status: "Completed", specimen: "Sputum Culture", organism: "Pseudomonas aeruginosa", sensitivities: [] },
    monitoringTimeline: []
  }
];

export const MOCK_ADMIN_SURVEILLANCE = {
  totalInpatients: 142,
  hospitalAmrRate: "24.2%",
  stewardshipCompliance: "94.1%",
  highRiskPatientsCount: 18,
  wardBreakdown: [
    { ward: "ICU Ward 22", total: 24, highRisk: 8, amrRate: "38.5%", compliance: "96.2%" },
    { ward: "Surgical Ward", total: 36, highRisk: 4, amrRate: "22.1%", compliance: "92.4%" },
    { ward: "General Internal Medicine", total: 52, highRisk: 4, amrRate: "18.3%", compliance: "94.8%" },
    { ward: "Emergency Dept", total: 30, highRisk: 2, amrRate: "14.6%", compliance: "91.5%" }
  ],
  pathogenPrevalence: [
    { pathogen: "ESBL E. coli / K. pneumoniae", percentage: 38, count: 48 },
    { pathogen: "MRSA (Methicillin-Resistant S. aureus)", percentage: 24, count: 30 },
    { pathogen: "MDR Pseudomonas aeruginosa", percentage: 18, count: 23 },
    { pathogen: "VRE (Vancomycin-Resistant Enterococcus)", percentage: 12, count: 15 },
    { pathogen: "CRE (Carbapenem-Resistant Enterobacterales)", percentage: 8, count: 10 }
  ],
  monthlyResistanceTrend: [
    { month: "May", esbl: 31, mrsa: 22, cre: 6 },
    { month: "Jun", esbl: 33, mrsa: 21, cre: 7 },
    { month: "Jul", esbl: 35, mrsa: 23, cre: 6 },
    { month: "Aug", esbl: 34, mrsa: 24, cre: 8 },
    { month: "Sep", esbl: 38, mrsa: 24, cre: 8 }
  ]
};

export const MOCK_ANTIBIOTIC_USAGE = {
  dddPer1000BedDays: 482.4,
  broadSpectrumRatio: "38.6%",
  stewardshipInterventionsThisMonth: 124,
  topAntibiotics: [
    { name: "Ceftriaxone", ddd: 142.5, category: "3rd Gen Cephalosporin", trend: "+4.2%", status: "High Usage Alert" },
    { name: "Piperacillin-Tazobactam", ddd: 98.2, category: "Anti-pseudomonal Penicillin", trend: "-1.8%", status: "Optimal" },
    { name: "Meropenem", ddd: 64.1, category: "Carbapenem (Restricted)", trend: "+6.1%", status: "Under Review" },
    { name: "Vancomycin", ddd: 52.8, category: "Glycopeptide", trend: "0.0%", status: "Optimal" },
    { name: "Ciprofloxacin", ddd: 44.3, category: "Fluoroquinolone", trend: "-8.4%", status: "Decreasing (Good)" }
  ]
};

export const MOCK_AI_PERFORMANCE = {
  rocAuc: 0.912,
  sensitivity: "89.4%",
  specificity: "88.7%",
  precision: "86.2%",
  f1Score: "0.878",
  modelName: "ResistomeX XGBoost v2.4",
  lastTrained: "2026-09-01",
  totalTrainingSamples: 14520,
  confusionMatrix: {
    truePositive: 1240,
    falsePositive: 198,
    falseNegative: 147,
    trueNegative: 1542
  },
  globalShapImportance: [
    { feature: "Prior 90d Broad Spectrum Antibiotics", importance: 0.34 },
    { feature: "Past Microbiology MDRO Positivity", importance: 0.29 },
    { feature: "Unit Endemic AMR Rate", importance: 0.18 },
    { feature: "Length of Current Stay", importance: 0.11 },
    { feature: "Age & Comorbidity Burden", importance: 0.08 }
  ]
};

export const MOCK_USERS = [
  { id: "u-1", name: "Dr. Marcus Vance, MD", email: "m.vance@hospital.org", role: "Doctor", department: "Infectious Diseases / ICU", status: "Active" },
  { id: "u-2", name: "RN Sarah Jenkins", email: "s.jenkins@hospital.org", role: "Nurse", department: "ICU Ward 22", status: "Active" },
  { id: "u-3", name: "Dr. Elena Rostova", email: "e.rostova@hospital.org", role: "Administrator", department: "Antimicrobial Stewardship / Admin", status: "Active" },
  { id: "u-4", name: "Dr. Jonathan Reyes, MD", email: "j.reyes@hospital.org", role: "Doctor", department: "Pulmonology", status: "Active" },
  { id: "u-5", name: "RN David Miller", email: "d.miller@hospital.org", role: "Nurse", department: "Surgical Ward", status: "Active" }
];
