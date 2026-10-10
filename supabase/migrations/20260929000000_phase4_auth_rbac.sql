-- ResistomeX Phase 4 Migration: Production RLS Policies & Role-Based Access Control (RBAC)
-- Migration: 20260929000000_phase4_auth_rbac.sql

-- Helper function to fetch current authenticated user's role from profiles
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ensure handle_new_user trigger correctly sets role from raw_user_meta_data
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'title', 'Medical Staff'),
    COALESCE(NEW.raw_user_meta_data->>'facility', 'Central Academic Medical Center'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Inpatient Ward'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'doctor'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_initials', 'RX')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- REFINED RLS POLICIES FOR CLINICAL SECURITY & RBAC
-- ========================================================

-- Drop old overly-permissive policies
DROP POLICY IF EXISTS "Allow authenticated staff to insert patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated staff to update patients" ON public.patients;
DROP POLICY IF EXISTS "Allow doctors to insert decisions" ON public.doctor_decisions;
DROP POLICY IF EXISTS "Allow authenticated staff to insert vitals" ON public.patient_vitals;
DROP POLICY IF EXISTS "Allow authenticated staff to view ward surveillance" ON public.ward_surveillance;
DROP POLICY IF EXISTS "Allow authenticated staff to view antibiotic usage" ON public.antibiotic_usage_stats;
DROP POLICY IF EXISTS "Allow authenticated staff to view AI metrics" ON public.ai_model_metrics;

-- 1. Patients: Authenticated users can read. Doctors, Nurses, Admins can INSERT/UPDATE.
CREATE POLICY "Strict RBAC: Insert Patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() IN ('doctor', 'nurse', 'admin'));

CREATE POLICY "Strict RBAC: Update Patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (public.get_my_role() IN ('doctor', 'nurse', 'admin'));

-- 2. Doctor Decisions: Only Doctor or Admin roles can insert decisions
CREATE POLICY "Strict RBAC: Insert Doctor Decisions"
  ON public.doctor_decisions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('doctor', 'admin') AND
    decided_by = auth.uid()
  );

-- 3. Patient Vitals: Doctors, Nurses, and Admins can insert vitals
CREATE POLICY "Strict RBAC: Insert Patient Vitals"
  ON public.patient_vitals FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() IN ('doctor', 'nurse', 'admin'));

-- 4. Admin Analytics: Read for all authenticated staff, write restricted to Admin role
CREATE POLICY "Strict RBAC: View Ward Surveillance"
  ON public.ward_surveillance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Strict RBAC: Manage Ward Surveillance"
  ON public.ward_surveillance FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Strict RBAC: View Antibiotic Usage"
  ON public.antibiotic_usage_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Strict RBAC: Manage Antibiotic Usage"
  ON public.antibiotic_usage_stats FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Strict RBAC: View AI Model Metrics"
  ON public.ai_model_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Strict RBAC: Manage AI Model Metrics"
  ON public.ai_model_metrics FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin');
