# ResistomeX — Clinical AI Antimicrobial Resistance (AMR) Decision Support System

> **Supporting Doctors. Protecting Patients. Combating Antimicrobial Resistance.**

ResistomeX is an AI-powered clinical decision-support application designed to assist healthcare teams (Physicians, Nurses, Infection Control & Antimicrobial Stewardship) in assessing Antimicrobial Resistance (AMR) risk and delivering rapid, evidence-based empiric treatment recommendations before laboratory culture and sensitivity results are finalized (which typically require 24–72 hours).

---

## 🔬 Core Clinical Capabilities

- **🧬 Calibrated ML Risk Prediction**: Calibrated XGBoost classifier trained on multi-site clinical encounters predicting probability of drug-resistant pathogens.
- **🔍 Explainable AI (TreeSHAP Analytics)**: Instant feature contribution waterfall analysis explaining patient-specific risk drivers (e.g., prior 90-day antibiotic pressure, colonization history, unit endemic rates, renal function).
- **💊 Rule-Guided Empiric Treatment Engine**: Pathogen- and syndrome-specific first-line & alternative empiric antibiotic regimens adjusted for renal clearance and documented drug allergies.
- **🔄 Active Learning Decision Loop**: Clinicians can Accept, Modify, or Override recommendations with structured clinical rationales, recording reward signals to continuously refine and retrain AI models.
- **🧫 Culture Ground-Truth Verification**: Direct microbiological culture & AST (Antimicrobial Susceptibility Testing) result logging to validate predictive concordance and close the clinical learning loop.
- **📈 Comprehensive Monitoring & Stewardship**: Bedside vital sign tracking, CRP deterioration alerts, ward-level surveillance, and Defined Daily Dose (DDD) metrics.

---

## 👥 Role-Based Workflows

### 🩺 Doctor View (`/doctor/dashboard`)
- Prioritized patient worklist highlighting high-risk inpatients and pending lab cultures.
- Inpatient directory with search, filter, and 10k cohort streaming.
- AMR risk assessment with TreeSHAP feature explanations.
- Empiric antibiotic regimen selection with renal dosing and allergy warnings.
- Continuous active learning feedback portal (Accept / Modify / Override).

### 🏥 Nurse View (`/nurse/dashboard`)
- Inpatient bed grid with shift check reminders and active medication regimens.
- Rapid vital signs recording modal with automatic clinical threshold deterioration alerts.
- Dedicated bedside monitoring view.

### 🛡️ Admin & Stewardship View (`/admin/dashboard`)
- Hospital-wide AMR prevalence trends across wards (ICU, Oncology, General Ward, Emergency).
- Antibiotic usage metrics & Defined Daily Dose (DDD) per 1,000 bed days.
- AI Model performance metrics (ROC-AUC, Precision, Recall, Confusion Matrix).
- Staff access management and audit logging.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts | Interactive clinical user interface |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic | Asynchronous REST microservices |
| **Machine Learning** | XGBoost, Scikit-Learn, SHAP | Calibrated AMR probability & feature attribution |
| **Database** | PostgreSQL / Supabase | Relational store for encounters, vitals & audit logs |

---

## 🚀 Getting Started & Running Locally

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)

### 2. Backend Setup
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Access the application at: `http://localhost:5173/`

### 4. Running Verification & Smoke Tests
```powershell
# Run backend AI inference and API smoke tests
python backend/smoke_test.py
```

---

## ⚖️ Clinical Safety Principles

1. **Decision Support, Not Replacement**: ResistomeX provides recommendations to assist attending physicians; prescribing decisions always remain with licensed clinical professionals.
2. **Explainable AI (XAI)**: Every prediction presents key contributing factors (SHAP values) so clinicians can verify the clinical reasoning.
3. **Stewardship Alignment**: Empiric regimens are calibrated to prevent unnecessary carbapenem and broad-spectrum antibiotic overuse.
