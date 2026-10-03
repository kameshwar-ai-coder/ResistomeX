import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [wardSurveillance, setWardSurveillance] = useState([]);
  const [antibioticUsage, setAntibioticUsage] = useState([]);
  const [aiMetrics, setAiMetrics] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Doctor Decision Counts
  const [decisionStats, setDecisionStats] = useState({
    accepted: 0,
    modified: 0,
    overridden: 0
  });

  // Load all live clinical data from Supabase
  const loadBackendData = useCallback(async () => {
    setLoading(true);
    setDbError(null);

    if (!isSupabaseConfigured) {
      setDbError('Supabase backend service is unconfigured. Please configure VITE_SUPABASE_URL in environment variables.');
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Patients & relations
      const { data: dbPatients, error: pErr } = await supabase
        .from('patients')
        .select(`
          *,
          patient_vitals(*),
          clinical_histories(*),
          culture_results(*),
          amr_risk_assessments(*)
        `)
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;

      if (dbPatients) {
        const formattedPatients = dbPatients.map(p => {
          const sortedVitals = [...(p.patient_vitals || [])].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
          const latestVitals = sortedVitals[0] || {};
          const history = p.clinical_histories?.[0] || {};
          
          const sortedAssessments = [...(p.amr_risk_assessments || [])].sort((a, b) => new Date(b.assessed_at) - new Date(a.assessed_at));
          const latestAssessment = sortedAssessments[0] || {};
          
          const sortedCultures = [...(p.culture_results || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const latestCulture = sortedCultures[0] || {};

          return {
            id: p.id,
            displayId: p.display_id || p.id,
            mrn: p.mrn,
            name: p.name,
            age: p.age,
            gender: p.gender,
            bed: p.bed,
            ward: p.ward,
            admissionDate: p.admission_date,
            dischargeDate: p.discharge_date,
            admissionStatus: p.admission_status,
            outcomeNotes: p.outcome_notes,
            primaryDiagnosis: p.primary_diagnosis,
            infectionSource: p.infection_source,
            suspectedPathogen: p.suspected_pathogen,
            attendingDoctorId: p.attending_doctor_id,
            assignedNurseId: p.assigned_nurse_id,
            amrRiskLevel: latestAssessment.risk_level || 'Low',
            amrRiskScore: latestAssessment.risk_score || 0,
            status: p.status || 'Needs Review',
            vitals: {
              temp: latestVitals.temp_celsius ? `${latestVitals.temp_celsius} °C` : '--',
              hr: latestVitals.heart_rate_bpm ? `${latestVitals.heart_rate_bpm} bpm` : '--',
              bp: latestVitals.bp_systolic ? `${latestVitals.bp_systolic}/${latestVitals.bp_diastolic} mmHg` : '--',
              spo2: latestVitals.spo2_percent ? `${latestVitals.spo2_percent}%` : '--',
              wbc: latestVitals.wbc_count ? `${latestVitals.wbc_count} x10³/µL` : '--',
              crp: latestVitals.crp_mg_l ? `${latestVitals.crp_mg_l} mg/L` : '--',
              lactate: latestVitals.lactate_mmol_l ? `${latestVitals.lactate_mmol_l} mmol/L` : '--',
              updatedAt: latestVitals.recorded_at ? new Date(latestVitals.recorded_at).toLocaleString() : 'No record'
            },
            history: {
              comorbidities: history.comorbidities || [],
              priorAntibiotics90Days: [],
              priorCultures12Months: [],
              allergies: history.allergies || [],
              unitResistanceRate: history.unit_resistance_rate || 'N/A'
            },
            cultureResult: {
              id: latestCulture.id,
              status: latestCulture.status || 'No Culture Ordered',
              specimen: latestCulture.specimen || 'N/A',
              collectedDate: latestCulture.collected_date ? new Date(latestCulture.collected_date).toLocaleString() : '',
              resultDate: latestCulture.result_date ? new Date(latestCulture.result_date).toLocaleString() : '',
              organism: latestCulture.organism || 'None',
              aiPredictionMatch: latestCulture.ai_prediction_match || 'N/A'
            },
            monitoringTimeline: sortedVitals.map(v => ({
              id: v.id,
              time: new Date(v.recorded_at).toLocaleString(),
              temp: v.temp_celsius,
              hr: v.heart_rate_bpm,
              bp: `${v.bp_systolic}/${v.bp_diastolic}`,
              crp: v.crp_mg_l || 0,
              status: v.vital_status || 'Stable'
            }))
          };
        });
        setPatients(formattedPatients);
      }

      // 2. Fetch Profiles/Users
      const { data: dbProfiles, error: profErr } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!profErr && dbProfiles) {
        setUsers(dbProfiles.map(u => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          role: u.role,
          title: u.title,
          department: u.department,
          facility: u.facility,
          status: 'Active'
        })));
      }

      // 3. Fetch Doctor Decision Analytics
      const { data: dbDecisions } = await supabase.from('doctor_decisions').select('decision_type');
      if (dbDecisions) {
        const counts = { accepted: 0, modified: 0, overridden: 0 };
        dbDecisions.forEach(d => {
          const type = (d.decision_type || '').toLowerCase();
          if (type === 'accept') counts.accepted++;
          else if (type === 'modify') counts.modified++;
          else if (type === 'override') counts.overridden++;
        });
        setDecisionStats(counts);
      }

      // 4. Fetch Ward Surveillance (Admin)
      const { data: dbWard } = await supabase.from('ward_surveillance').select('*').order('ward_name');
      if (dbWard) setWardSurveillance(dbWard);

      // 5. Fetch Antibiotic Usage (Admin)
      const { data: dbAbx } = await supabase.from('antibiotic_usage_stats').select('*').order('ddd_per_1000_bed_days', { ascending: false });
      if (dbAbx) setAntibioticUsage(dbAbx);

      // 6. Fetch AI Model Metrics (Admin Baseline)
      const { data: dbMetrics } = await supabase.from('ai_model_metrics').select('*').limit(1).single();
      if (dbMetrics) setAiMetrics(dbMetrics);

    } catch (err) {
      console.error('[PatientContext] Supabase data load error:', err.message);
      setDbError(`Failed to connect to Supabase database: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  const getPatientById = (id) => {
    if (!id) return null;
    return patients.find(p => p.id === id || p.displayId === id || p.mrn === id) || null;
  };

  // Add new patient to Supabase
  const addNewPatient = async (patientData) => {
    if (!isSupabaseConfigured) {
      throw new Error('Database is unconfigured. Cannot add patient.');
    }

    const hasPriorAntibiotics = patientData.priorAntibiotics && patientData.priorAntibiotics.length > 0;
    const isICU = (patientData.ward || '').includes('ICU');
    let riskScore = 25;
    if (hasPriorAntibiotics) riskScore += 35;
    if (isICU) riskScore += 25;

    let riskLevel = 'Low';
    if (riskScore >= 75) riskLevel = 'High';
    else if (riskScore >= 45) riskLevel = 'Medium';

    const tempNum = parseFloat(patientData.temp) || 37.0;
    const hrNum = parseInt(patientData.hr) || 80;
    const bpParts = (patientData.bp || '120/80').split('/');
    const bpSys = parseInt(bpParts[0]) || 120;
    const bpDia = parseInt(bpParts[1]) || 80;
    const spo2Num = parseInt(patientData.spo2) || 98;

    const displayId = `P-${Math.floor(10000 + Math.random() * 90000)}`;
    const mrn = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;

    const { data: dbPatient, error: insertErr } = await supabase
      .from('patients')
      .insert([{
        display_id: displayId,
        mrn: mrn,
        name: patientData.name,
        age: parseInt(patientData.age),
        gender: patientData.gender,
        bed: patientData.bed || 'Ward Bed 01',
        ward: patientData.ward || 'General Medical Ward',
        admission_date: new Date().toISOString().split('T')[0],
        primary_diagnosis: patientData.primaryDiagnosis,
        infection_source: patientData.infectionSource || 'Bloodstream / Sepsis',
        suspected_pathogen: patientData.suspectedPathogen || 'Gram-negative Bacilli',
        status: 'Needs Review'
      }])
      .select()
      .single();

    if (insertErr) {
      console.error('[PatientContext] Insert patient error:', insertErr.message);
      throw insertErr;
    }

    // Insert Vitals
    await supabase.from('patient_vitals').insert([{
      patient_id: dbPatient.id,
      temp_celsius: tempNum,
      heart_rate_bpm: hrNum,
      bp_systolic: bpSys,
      bp_diastolic: bpDia,
      spo2_percent: spo2Num,
      vital_status: 'Needs Review'
    }]);

    // Insert Clinical History
    await supabase.from('clinical_histories').insert([{
      patient_id: dbPatient.id,
      comorbidities: patientData.comorbidities ? patientData.comorbidities.split(',').map(s => s.trim()) : [],
      allergies: patientData.allergies ? [{ allergen: patientData.allergies, reaction: 'Allergy', severity: 'Medium' }] : []
    }]);

    // Insert AMR Risk Assessment Baseline
    await supabase.from('amr_risk_assessments').insert([{
      patient_id: dbPatient.id,
      risk_level: riskLevel,
      risk_score: riskScore,
      model_version: 'Baseline Heuristic Rules'
    }]);

    // Reload state from Supabase to guarantee exact database sync
    await loadBackendData();
    return dbPatient;
  };

  // Update existing patient in Supabase
  const updatePatient = async (patientId, updates) => {
    if (!isSupabaseConfigured) throw new Error('Database is unconfigured.');

    const { error } = await supabase
      .from('patients')
      .update({
        status: updates.status,
        ward: updates.ward,
        bed: updates.bed,
        primary_diagnosis: updates.primaryDiagnosis,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId);

    if (error) throw error;
    await loadBackendData();
  };

  // Record Vitals into Supabase
  const updateVitals = async (patientId, newVitals) => {
    if (!isSupabaseConfigured) throw new Error('Database is unconfigured.');

    const tempNum = parseFloat(newVitals.temp) || 37.0;
    const spo2Num = parseFloat(newVitals.spo2) || 98;
    const hrNum = parseFloat(newVitals.hr) || 80;

    let vitalStatus = 'Stable';
    if (tempNum >= 38.8 || spo2Num < 93 || hrNum > 110) vitalStatus = 'Needs Attention';
    else if (tempNum >= 37.8 || spo2Num < 96) vitalStatus = 'Needs Review';

    const bpParts = (newVitals.bp || '120/80').split('/');
    const bpSys = parseInt(bpParts[0]) || 120;
    const bpDia = parseInt(bpParts[1]) || 80;

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('patient_vitals').insert([{
      patient_id: patientId,
      temp_celsius: tempNum,
      heart_rate_bpm: hrNum,
      bp_systolic: bpSys,
      bp_diastolic: bpDia,
      spo2_percent: spo2Num,
      wbc_count: parseFloat(newVitals.wbc) || null,
      crp_mg_l: parseFloat(newVitals.crp) || null,
      vital_status: vitalStatus,
      recorded_by: userData?.user?.id || null
    }]);

    if (error) throw error;
    await loadBackendData();
  };

  // Record Doctor Decision into Supabase
  const recordDoctorDecision = async (patientId, optionName, rationale, decisionType = 'accept') => {
    if (!isSupabaseConfigured) throw new Error('Database is unconfigured.');

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('doctor_decisions').insert([{
      patient_id: patientId,
      decision_type: decisionType.toUpperCase(),
      chosen_option: optionName,
      rationale: rationale,
      decided_by: userData?.user?.id
    }]);

    if (error) throw error;

    // Update patient status to Reviewed & Prescribed
    await supabase.from('patients').update({ status: 'Reviewed & Prescribed' }).eq('id', patientId);
    await loadBackendData();
  };

  // Record or Update Culture Results into Supabase
  const addCultureResult = async (patientId, cultureData) => {
    if (!isSupabaseConfigured) throw new Error('Database is unconfigured.');

    const { error } = await supabase.from('culture_results').insert([{
      patient_id: patientId,
      status: cultureData.status || 'Completed',
      specimen: cultureData.specimen || 'Blood Culture',
      collected_date: cultureData.collectedDate || new Date().toISOString(),
      result_date: new Date().toISOString(),
      organism: cultureData.organism,
      ai_prediction_match: cultureData.aiPredictionMatch || 'Pending Comparison'
    }]);

    if (error) throw error;
    await loadBackendData();
  };

  return (
    <PatientContext.Provider value={{
      patients,
      users,
      wardSurveillance,
      antibioticUsage,
      aiMetrics,
      loading,
      dbError,
      reloadBackendData: loadBackendData,
      getPatientById,
      addNewPatient,
      updatePatient,
      updateVitals,
      recordDoctorDecision,
      addCultureResult,
      decisionStats,
      searchQuery,
      setSearchQuery,
      selectedRiskFilter,
      setSelectedRiskFilter
    }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => useContext(PatientContext);
