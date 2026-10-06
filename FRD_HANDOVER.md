# ResistomeX — Future AI/ML Integration Handover Document (For FRD Team)

> **Document Type**: Technical Handover & API Contract Specification  
> **Target Audience**: Future FRD (Feature & Research Development) AI/ML Team  
> **Scope Notice**: The AI/ML implementation is outside the current full-stack completion scope and will be handled separately by FRD. The full-stack web application, database schema, security, RBAC, and clinical decision support UI workflows are 100% complete, database-backed, and production-build verified.

---

## 🏛️ 1. Current Full-Stack System Architecture

```text
                                 ResistomeX
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
  React 19 Frontend                                   Supabase Database Layer
  (Vite + Tailwind CSS v4)                            (PostgreSQL 15 + RLS)
         │                                                       │
         ├── AuthContext (RBAC Guards)                           ├── public.patients
         ├── PatientContext (Data Pipeline)                      ├── public.patient_vitals
         ├── Role Views (Doctor, Nurse, Admin)                   ├── public.clinical_histories
         └── Hybrid API Client (`api.js`)                        ├── public.culture_results
                                                                 ├── public.amr_risk_assessments
                                                                 ├── public.doctor_decisions
                                                                 ├── public.ward_surveillance
                                                                 ├── public.antibiotic_usage_stats
                                                                 ├── public.profiles
                                                                 └── public.ai_model_metrics
```

---

## 🔌 2. FRD AI/ML Integration Consumption Endpoints

When the FRD team develops the live Python FastAPI XGBoost & SHAP microservices, the AI model responses will connect to the following existing frontend page locations:

### 1. **AMR Risk Assessment UI (`/doctor/patient/:id/amr-risk`)**
* **File Location**: [`frontend/src/pages/AMRRiskAssessmentPage.jsx`](file:///c:/Users/rosal/Downloads/design/ResistomeX/frontend/src/pages/AMRRiskAssessmentPage.jsx)
* **Expected FRD Output Payload**:
  ```json
  {
    "patient_id": "uuid-v4",
    "risk_level": "High" | "Medium" | "Low",
    "risk_score": 82,
    "pathogen_risks": {
      "esbl": 0.82,
      "mrsa": 0.45,
      "cre": 0.68,
      "mdr_pseudomonas": 0.35
    },
    "model_version": "ResistomeX XGBoost v2.4"
  }
  ```
* **Database Persistence Table**: `public.amr_risk_assessments`

---

### 2. **Explainability & SHAP Analytics UI (`/doctor/patient/:id/explainability`)**
* **File Location**: [`frontend/src/pages/ExplainabilitySHAPPage.jsx`](file:///c:/Users/rosal/Downloads/design/ResistomeX/frontend/src/pages/ExplainabilitySHAPPage.jsx)
* **Expected FRD Output Payload**:
  ```json
  {
    "patient_id": "uuid-v4",
    "base_value": 0.25,
    "prediction_value": 0.82,
    "shap_features": [
      { "feature": "Prior Carbapenem Exposure (90d)", "value": "Present", "impact": 0.35, "direction": "increases_risk" },
      { "feature": "Unit Endemic ESBL Rate", "value": "24.5%", "impact": 0.22, "direction": "increases_risk" },
      { "feature": "Serum Creatinine", "value": "1.8 mg/dL", "impact": -0.05, "direction": "decreases_risk" }
    ]
  }
  ```
* **Database Persistence Column**: `public.amr_risk_assessments.feature_attributions` (JSONB)

---

### 3. **Treatment Decision Support UI (`/doctor/patient/:id/treatment-support`)**
* **File Location**: [`frontend/src/pages/TreatmentSupportPage.jsx`](file:///c:/Users/rosal/Downloads/design/ResistomeX/frontend/src/pages/TreatmentSupportPage.jsx)
* **Expected FRD Output Payload**:
  ```json
  {
    "patient_id": "uuid-v4",
    "recommendations": [
      {
        "option_id": 1,
        "regimen": "Meropenem 1g IV q8h",
        "category": "First-Line Empiric",
        "renal_adjustment": "Reduce to 500mg q8h if CrCl < 50 mL/min",
        "rationale": "High ESBL probability with documented prior cephalosporin failure."
      }
    ]
  }
  ```

---

### 4. **Doctor Decision Audit Tracker (`/doctor/patient/:id/decision`)**
* **File Location**: [`frontend/src/pages/DoctorDecisionPage.jsx`](file:///c:/Users/rosal/Downloads/design/ResistomeX/frontend/src/pages/DoctorDecisionPage.jsx)
* **Physician Audit Logging**: Records whether the physician accepted (`ACCEPT`), modified (`MODIFY`), or overridden (`OVERRIDE`) the AI recommendation.
* **Database Persistence Table**: `public.doctor_decisions`

---

### 5. **AI Performance Analytics (`/admin/ai-performance`)**
* **File Location**: [`frontend/src/pages/AIPerformancePage.jsx`](file:///c:/Users/rosal/Downloads/design/ResistomeX/frontend/src/pages/AIPerformancePage.jsx)
* **Database Persistence Table**: `public.ai_model_metrics`

---

## 🔒 3. Clinical Safety & Boundary Principles

1. **Supporting Doctors, Not Replacing Them**: ResistomeX is designed strictly as a clinical decision-support prototype. The attending physician retains full authority and responsibility for all prescribing decisions.
2. **No Autonomous Prescribing**: The software never automatically transmits orders or dispenses medications without explicit physician confirmation.
3. **Transparent Disclaimers**: All risk scores are presented alongside clinical rationale and feature attributions so clinicians can verify the underlying reasoning.

---

## 🛠️ 4. Recommended FRD Deployment Steps

1. **Develop FastAPI Service**: Build Python 3.11 microservice running XGBoost 2.0+ and `shap` 0.44+.
2. **Connect to Supabase API Client**: Use `supabase-py` SDK to read patient clinical records and write risk predictions into `public.amr_risk_assessments`.
3. **Set Environment Endpoint**: Add `VITE_FASTAPI_URL` to `frontend/.env.local` to switch from baseline rule heuristics to live Python model REST endpoints.
