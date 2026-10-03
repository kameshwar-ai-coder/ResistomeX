-- ResistomeX Database Schema Migration
-- Migration: 20260926000000_initial_schema.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 1. PROFILES TABLE (Extends Supabase Auth users)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  facility TEXT NOT NULL DEFAULT 'Central Academic Medical Center',
  department TEXT NOT NULL DEFAULT 'Inpatient Ward',
  role TEXT NOT NULL CHECK (role IN ('doctor', 'nurse', 'admin')),
  avatar_initials TEXT NOT NULL DEFAULT 'RX',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 2. PATIENTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT NOT NULL UNIQUE,
  mrn TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0),
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  ward TEXT NOT NULL,
  bed TEXT NOT NULL,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  discharge_date DATE NULL,
  admission_status TEXT NOT NULL DEFAULT 'Admitted',
  outcome_notes TEXT NULL,
  primary_diagnosis TEXT NOT NULL,
  infection_source TEXT NOT NULL,
  suspected_pathogen TEXT NOT NULL,
  attending_doctor_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_nurse_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Needs Review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 3. PATIENT VITALS TABLE (Longitudinal monitoring)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.patient_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  temp_celsius NUMERIC(4,1) NOT NULL,
  heart_rate_bpm INTEGER NOT NULL,
  bp_systolic INTEGER NOT NULL,
  bp_diastolic INTEGER NOT NULL,
  spo2_percent INTEGER NOT NULL CHECK (spo2_percent BETWEEN 0 AND 100),
  wbc_count NUMERIC(4,1) NULL,
  crp_mg_l NUMERIC(5,1) NULL,
  lactate_mmol_l NUMERIC(4,1) NULL,
  vital_status TEXT NOT NULL DEFAULT 'Stable',
  recorded_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 4. CLINICAL HISTORIES TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.clinical_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  comorbidities TEXT[] NOT NULL DEFAULT '{}',
  allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
  unit_resistance_rate TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 5. PRIOR ANTIBIOTIC EXPOSURES TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.prior_antibiotic_exposures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  antibiotic_name TEXT NOT NULL,
  duration TEXT NOT NULL,
  timing TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 6. CULTURE RESULTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.culture_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  specimen TEXT NOT NULL,
  collected_date TIMESTAMPTZ NOT NULL,
  result_date TIMESTAMPTZ NULL,
  organism TEXT NOT NULL,
  ai_prediction_match TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 7. CULTURE SENSITIVITIES TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.culture_sensitivities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  culture_id UUID NOT NULL REFERENCES public.culture_results(id) ON DELETE CASCADE,
  antibiotic TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('Susceptible', 'Intermediate', 'Resistant')),
  mic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 8. AMR RISK ASSESSMENTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.amr_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('High', 'Medium', 'Low')),
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  model_version TEXT NOT NULL DEFAULT 'ResistomeX XGBoost v2.4',
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 9. SHAP EXPLANATIONS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.shap_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.amr_risk_assessments(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  impact_score NUMERIC(4,2) NOT NULL,
  description TEXT NOT NULL,
  rank_order INTEGER NOT NULL
);

-- ========================================================
-- 10. EMPIRIC TREATMENT OPTIONS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.empiric_treatment_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.amr_risk_assessments(id) ON DELETE CASCADE,
  option_code TEXT NOT NULL,
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  coverage_score INTEGER NOT NULL CHECK (coverage_score BETWEEN 0 AND 100),
  rationale TEXT NOT NULL,
  is_first_line BOOLEAN NOT NULL DEFAULT false,
  warnings TEXT[] NOT NULL DEFAULT '{}'
);

