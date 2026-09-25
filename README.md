# ResistomeX — AI Antimicrobial Resistance (AMR) Clinical Support System

> **Supporting doctors. Protecting patients. Fighting Antimicrobial Resistance (AMR).**

ResistomeX is an AI-powered clinical decision-support application designed to assist healthcare professionals in assessing Antimicrobial Resistance (AMR) risk profiles and making rapid, evidence-based empiric treatment decisions before lab culture and sensitivity results become available.

---

## 📋 Table of Contents
1. [Overview & Problem Statement](#-overview--problem-statement)
2. [Key Features](#-key-features)
3. [Role-Based Workflows](#-role-based-workflows)
4. [Technology Stack](#-technology-stack)
5. [Project Structure](#-project-structure)
6. [Getting Started & Installation](#-getting-started--installation)
7. [Clinical Safety Principles](#-clinical-safety-principles)

---

## 🔬 Overview & Problem Statement

In clinical settings, physicians often need to initiate empiric antibiotic therapy before microbiology culture and susceptibility results return (which can take 24–72 hours). Selecting ineffective broad-spectrum antibiotics risks clinical failure, while over-prescribing carbapenems accelerates drug resistance.

**ResistomeX** bridges this gap by aggregating patient history, local hospital unit resistance rates, prior antibiotic exposure, and vital signs to predict AMR risk levels (High, Medium, Low) with explainable AI features (SHAP) and tailored antibiotic recommendations.

---

## ✨ Key Features

- 🏥 **Real-Time Surveillance Registry**: Master inpatient directory tracking MRN, ward bed location, suspected pathogens, and current vital signs.
- 🧬 **AMR Risk Assessment Engine**: Automated risk scoring engine evaluating Gram-negative ESBL, CRE, MRSA, and MDR Pseudomonas risks.
- 🔍 **Explainable AI (SHAP Analytics)**: Transparent breakdown showing *why* a risk prediction was made (prior 90-day antibiotic pressure, prior culture positivity, unit endemic rates).
- 💊 **Treatment Support Protocol**: First-line vs alternative empiric antibiotic regimen recommendations with renal dosage adjustments and safety warnings.
- 📋 **Doctor Decision Logging**: Audit-ready decision tracking recording whether the physician accepted, modified, or overridden AI suggestions.
- 📊 **Patient Monitoring & Culture Verification**: Post-decision response monitoring (CRP, temperature, WBC) alongside bi-directional LIS culture result validation.
- 👩‍⚕️ **Nurse Worklist & Rapid Vitals Recording**: Dedicated nurse view for shift vital check reminders, rapid vital sign updates, and patient details.
- 🛡️ **Antimicrobial Stewardship & Admin Analytics**: Hospital-wide AMR prevalence trends, Defined Daily Dose (DDD) tracking, AI confusion matrix metrics, and user access management.

---

## 👥 Role-Based Workflows

### 🩺 Doctor View (`/doctor/dashboard`)
- **Physician Worklist**: Prioritized card dashboard highlighting high-risk inpatients and pending lab cultures.
- **Add Patient Modal**: Seamless intake modal with auto-navigation to the AMR Risk Engine (`/doctor/patient/:id/amr-risk`).
- **Inpatient Directory & History**: Master registry with fast search filters.
- **Clinical Decision Portal**: Single-click access to AMR risk, SHAP feature impact, treatment support options, and decision acceptance.

### 🏥 Nurse View (`/nurse/dashboard`)
- **Ward Worklist**: Inpatient card grid highlighting vital check reminders and current regimens.
- **Update Vitals Modal**: Modal for recording Q2H vital sign updates with automatic threshold deterioration alerts.
- **Nurse Patient Details**: Specialized bedside monitoring view without doctor-specific prescribing actions.

### 🛡️ Admin & Stewardship View (`/admin/dashboard`)
- **Hospital Overview**: High-level surveillance stats and ward-by-ward AMR prevalence.
- **Antibiotic Usage**: DDD tracking per 1,000 bed days and stewardship intervention counters.
- **AI Performance**: Model accuracy metrics (ROC-AUC 0.912, Sensitivity, Specificity) and confusion matrix visualization.
- **User Management**: Role assignment and credential status toggling for hospital personnel.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) + Material Symbols Outlined |
| **Routing** | [React Router v7](https://reactrouter.com/) |
| **Icons & Visuals** | Google Material Symbols + Lucide Icons |
| **Charts & Analytics** | [Recharts](https://recharts.org/) |
| **State Management** | React Context API (`AuthContext`, `PatientContext`) |

---

## 📁 Project Structure

```text
e:/stitch_resistomex_amr_clinical_support/
├── ResistomeX_Application_and_Tech_Stack.md   # Application specification document
├── README.md                                    # Project documentation
└── frontend/                                   # React + Vite application
    ├── src/
    │   ├── components/                         # UI Components & Modals
    │   │   ├── AddPatientModal.jsx             # New AMR intake modal
    │   │   ├── RecordVitalsModal.jsx          # Nurse vital update modal
    │   │   ├── Navbar.jsx                      # Header with search & user profile
    │   │   ├── Sidebar.jsx                     # Role-aware sidebar navigation
    │   │   └── PatientHeader.jsx               # Contextual patient sub-tab bar
    │   ├── context/                            # React Context Providers
    │   │   ├── AuthContext.jsx                 # Role authentication (Doctor, Nurse, Admin)
    │   │   └── PatientContext.jsx              # Central patient state & decision logs
    │   ├── data/
    │   │   └── mockData.js                     # Clinical dataset & surveillance stats
    │   ├── pages/                              # Role-based pages
    │   │   ├── LoginPage.jsx                   # Role sign-in screen
    │   │   ├── DoctorDashboardPage.jsx         # Doctor prioritized worklist
    │   │   ├── PatientsListPage.jsx            # Inpatient registry & patient history
    │   │   ├── AMRRiskAssessmentPage.jsx       # AMR Risk prediction view
    │   │   ├── ExplainabilitySHAPPage.jsx      # SHAP feature impact view
    │   │   ├── TreatmentSupportPage.jsx        # Empiric antibiotic recommendations
    │   │   ├── DoctorDecisionPage.jsx          # Doctor rationale & decision confirmation
    │   │   ├── PatientMonitoringPage.jsx       # Post-treatment vital response timeline
    │   │   ├── CultureSensitivityPage.jsx      # LIS microbiology culture verification
    │   │   ├── NurseDashboardPage.jsx          # Nurse shift worklist
    │   │   ├── NursePatientDetailPage.jsx      # Nurse bedside patient details
    │   │   ├── AdminDashboardPage.jsx          # Stewardship overview
    │   │   ├── AntibioticUsagePage.jsx         # Antibiotic DDD analytics
    │   │   ├── AIPerformancePage.jsx          # Model performance & confusion matrix
    │   │   └── UserManagementPage.jsx          # Hospital user access control
    │   ├── services/
    │   │   └── api.js                          # REST API client with fallback
    │   ├── App.jsx                             # Main layout & router definition
    │   ├── main.jsx                            # React app entry point
    │   └── index.css                           # Tailwind CSS v4 styling rules
    ├── index.html                              # Google Fonts & HTML shell
    ├── vite.config.js                          # Vite configuration
    └── package.json                            # Dependencies & scripts
```

---

## 🚀 Getting Started & Installation

### Prerequisites
Make sure you have **Node.js** (v18 or higher) installed on your system.

### 1. Clone or Open Workspace
Navigate to the project root directory:

```bash
cd e:/stitch_resistomex_amr_clinical_support
```

### 2. Install Dependencies
Change into the `frontend` folder and install NPM packages:

```bash
cd frontend
npm install
```

### 3. Run the Development Server
Launch the local dev server:

```bash
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:5173/`** (or `http://localhost:5174/` if port 5173 is occupied).

### 4. Demo Login Presets
Use the built-in quick login buttons on the login screen:
- **Doctor View**: `Dr. Marcus Vance, MD` (Attending Physician - Infectious Diseases)
- **Nurse View**: `RN Sarah Jenkins` (ICU Ward Charge Nurse)
- **Admin View**: `Dr. Elena Rostova` (Antimicrobial Stewardship Director)

### 5. Build for Production
To generate an optimized bundle:

```bash
cd frontend
npm run build
```

---

## ⚖️ Clinical Safety Principles

ResistomeX is designed strictly as a **clinical decision-support prototype**:

1. **Supporting Doctors, Not Replacing Them**: The software never automatically prescribes antibiotics. The attending physician retains full responsibility for clinical decisions.
2. **Explainable AI (XAI)**: Predictions transparently cite key driver risk factors (SHAP values) so clinicians can verify the clinical reasoning behind a score.
3. **Antimicrobial Stewardship Alignment**: Guidance aligns with institutional stewardship protocols to prevent unnecessary use of broad-spectrum carbapenems.
