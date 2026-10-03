// ResistomeX API Service Client (Live Supabase Database Layer)
import { supabase, isSupabaseConfigured } from './supabase';

export const apiService = {
  // Check backend Supabase connection status
  async checkDatabaseConnection() {
    if (!isSupabaseConfigured) {
      return { connected: false, error: 'Supabase environment configuration missing (VITE_SUPABASE_URL)' };
    }
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) throw error;
      return { connected: true, data };
    } catch (err) {
      console.error('[ResistomeX Supabase Service] Connection error:', err.message);
      return { connected: false, error: err.message };
    }
  },

  // Authentication via Supabase Auth
  async login(credentials) {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Database service unconfigured. Check VITE_SUPABASE_URL environment variables.' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      if (error) throw error;
      return { success: true, user: data.user, session: data.session, role: credentials.role || 'doctor' };
    } catch (err) {
      console.error('[ResistomeX API] Authentication failed:', err.message);
      return { success: false, error: err.message };
    }
  },

  // Save Doctor Decision to Supabase
  async saveDoctorDecision(patientId, decisionData) {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Database configuration missing. Decision was not saved.' };
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      const { data, error } = await supabase.from('doctor_decisions').insert([{
        patient_id: patientId,
        decision_type: (decisionData.decisionType || 'ACCEPT').toUpperCase(),
        chosen_option: decisionData.chosenOption,
        rationale: decisionData.rationale,
        decided_by: currentUserId || decisionData.decidedBy
      }]).select().single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('[ResistomeX API] Failed to record decision in Supabase:', err.message);
      return { success: false, error: err.message };
    }
  },

  // Save Vitals to Supabase
  async saveVitals(patientId, vitalsData) {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Database configuration missing. Vitals were not saved.' };
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      const { data, error } = await supabase.from('patient_vitals').insert([{
        patient_id: patientId,
        temp_celsius: parseFloat(vitalsData.temp) || 37.0,
        heart_rate_bpm: parseInt(vitalsData.hr) || 80,
        bp_systolic: parseInt(vitalsData.bp?.split('/')[0]) || 120,
        bp_diastolic: parseInt(vitalsData.bp?.split('/')[1]) || 80,
        spo2_percent: parseInt(vitalsData.spo2) || 98,
        wbc_count: parseFloat(vitalsData.wbc) || null,
        crp_mg_l: parseFloat(vitalsData.crp) || null,
        vital_status: vitalsData.vitalStatus || 'Stable',
        recorded_by: currentUserId
      }]).select().single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('[ResistomeX API] Failed to record vitals in Supabase:', err.message);
      return { success: false, error: err.message };
    }
  }
};
