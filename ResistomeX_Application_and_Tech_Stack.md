# ResistomeX — Application & Tech Stack

## 1. Application Overview

**ResistomeX** is an AI-powered clinical decision-support application designed to help healthcare professionals assess antimicrobial resistance (AMR) risk and make more informed initial treatment decisions when culture and sensitivity results are not yet available.

The system is designed to **support doctors, not replace them**. The doctor remains responsible for the final clinical decision.

### Core Flow

Patient Information → AMR Risk Prediction → Explainable AI → Treatment Support → Doctor Decision → Patient Monitoring → Culture Result → Outcome / Feedback

## 2. Problem

Doctors may need to begin empiric antibiotic treatment before culture and sensitivity results are available. During this period, important information about the organism and resistance pattern may be unavailable.

ResistomeX provides early decision support using relevant patient information and resistance-related information.

It considers factors such as:
- Patient age and clinical condition
- Symptoms and suspected infection source
- Previous antibiotic use
- Previous culture/resistance history
- Drug allergies
- Important medical conditions
- Hospital/local resistance patterns

## 3. Main Users

### Doctor
- View or enter patient information
- Run AMR assessment
- View Low / Medium / High AMR risk
- Understand main prediction factors
- Review treatment-support information
- Accept, modify, or override AI-supported information
- Monitor patient progress
- Review culture results

### Nurse
- View assigned patients
- View patient status and AMR risk
- Update vital signs
- Receive simple alerts for important changes

### Administrator
- View hospital AMR information
- Review antibiotic usage
- Monitor AI performance
- Manage users
- View reports

## 4. Application Pages

### Doctor
1. Login
2. Doctor Dashboard
3. Patients
4. Patient Clinical Information
5. AMR Risk Assessment
6. Why This Prediction?
7. Treatment Support
8. Doctor Decision
9. Patient Monitoring
10. Culture & Sensitivity

### Nurse
11. Nurse Dashboard
12. Nurse Patient Details

### Administrator
13. Admin Dashboard
14. Antibiotic Usage
15. AI Performance
16. User Management

## 5. AMR Risk Prediction

The AI model receives relevant patient information and produces:
- **Low**
- **Medium**
- **High**

The UI should keep the explanation simple, highlighting factors such as previous antibiotic use, previous resistance history, current infection condition, and local/hospital resistance patterns.

## 6. Explainable AI

ResistomeX should answer:

> **Why did the system produce this prediction?**

The planned explainability layer uses **SHAP** to identify important contributing features from the trained model.

## 7. Treatment Decision Support

The system can present a small number of relevant treatment-support options for clinical consideration.

It can consider:
- Patient-specific factors
- Previous antibiotic exposure
- Allergies and important conditions
- Local/hospital resistance information

The UI should not present the AI as an automatic prescription.

Doctor decision:
**Accept | Modify | Override**

## 8. Patient Monitoring

The system can support monitoring of:
- Temperature
- Blood pressure
- Heart rate
- SpO2
- Patient status

It can highlight important changes for clinical reassessment. It should not automatically change treatment.

## 9. Culture & Sensitivity

When results become available, the application can display:
- Culture status
- Organism result
- Sensitivity/resistance result
- AI prediction
- Actual culture result

This allows comparison between the initial AI assessment and microbiology result.

## 10. Outcome Feedback

Long-term flow:

**AI Prediction → Doctor Decision → Culture Result → Patient Outcome**

Collected outcomes can be used to evaluate and improve the system after proper validation.

# 11. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | **React.js** | Build doctor, nurse, and admin interfaces |
| Styling | **Tailwind CSS** | Responsive and consistent UI |
| Backend | **Python + FastAPI** | REST APIs and application logic |
| ML | **XGBoost** | AMR risk prediction |
| Explainability | **SHAP** | Explain model predictions |
| Data Processing | **Pandas + NumPy** | Data cleaning and feature preparation |
| Database | **PostgreSQL** | Store application and clinical workflow data |
| Authentication | **JWT** | Login and role-based access |
| API | **REST API** | React ↔ FastAPI communication |
| Version Control | **Git + GitHub** | Source-code management |
| Deployment | **Docker** | Consistent application deployment |

## 12. Technical Architecture

```text
                    ResistomeX
                        |
              ┌─────────┴─────────┐
              |                   |
          React.js             FastAPI
          Frontend             Backend
              |                   |
              |          ┌────────┴────────┐
              |          |                 |
              |       XGBoost            PostgreSQL
              |          |
              |        SHAP
              |          |
              └──────────┴───────────────┐
                                         |
                              AMR Risk + Explanation
                                         |
                                  Doctor Decision
                                         |
                              Patient Monitoring
                                         |
                                Culture / Outcome
```

## 13. Development Flow

1. Finalize UI
2. Set up React project
3. Set up FastAPI backend
4. Design PostgreSQL database
5. Identify and prepare a suitable AMR dataset
6. Define the prediction target
7. Train and validate the XGBoost model
8. Add SHAP explanations
9. Create backend APIs
10. Connect React to FastAPI
11. Implement authentication and roles
12. Add patient monitoring
13. Add culture-result comparison
14. Test the complete workflow
15. Evaluate the prototype

## 14. MVP

The first working version should focus on:

```text
Doctor Login
      ↓
Patient Information
      ↓
AMR Risk Prediction
      ↓
Why This Prediction?
      ↓
Treatment Support
      ↓
Accept / Modify / Override
```

After the core workflow works, monitoring, culture comparison, outcome tracking, and administrative analytics can be integrated.

## 15. Project Principle

ResistomeX is a **clinical decision-support prototype**.

It should:
- Support clinical decision-making
- Make important information easier to review
- Explain AI predictions
- Keep doctors in control
- Avoid automatic prescribing
- Avoid unnecessary information overload

### Core idea

> **Supporting doctors. Protecting patients. Fighting AMR.**
