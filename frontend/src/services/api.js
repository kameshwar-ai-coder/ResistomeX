// ResistomeX Unified API Service Client (FastAPI Backend + Supabase Database Layer)
import { supabase, isSupabaseConfigured } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

  // Check Python FastAPI backend health
  async checkBackendHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return { online: true, data };
    } catch (err) {
      return { online: false, error: err.message };
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

  // Predict AMR Risk via FastAPI ML inference engine
  async predictAMRRisk(patientData) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/amr/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, data: result };
      }
    } catch (err) {
      console.warn('[ResistomeX API] Backend inference unavailable, utilizing local fallback:', err.message);
    }
    return { success: false, fallback: true };
  },

  // Explain AMR Risk via TreeSHAP feature attribution
  async explainAMRRisk(explainRequest) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/amr/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(explainRequest)
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, data: result };
      }
    } catch (err) {
      console.warn('[ResistomeX API] Backend explainability unavailable:', err.message);
    }
    return { success: false, fallback: true };
  },

  // Get Rule-Constrained Empiric Treatment Support
  async getTreatmentSupport(supportData) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/treatment/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supportData)
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, data: result };
      }
    } catch (err) {
      console.warn('[ResistomeX API] Backend treatment service unavailable:', err.message);
    }
    return { success: false, fallback: true };
  },

  // Extract features from unstructured clinical notes
  async extractClinicalNote(rawNote) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/llm/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_clinical_note: rawNote })
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, data: result };
      }
    } catch (err) {
      console.warn('[ResistomeX API] Backend LLM note extractor unavailable:', err.message);
    }
    return { success: false, fallback: true };
  },

  // Fetch Model Metrics & Evaluation Data
  async getModelMetrics() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/model/metrics`, { method: 'GET' });
      if (res.ok) {
        const result = await res.json();
        return { success: true, data: result };
      }
    } catch (err) {
      console.warn('[ResistomeX API] Backend model metrics unavailable, querying Supabase directly:', err.message);
    }

    // Fallback query to Supabase ai_model_metrics
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('ai_model_metrics').select('*').limit(1).single();
        if (!error && data) return { success: true, data };
      } catch (e) {
        console.error('Supabase metrics fetch error:', e.message);
      }
    }

    return { success: false };
  },

  // Save Doctor Decision (records to backend audit & Supabase)
  async saveDoctorDecision(patientId, decisionData) {
    // 1. Send to FastAPI backend decision service
    try {
      fetch(`${API_BASE_URL}/api/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          decision_type: decisionData.decisionType || 'ACCEPT',
          chosen_option: decisionData.chosenOption,
          rationale: decisionData.rationale,
          decided_by: decisionData.decidedBy || 'attending_physician'
        })
      }).catch(err => console.warn('[ResistomeX API] Backend decision audit sync skipped:', err.message));
    } catch (e) {
      // Non-blocking
    }

    // 2. Save directly to Supabase if configured
    if (!isSupabaseConfigured) {
      return { success: true, data: { patient_id: patientId, localOnly: true } };
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
  },

  // Fetch 10k Dataset Statistics
  async getDatasetStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dataset/stats`);
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (err) {
      console.warn('[ResistomeX API] Backend dataset stats unreachable:', err.message);
    }
    return { success: false };
  },

  // Search 10k Dataset Records
  async searchDataset({ search = '', riskCategory = 'All', ward = 'All', infectionSource = 'All', limit = 50, offset = 0 } = {}) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (riskCategory && riskCategory !== 'All') params.append('risk_category', riskCategory);
      if (ward && ward !== 'All') params.append('ward', ward);
      if (infectionSource && infectionSource !== 'All') params.append('infection_source', infectionSource);
      params.append('limit', limit);
      params.append('offset', offset);

      const res = await fetch(`${API_BASE_URL}/api/dataset/records?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (err) {
      console.warn('[ResistomeX API] Backend dataset search unreachable:', err.message);
    }
    return { success: false };
  },

  // Get Single Dataset Record
  async getDatasetRecord(recordId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dataset/record/${encodeURIComponent(recordId)}`);
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (err) {
      console.warn('[ResistomeX API] Backend dataset record unreachable:', err.message);
    }
    return { success: false };
  },

  // Upload Dataset File (CSV, XLSX, XLS, JSON)
  async uploadDatasetFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE_URL}/api/dataset/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.detail || 'File upload failed' };
    } catch (err) {
      console.warn('[ResistomeX API] Backend file upload unreachable:', err.message);
      return { success: false, error: err.message };
    }
  },

  // Parse Raw EHR or EHR JSON
  async parseEHR(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dataset/parse-ehr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (err) {
      console.warn('[ResistomeX API] Backend EHR parse unreachable:', err.message);
    }
    return { success: false };
  }
};