-- ========================================================
-- 11. DOCTOR DECISIONS TABLE (Immutable audit trail)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.doctor_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assessment_id UUID NULL REFERENCES public.amr_risk_assessments(id) ON DELETE SET NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('ACCEPT', 'MODIFY', 'OVERRIDE')),
  chosen_option TEXT NOT NULL,
  rationale TEXT NOT NULL,
  decided_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 12. WARD SURVEILLANCE TABLE (Admin Analytics)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.ward_surveillance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_name TEXT NOT NULL UNIQUE,
  total_inpatients INTEGER NOT NULL DEFAULT 0,
  high_risk_count INTEGER NOT NULL DEFAULT 0,
  amr_rate_percent NUMERIC(4,1) NOT NULL DEFAULT 0.0,
  stewardship_compliance_percent NUMERIC(4,1) NOT NULL DEFAULT 0.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 13. ANTIBIOTIC USAGE STATS TABLE (Admin Analytics)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.antibiotic_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  antibiotic_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  ddd_per_1000_bed_days NUMERIC(6,1) NOT NULL,
  trend_30d TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 14. AI MODEL METRICS TABLE (Admin Analytics)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.ai_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL UNIQUE,
  roc_auc NUMERIC(4,3) NOT NULL,
  sensitivity_percent NUMERIC(4,1) NOT NULL,
  specificity_percent NUMERIC(4,1) NOT NULL,
  precision_percent NUMERIC(4,1) NOT NULL,
  f1_score NUMERIC(4,3) NOT NULL,
  true_positives INTEGER NOT NULL,
  false_positives INTEGER NOT NULL,
  false_negatives INTEGER NOT NULL,
  true_negatives INTEGER NOT NULL,
  last_trained_date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_patients_ward ON public.patients(ward);
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients(status);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_id ON public.patient_vitals(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_culture_results_patient_id ON public.culture_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_amr_assessments_patient_id ON public.amr_risk_assessments(patient_id, assessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_decisions_patient_id ON public.doctor_decisions(patient_id);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prior_antibiotic_exposures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.culture_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.culture_sensitivities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amr_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shap_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empiric_treatment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ward_surveillance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.antibiotic_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can read profiles; owners & admins can update
CREATE POLICY "Allow read profiles for authenticated staff"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Patients: Authenticated staff can SELECT, INSERT, and UPDATE
CREATE POLICY "Allow authenticated staff to view patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to insert patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated staff to update patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Patient Vitals: Append-only for authenticated staff
CREATE POLICY "Allow authenticated staff to view vitals"
  ON public.patient_vitals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to insert vitals"
  ON public.patient_vitals FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Clinical Histories
CREATE POLICY "Allow authenticated staff to view clinical histories"
  ON public.clinical_histories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to manage clinical histories"
  ON public.clinical_histories FOR ALL
  TO authenticated
  USING (true);

-- Prior Antibiotics
CREATE POLICY "Allow authenticated staff to view prior antibiotics"
  ON public.prior_antibiotic_exposures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to insert prior antibiotics"
  ON public.prior_antibiotic_exposures FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Cultures & Sensitivities
CREATE POLICY "Allow authenticated staff to view culture results"
  ON public.culture_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to view culture sensitivities"
  ON public.culture_sensitivities FOR SELECT
  TO authenticated
  USING (true);

-- AMR Assessments & Explanations & Options
CREATE POLICY "Allow authenticated staff to view AMR risk assessments"
  ON public.amr_risk_assessments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to view SHAP explanations"
  ON public.shap_explanations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to view empiric options"
  ON public.empiric_treatment_options FOR SELECT
  TO authenticated
  USING (true);

-- Doctor Decisions (Immutable Audit Trail)
CREATE POLICY "Allow authenticated staff to view doctor decisions"
  ON public.doctor_decisions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow doctors to insert decisions"
  ON public.doctor_decisions FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Admin Analytics Tables (Ward Surveillance, Antibiotic Usage, AI Performance)
CREATE POLICY "Allow authenticated staff to view ward surveillance"
  ON public.ward_surveillance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to view antibiotic usage"
  ON public.antibiotic_usage_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to view AI metrics"
  ON public.ai_model_metrics FOR SELECT
  TO authenticated
  USING (true);

-- ========================================================
-- AUTOMATIC PROFILE CREATION TRIGGER FOR SUPABASE AUTH
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    title,
    facility,
    department,
    role,
    avatar_initials
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Clinical Staff'),
    COALESCE(NEW.raw_user_meta_data->>'title', 'Medical Staff'),
    COALESCE(NEW.raw_user_meta_data->>'facility', 'Central Academic Medical Center'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Inpatient Ward'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'doctor'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_initials', 'CS')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
