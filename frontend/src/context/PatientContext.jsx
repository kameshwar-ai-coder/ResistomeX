import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { apiService } from '../services/api';
import { map10kRowToPatient } from '../services/datasetHelper';
import initialSamples from '../data/datasetSamples.json';
import Papa from 'papaparse';

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
  const [is10kLoaded, setIs10kLoaded] = useState(false);
  const [datasetTotalCount, setDatasetTotalCount] = useState(initialSamples.length);

  // Doctor Decision Counts
  const [decisionStats, setDecisionStats] = useState({
    accepted: 0,
    modified: 0,
    overridden: 0
  });

  // Load baseline curated 10k clinical cohort
  const loadCuratedBenchmarkCohort = useCallback(() => {
    const formatted = initialSamples.map((row, idx) => map10kRowToPatient(row, idx));
    setPatients(formatted);
    setDatasetTotalCount(initialSamples.length);
    
    // Compute decision stats
    const counts = { accepted: 0, modified: 0, overridden: 0 };
    formatted.forEach(p => {
      const dec = (p.doctorDecision?.decision || p.rawRecord10k?.doctor_decision || '').toLowerCase();
      if (dec === 'accept' || dec === 'accepted') counts.accepted++;
      else if (dec === 'modify' || dec === 'modified') counts.modified++;
      else if (dec === 'override' || dec === 'overridden') counts.overridden++;
    });
    setDecisionStats(counts);

    // Baseline Users
    setUsers([
      { id: 'usr-01', name: 'Dr. Marcus Vance, MD', email: 'dr.vance@resistomex.hospital.org', role: 'Doctor', department: 'Infectious Diseases', status: 'Active' },
      { id: 'usr-02', name: 'RN Sarah Jenkins', email: 's.jenkins@resistomex.hospital.org', role: 'Nurse', department: 'Medical ICU', status: 'Active' },
      { id: 'usr-03', name: 'Dr. Elena Rostova', email: 'e.rostova@resistomex.hospital.org', role: 'Admin', department: 'Antimicrobial Stewardship', status: 'Active' },
      { id: 'usr-04', name: 'Dr. James Wilson, MD', email: 'j.wilson@resistomex.hospital.org', role: 'Doctor', department: 'Critical Care', status: 'Active' },
      { id: 'usr-05', name: 'RN David Chen', email: 'd.chen@resistomex.hospital.org', role: 'Nurse', department: 'Emergency Ward', status: 'Active' }
    ]);

    // Baseline Ward Surveillance
    setWardSurveillance([
      { id: 'w-01', ward_name: 'Medical Intensive Care (MICU)', total_inpatients: 24, high_risk_count: 9, amr_rate_percent: 37.5, stewardship_compliance_percent: 94.2 },
      { id: 'w-02', ward_name: 'Surgical ICU (SICU)', total_inpatients: 18, high_risk_count: 6, amr_rate_percent: 33.3, stewardship_compliance_percent: 91.5 },
      { id: 'w-03', ward_name: 'Hematology & Oncology', total_inpatients: 15, high_risk_count: 5, amr_rate_percent: 31.0, stewardship_compliance_percent: 96.0 },
      { id: 'w-04', ward_name: 'General Internal Medicine', total_inpatients: 32, high_risk_count: 4, amr_rate_percent: 12.5, stewardship_compliance_percent: 97.8 },
      { id: 'w-05', ward_name: 'Emergency Observation Unit', total_inpatients: 12, high_risk_count: 3, amr_rate_percent: 25.0, stewardship_compliance_percent: 92.0 }
    ]);

    // Baseline Antibiotic Usage
    setAntibioticUsage([
      { id: 'abx-01', antibiotic_name: 'Meropenem IV', category: 'Carbapenem (Restricted)', ddd_per_1000_bed_days: 42.5, trend_30d: '-8.2%', status: 'Within Target' },
      { id: 'abx-02', antibiotic_name: 'Piperacillin / Tazobactam', category: 'Anti-pseudomonal Penicillin', ddd_per_1000_bed_days: 68.1, trend_30d: '+2.4%', status: 'Moderate Usage' },
      { id: 'abx-03', antibiotic_name: 'Vancomycin IV', category: 'Glycopeptide (MRSA)', ddd_per_1000_bed_days: 35.8, trend_30d: '-4.1%', status: 'Within Target' },
      { id: 'abx-04', antibiotic_name: 'Ceftriaxone IV', category: '3rd Gen Cephalosporin', ddd_per_1000_bed_days: 88.0, trend_30d: '-11.5%', status: 'Optimized' },
      { id: 'abx-05', antibiotic_name: 'Ciprofloxacin IV', category: 'Fluoroquinolone', ddd_per_1000_bed_days: 19.3, trend_30d: '-15.0%', status: 'Stewardship Priority' }
    ]);

    // Baseline AI Metrics
    setAiMetrics({
      model_name: 'ResistomeX XGBoost v002 (Calibrated)',
      roc_auc: 0.912,
      sensitivity_percent: 88.6,
      specificity_percent: 86.4,
      precision_percent: 82.1,
      f1_score: 0.852,
      last_trained_date: '2026-10-06',
      true_positives: 1840,
      false_positives: 395,
      false_negatives: 236,
      true_negatives: 2529
    });

    setLoading(false);
  }, []);

  // Load all live clinical data from Supabase, with automatic fallback to curated 10k dataset
  const loadBackendData = useCallback(async () => {
    setLoading(true);
    setDbError(null);

    if (!isSupabaseConfigured) {
      // Offline / Local mode: initialize with curated 10k dataset
      loadCuratedBenchmarkCohort();
      return;
    }

    try {
      // 1. Fetch Patients & relations from Supabase
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

      if (dbPatients && dbPatients.length > 0) {
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
            admissionStatus: p.admission_status || 'Admitted',
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
              tempNum: latestVitals.temp_celsius || 37.0,
              hrNum: latestVitals.heart_rate_bpm || 80,
              bpSys: latestVitals.bp_systolic || 120,
              bpDia: latestVitals.bp_diastolic || 80,
              spo2Num: latestVitals.spo2_percent || 98,
              crpNum: latestVitals.crp_mg_l || 0,
              updatedAt: latestVitals.recorded_at ? new Date(latestVitals.recorded_at).toLocaleString() : 'No record'
            },
            history: {
              comorbidities: history.comorbidities || [],
              priorAntibiotics90Days: [],
              priorCultures12Months: [],
              allergies: history.allergies || [],
              drugAllergy: Array.isArray(history.allergies) && history.allergies[0] ? history.allergies[0].allergen : 'None known',
              unitResistanceRate: history.unit_resistance_rate || '22.0%'
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
      } else {
        // Supabase table is empty -> seed with 10k curated dataset
        loadCuratedBenchmarkCohort();
      }

      // 2. Fetch Profiles/Users
      const { data: dbProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (dbProfiles) {
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

      // 4. Ward Surveillance
      const { data: dbWard } = await supabase.from('ward_surveillance').select('*').order('ward_name');
      if (dbWard) setWardSurveillance(dbWard);

      // 5. Antibiotic Usage
      const { data: dbAbx } = await supabase.from('antibiotic_usage_stats').select('*').order('ddd_per_1000_bed_days', { ascending: false });
      if (dbAbx) setAntibioticUsage(dbAbx);

      // 6. AI Model Metrics
      const { data: dbMetrics } = await supabase.from('ai_model_metrics').select('*').limit(1).single();
      if (dbMetrics) setAiMetrics(dbMetrics);

    } catch (err) {
      console.warn('[PatientContext] Supabase sync issue, falling back to 10k dataset:', err.message);
      loadCuratedBenchmarkCohort();
    } finally {
      setLoading(false);
    }
  }, [loadCuratedBenchmarkCohort]);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Load the full 10,000 dataset into client state via public CSV stream or backend
  const loadFull10kDataset = async (limit = 10000) => {
    setLoading(true);
    try {
      // 1. Try fetching from public data URL (streaming 10,000 cohort)
      const response = await fetch('/data/resistomex_cohort_v2_10000.csv');
      if (response.ok) {
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedRows = limit ? results.data.slice(0, limit) : results.data;
            const formatted = parsedRows.map((row, idx) => map10kRowToPatient(row, idx)).filter(Boolean);
            setPatients(formatted);
            setDatasetTotalCount(results.data.length);
            setIs10kLoaded(true);
            setLoading(false);
          },
          error: (err) => {
            console.error('[PapaParse Error]:', err);
            setLoading(false);
          }
        });
        return;
      }
    } catch (e) {
      console.warn('Public CSV stream unavailable, querying backend dataset API:', e);
    }

    // 2. Fallback to backend dataset API
    try {
      const res = await apiService.searchDataset({ limit });
      if (res.success && res.data?.records) {
        const formatted = res.data.records.map((r, i) => map10kRowToPatient(r, i));
        setPatients(formatted);
        setDatasetTotalCount(res.data.total || formatted.length);
        setIs10kLoaded(true);
      }
    } catch (err) {
      console.error('Failed to load dataset via API:', err);
    } finally {
      setLoading(false);
    }
  };

  // Batch import patients (from CSV, Excel, or EHR upload)
  const importPatientsFromDataset = (records) => {
    if (!Array.isArray(records) || records.length === 0) return;
    const formatted = records.map((r, i) => map10kRowToPatient(r, i)).filter(Boolean);
    setPatients(formatted);
    setDatasetTotalCount(formatted.length);
    setIs10kLoaded(true);
    return formatted;
  };

  const getPatientById = (id) => {
    if (!id) return null;
    return patients.find(p => p.id === id || p.displayId === id || p.mrn === id || p.encounterId === id) || null;
  };

  // Add new patient (supports full 62-column schema)
  const addNewPatient = async (patientData) => {
    // Normalization & AMR Risk Calculation
    const hasPriorAntibiotics = Boolean(
      (patientData.prior_antibiotic_exposure_count_90d && parseInt(patientData.prior_antibiotic_exposure_count_90d) > 0) ||
      (patientData.prior_antibiotic_90d && patientData.prior_antibiotic_90d !== 'None' && patientData.prior_antibiotic_90d !== 'None known') ||
      (patientData.priorAntibiotics && patientData.priorAntibiotics.length > 0)
    );
    const isICU = (patientData.ward || '').includes('ICU');
    const hasResistantHistory = patientData.prior_resistant_organism && patientData.prior_resistant_organism !== 'None known';

    let riskScore = 25;
    if (hasPriorAntibiotics) riskScore += 30;
    if (isICU) riskScore += 25;
    if (hasResistantHistory) riskScore += 20;

    let riskLevel = 'Low';
    if (riskScore >= 70) riskLevel = 'High';
    else if (riskScore >= 40) riskLevel = 'Medium';

    const tempNum = parseFloat(patientData.temperature_c || patientData.temp) || 37.0;
    const hrNum = parseInt(patientData.heart_rate_bpm || patientData.hr) || 80;
    const bpParts = (patientData.bp || `${patientData.systolic_bp_mmhg || 120}/${patientData.diastolic_bp_mmhg || 80}`).split('/');
    const bpSys = parseInt(bpParts[0]) || 120;
    const bpDia = parseInt(bpParts[1]) || 80;
    const spo2Num = parseInt(patientData.spo2_percent || patientData.spo2) || 98;
    const rrNum = parseInt(patientData.respiratory_rate_bpm || patientData.rr) || 18;
    const crpNum = parseFloat(patientData.crp_mg_l || patientData.crp) || 25.0;

    const patientId = patientData.patient_id || `PX-${Math.floor(100000 + Math.random() * 900000)}`;
    const encounterId = patientData.encounter_id || `ENC-${Math.floor(20250000 + Math.random() * 90000)}`;
    const mrn = patientData.mrn || `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const patientName = patientData.patient_name || patientData.name || 'New Inpatient';

    const newPatientObj = map10kRowToPatient({
      patient_id: patientId,
      encounter_id: encounterId,
      patient_name: patientName,
      age_years: parseFloat(patientData.age_years || patientData.age) || 60,
      sex: patientData.sex || patientData.gender || 'Male',
      pregnancy_status: patientData.pregnancy_status || 'Not applicable',
      ward: patientData.ward || 'General Medicine',
      bed: patientData.bed || 'Bed 01',
      admission_datetime: patientData.admission_datetime || new Date().toISOString().split('T')[0],
      primary_diagnosis: patientData.primary_diagnosis || patientData.primaryDiagnosis || 'Acute Infection',
      infection_source: patientData.infection_source || patientData.infectionSource || 'Bloodstream / Sepsis',
      suspected_pathogen: patientData.suspected_pathogen || patientData.suspectedPathogen || 'Gram-negative Bacilli',
      temperature_c: tempNum,
      heart_rate_bpm: hrNum,
      systolic_bp_mmhg: bpSys,
      diastolic_bp_mmhg: bpDia,
      spo2_percent: spo2Num,
      respiratory_rate_bpm: rrNum,
      crp_mg_l: crpNum,
      comorbidities: patientData.comorbidities || '',
      kidney_function: patientData.kidney_function || 'Normal',
      liver_function: patientData.liver_function || 'Normal',
      drug_allergy: patientData.drug_allergy || patientData.allergies || 'None known',
      allergy_severity: patientData.allergy_severity || 'None',
      prior_antibiotic_exposure_count_90d: parseInt(patientData.prior_antibiotic_exposure_count_90d) || (hasPriorAntibiotics ? 1 : 0),
      prior_antibiotic_90d: patientData.prior_antibiotic_90d || patientData.priorAntibiotics || 'None in prior 90 days',
      prior_antibiotic_days: parseInt(patientData.prior_antibiotic_days) || 5,
      prior_resistant_organism: patientData.prior_resistant_organism || 'None known',
      ward_endemic_resistance_rate: parseFloat(patientData.ward_endemic_resistance_rate) || 0.25,
      amr_risk_category: riskLevel,
      amr_probability_percent: riskScore,
      amr_probability: riskScore / 100,
      ai_first_line_option: patientData.ai_first_line_option || (riskLevel === 'High' ? 'Meropenem + Vancomycin' : 'Ceftriaxone 2g IV q24h'),
      ai_alternative_option: patientData.ai_alternative_option || 'Ceftazidime-Avibactam',
      doctor_decision: patientData.doctor_decision || 'Pending',
      culture_status: patientData.culture_status || 'Pending Lab',
      culture_pathogen: patientData.culture_pathogen || 'Pending',
      clinical_note_for_llm: patientData.clinical_note_for_llm || patientData.outcomeNotes || ''
    });

    // Save to local state first
    setPatients(prev => [newPatientObj, ...prev]);

    // If Supabase is configured, write to tables asynchronously
    if (isSupabaseConfigured) {
      try {
        const { data: dbPatient, error: insertErr } = await supabase
          .from('patients')
          .insert([{
            display_id: patientId,
            mrn: mrn,
            name: patientName,
            age: parseInt(patientData.age_years || patientData.age) || 60,
            gender: patientData.sex || patientData.gender || 'Male',
            bed: patientData.bed || 'Bed 01',
            ward: patientData.ward || 'General Medicine',
            admission_date: new Date().toISOString().split('T')[0],
            primary_diagnosis: patientData.primary_diagnosis || patientData.primaryDiagnosis,
            infection_source: patientData.infection_source || patientData.infectionSource,
            suspected_pathogen: patientData.suspected_pathogen || patientData.suspectedPathogen,
            status: 'Needs Review'
          }])
          .select()
          .single();

        if (!insertErr && dbPatient) {
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
            comorbidities: patientData.comorbidities ? (typeof patientData.comorbidities === 'string' ? patientData.comorbidities.split(';') : patientData.comorbidities) : [],
            allergies: patientData.drug_allergy ? [{ allergen: patientData.drug_allergy, reaction: 'Allergy', severity: 'Moderate' }] : []
          }]);

          // Insert AMR Risk Assessment Baseline
          await supabase.from('amr_risk_assessments').insert([{
            patient_id: dbPatient.id,
            risk_level: riskLevel,
            risk_score: riskScore,
            model_version: 'ResistomeX XGBoost v2.4'
          }]);
        }
      } catch (err) {
        console.warn('Supabase insert skipped or failed:', err.message);
      }
    }

    return newPatientObj;
  };

  // Role-Specific Assessment & Patient Updates
  const updatePatientRoleData = async (patientId, role, updates) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId && p.displayId !== patientId) return p;

      const updated = { ...p };

      if (role === 'doctor' || role === 'physician') {
        if (updates.primary_diagnosis) updated.primaryDiagnosis = updates.primary_diagnosis;
        if (updates.suspected_pathogen) updated.suspectedPathogen = updates.suspected_pathogen;
        if (updates.infection_source) updated.infectionSource = updates.infection_source;
        if (updates.doctor_decision) updated.doctorDecision = { ...updated.doctorDecision, decision: updates.doctor_decision };
        if (updates.doctor_decision_rationale) updated.doctorDecision = { ...updated.doctorDecision, rationale: updates.doctor_decision_rationale };
        if (updates.current_empiric_regimen) updated.doctorDecision = { ...updated.doctorDecision, currentRegimen: updates.current_empiric_regimen };
        if (updates.clinical_note_for_llm) updated.outcomeNotes = updates.clinical_note_for_llm;
        if (updates.status) updated.status = updates.status;
      }

      if (role === 'nurse') {
        if (updates.temperature_c || updates.heart_rate_bpm || updates.systolic_bp_mmhg || updates.spo2_percent) {
          const temp = parseFloat(updates.temperature_c || updated.vitals.tempNum);
          const hr = parseInt(updates.heart_rate_bpm || updated.vitals.hrNum);
          const bpSys = parseInt(updates.systolic_bp_mmhg || updated.vitals.bpSys);
          const bpDia = parseInt(updates.diastolic_bp_mmhg || updated.vitals.bpDia);
          const spo2 = parseInt(updates.spo2_percent || updated.vitals.spo2Num);
          const rr = parseInt(updates.respiratory_rate_bpm || updated.vitals.rrNum || 18);
          const crp = parseFloat(updates.crp_mg_l || updated.vitals.crpNum || 0);

          updated.vitals = {
            temp: `${temp} °C`,
            hr: `${hr} bpm`,
            bp: `${bpSys}/${bpDia} mmHg`,
            spo2: `${spo2}%`,
            rr: `${rr} bpm`,
            crp: `${crp} mg/L`,
            tempNum: temp,
            hrNum: hr,
            bpSys: bpSys,
            bpDia: bpDia,
            spo2Num: spo2,
            rrNum: rr,
            crpNum: crp,
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          updated.monitoringTimeline = [
            {
              id: `v-${Date.now()}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              temp: temp,
              hr: hr,
              bp: `${bpSys}/${bpDia}`,
              crp: crp,
              status: (temp >= 38.5 || spo2 < 94) ? 'Needs Attention' : 'Stable'
            },
            ...(updated.monitoringTimeline || [])
          ];
        }
        if (updates.bed) updated.bed = updates.bed;
        if (updates.ward) updated.ward = updates.ward;
      }

      if (role === 'lab' || role === 'microbiology') {
        updated.cultureResult = {
          ...updated.cultureResult,
          status: updates.culture_status || updated.cultureResult.status,
          organism: updates.culture_pathogen || updated.cultureResult.organism,
          resistancePhenotype: updates.resistance_phenotype || updated.cultureResult.resistancePhenotype,
          match: updates.culture_match_to_predicted_risk || updated.cultureResult.match,
          resultDate: updates.culture_result_datetime || new Date().toLocaleString()
        };
      }

      if (role === 'admin') {
        if (updates.ward) updated.ward = updates.ward;
        if (updates.admission_status) updated.admissionStatus = updates.admission_status;
        if (updates.ward_endemic_resistance_rate) {
          updated.history.wardEndemicResistanceRate = parseFloat(updates.ward_endemic_resistance_rate);
          updated.history.unitResistanceRate = `${(parseFloat(updates.ward_endemic_resistance_rate) * 100).toFixed(1)}%`;
        }
      }

      return updated;
    }));
  };

  // Update existing patient
  const updatePatient = async (patientId, updates) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...updates } : p));
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('patients')
          .update({
            status: updates.status,
            ward: updates.ward,
            bed: updates.bed,
            primary_diagnosis: updates.primaryDiagnosis,
            updated_at: new Date().toISOString()
          })
          .eq('id', patientId);
      } catch (e) {
        console.warn('Supabase update failed:', e);
      }
    }
  };

  // Record Vitals
  const updateVitals = async (patientId, newVitals) => {
    await updatePatientRoleData(patientId, 'nurse', {
      temperature_c: newVitals.temp,
      heart_rate_bpm: newVitals.hr,
      systolic_bp_mmhg: newVitals.bp?.split('/')[0],
      diastolic_bp_mmhg: newVitals.bp?.split('/')[1],
      spo2_percent: newVitals.spo2,
      respiratory_rate_bpm: newVitals.rr,
      crp_mg_l: newVitals.crp
    });
  };

  // Record Doctor Decision with rich structured active learning dimensions
  const recordDoctorDecision = async (patientId, optionName, rationale, decisionType = 'accept', detailedData = {}) => {
    const p = patients.find(pt => pt.id === patientId);
    
    // Update local patient status and doctor assessment
    await updatePatientRoleData(patientId, 'doctor', {
      doctor_decision: decisionType.toUpperCase(),
      doctor_decision_rationale: rationale,
      current_empiric_regimen: optionName,
      status: `Prescribed: ${optionName}`,
      lastDecisionData: {
        decisionType: decisionType.toUpperCase(),
        chosenOption: optionName,
        rationale,
        decidedAt: new Date().toISOString(),
        ...detailedData
      }
    });

    setDecisionStats(prev => {
      const type = decisionType.toLowerCase();
      return {
        ...prev,
        accepted: type === 'accept' ? prev.accepted + 1 : prev.accepted,
        modified: type === 'modify' ? prev.modified + 1 : prev.modified,
        overridden: type === 'override' ? prev.overridden + 1 : prev.overridden
      };
    });

    // Sync with backend Active Learning loop
    try {
      const payload = {
        patient_id: patientId,
        decision_type: decisionType.toUpperCase(),
        chosen_option: optionName,
        rationale: rationale,
        decided_by: 'Dr. Marcus Vance, MD',
        infection_source: p?.infectionSource || p?.primaryDiagnosis || 'Unknown',
        patient_ward: p?.ward || 'ICU',
        patient_age: p?.age ? parseInt(p.age) : 65,
        predicted_amr_prob: p?.amrRiskScore ? p.amrRiskScore / 100 : 0.75,
        ...detailedData
      };

      await fetch('http://localhost:8000/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Backend decision active learning sync skipped (offline mode):', e);
    }
  };

  // Record Microbiology Culture Report & Ground-Truth Validation
  const addCultureResult = async (patientId, cultureData) => {
    const p = patients.find(pt => pt.id === patientId);

    // Local state update with full antibiogram panel
    await updatePatientRoleData(patientId, 'lab', {
      culture_status: cultureData.status || 'Verified & Released',
      culture_pathogen: cultureData.organism,
      resistance_phenotype: cultureData.resistancePhenotype,
      culture_match_to_predicted_risk: cultureData.aiPredictionMatch || 'Concordant Match (True Positive)',
      culture_result_datetime: cultureData.resultDate || new Date().toLocaleString(),
      specimen: cultureData.specimen
    });

    setPatients(prev => prev.map(pt => {
      if (pt.id === patientId) {
        return {
          ...pt,
          cultureResult: {
            id: cultureData.reportId || `CULT-${Date.now()}`,
            status: cultureData.status || 'Verified & Released',
            specimen: cultureData.specimen || 'Blood Culture',
            organism: cultureData.organism || 'Identified Pathogen',
            resistancePhenotype: cultureData.resistancePhenotype || 'ESBL Producer',
            resultDate: cultureData.resultDate || new Date().toLocaleString(),
            aiPredictionMatch: cultureData.aiPredictionMatch || 'Concordant True Positive (Ground Truth Verified)',
            concordanceStatus: cultureData.concordanceStatus || 'CONCORDANT',
            prescribedRegimenEffective: cultureData.prescribedRegimenEffective ?? true,
            prescribedRegimenCoverageStatus: cultureData.prescribedRegimenCoverageStatus || 'Susceptible Coverage Confirmed',
            advisory: cultureData.advisory || 'Microbiology outcome verified. Learning loop closed.',
            sensitivities: cultureData.sensitivities || []
          }
        };
      }
      return pt;
    }));

    // Sync with backend Ground-Truth Active Learning loop
    try {
      const payload = {
        patient_id: patientId,
        specimen: cultureData.specimen || 'Blood Culture',
        organism: cultureData.organism || 'Klebsiella pneumoniae',
        resistance_phenotype: cultureData.resistancePhenotype || 'ESBL Producer',
        sensitivities: cultureData.sensitivities || [],
        lab_technician: cultureData.labTechnician || 'Microbiology Specialist',
        prescribed_regimen: p?.status?.replace('Prescribed: ', '') || 'Meropenem 1g IV q8h',
        predicted_amr_prob: p?.amrRiskScore ? p.amrRiskScore / 100 : 0.75,
        predicted_risk_level: p?.amrRiskLevel || 'High'
      };

      const res = await fetch('http://localhost:8000/api/culture/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend culture validation loop sync skipped (offline mode):', e);
      return null;
    }
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
      is10kLoaded,
      datasetTotalCount,
      loadFull10kDataset,
      loadCuratedBenchmarkCohort,
      importPatientsFromDataset,
      reloadBackendData: loadBackendData,
      getPatientById,
      addNewPatient,
      updatePatientRoleData,
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
