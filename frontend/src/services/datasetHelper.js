// ResistomeX 10k Dataset Helper & Normalizer
// Provides complete transformation, column mappings, and clinical record converters matching the 10k schema

export const DATASET_10K_COLUMNS = [
  'patient_id',
  'encounter_id',
  'validated_record',
  'admission_datetime',
  'patient_name',
  'age_years',
  'sex',
  'pregnancy_status',
  'ward',
  'bed',
  'patient_status',
  'primary_diagnosis',
  'infection_source',
  'suspected_pathogen',
  'temperature_c',
  'heart_rate_bpm',
  'systolic_bp_mmhg',
  'diastolic_bp_mmhg',
  'spo2_percent',
  'respiratory_rate_bpm',
  'crp_mg_l',
  'comorbidities',
  'kidney_function',
  'liver_function',
  'drug_allergy',
  'allergy_severity',
  'prior_antibiotic_exposure_count_90d',
  'prior_antibiotic_90d',
  'prior_antibiotic_days',
  'prior_resistant_organism',
  'ward_endemic_resistance_rate',
  'amr_probability',
  'amr_probability_percent',
  'amr_risk_category',
  'esbl_ecoli_kp_probability',
  'mrsa_probability',
  'mdr_pseudomonas_probability',
  'cre_probability',
  'shap_prior_antibiotic',
  'shap_prior_resistant_culture',
  'shap_ward_resistance',
  'shap_icu',
  'shap_comorbidity',
  'shap_vitals',
  'ai_explanation',
  'ai_first_line_option',
  'ai_alternative_option',
  'coverage_score_percent',
  'renal_safety_note',
  'safety_warnings',
  'doctor_decision',
  'doctor_decision_rationale',
  'current_empiric_regimen',
  'culture_status',
  'culture_collection_datetime',
  'culture_pathogen',
  'resistance_phenotype',
  'culture_match_to_predicted_risk',
  'treatment_outcome',
  'deterioration_flag',
  'edge_case_flag',
  'clinical_note_for_llm'
];

/**
 * Maps any raw 10k row or uploaded CSV/Excel row into a standard ResistomeX patient state object.
 */
export const map10kRowToPatient = (row, index = 0) => {
  if (!row) return null;

  const patientId = String(row.patient_id || row.display_id || row.id || `PX-${100000 + index}`);
  const encounterId = String(row.encounter_id || `ENC-${20250000 + index}`);
  const patientName = row.patient_name || row.name || `Clinical Patient ${(index + 1).toString().padStart(4, '0')}`;
  const age = parseFloat(row.age_years || row.age) || 60;
  const gender = row.sex || row.gender || 'Male';
  const ward = row.ward || 'General Medicine';
  const bed = String(row.bed || `Bed ${(index % 20) + 1}`).startsWith('Bed') ? String(row.bed || `Bed ${(index % 20) + 1}`) : `Bed ${row.bed}`;
  
  const admissionDate = row.admission_datetime || row.admission_date || new Date().toISOString().split('T')[0];
  const primaryDiagnosis = row.primary_diagnosis || row.diagnosis || 'Complicated Infection';
  const infectionSource = row.infection_source || 'Bloodstream / Sepsis';
  const suspectedPathogen = row.suspected_pathogen || 'Gram-negative Bacilli';

  // Risk Scores
  const riskCategory = row.amr_risk_category || (row.amr_probability_percent >= 70 ? 'High' : row.amr_probability_percent >= 40 ? 'Medium' : 'Low') || 'Low';
  const riskScore = row.amr_probability_percent !== undefined && row.amr_probability_percent !== ''
    ? Math.round(parseFloat(row.amr_probability_percent))
    : row.amr_probability
      ? Math.round(parseFloat(row.amr_probability) * 100)
      : riskCategory === 'High' ? 82 : riskCategory === 'Medium' ? 55 : 24;

  // Vitals
  const temp = parseFloat(row.temperature_c || row.temp) || 38.0;
  const hr = parseInt(row.heart_rate_bpm || row.hr) || 88;
  const bpSys = parseInt(row.systolic_bp_mmhg || (row.bp ? row.bp.split('/')[0] : 120)) || 120;
  const bpDia = parseInt(row.diastolic_bp_mmhg || (row.bp ? row.bp.split('/')[1] : 80)) || 80;
  const spo2 = parseInt(row.spo2_percent || row.spo2) || 97;
  const rr = parseInt(row.respiratory_rate_bpm || row.rr) || 18;
  const crp = parseFloat(row.crp_mg_l || row.crp) || 28.5;

  // Comorbidities & Allergies
  const comorbiditiesStr = row.comorbidities || '';
  const comorbidities = typeof comorbiditiesStr === 'string'
    ? comorbiditiesStr.split(/[;,]/).map(s => s.trim()).filter(Boolean)
    : Array.isArray(comorbiditiesStr) ? comorbiditiesStr : [];

  const allergiesStr = row.drug_allergy || row.allergies || 'None known';
  const allergies = allergiesStr !== 'None known' && allergiesStr !== 'None' && allergiesStr
    ? [{ allergen: allergiesStr, reaction: 'Documented Allergy', severity: row.allergy_severity || 'Moderate' }]
    : [];

  // Culture
  const cultureStatus = row.culture_status || 'Unavailable';
  const culturePathogen = row.culture_pathogen || 'Pending / Unavailable';
  const resistancePhenotype = row.resistance_phenotype || 'Unknown';
  const cultureMatch = row.culture_match_to_predicted_risk || 'Pending';

  // Decisions & Regimens
  const doctorDecision = row.doctor_decision || 'Pending';
  const doctorDecisionRationale = row.doctor_decision_rationale || '';
  const currentRegimen = row.current_empiric_regimen || row.ai_first_line_option || 'Meropenem 1g IV q8h';
  const treatmentOutcome = row.treatment_outcome || 'Under Observation';
  const admissionStatus = (row.patient_status === 'Discharged' || treatmentOutcome === 'Cured & Discharged')
    ? 'Recovered & Discharged'
    : 'Admitted';

  return {
    id: patientId,
    displayId: patientId,
    mrn: `MRN-${patientId.replace(/[^0-9]/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000)}`,
    encounterId: encounterId,
    name: patientName,
    age: age,
    gender: gender,
    pregnancyStatus: row.pregnancy_status || 'Not applicable',
    ward: ward,
    bed: bed,
    admissionDate: admissionDate,
    dischargeDate: row.discharge_datetime || null,
    admissionStatus: admissionStatus,
    outcomeNotes: row.clinical_note_for_llm || `${treatmentOutcome} - Regimen: ${currentRegimen}`,
    primaryDiagnosis: primaryDiagnosis,
    infectionSource: infectionSource,
    suspectedPathogen: suspectedPathogen,
    amrRiskLevel: riskCategory,
    amrRiskScore: riskScore,
    status: doctorDecision !== 'Pending' ? `Decision: ${doctorDecision}` : 'Needs Review',
    rawRecord10k: row, // Preserves all 62 columns for deep explainability & audit

    // Detailed 10k Sub-schemas
    vitals: {
      temp: `${temp} °C`,
      hr: `${hr} bpm`,
      bp: `${bpSys}/${bpDia} mmHg`,
      spo2: `${spo2}%`,
      rr: `${rr} bpm`,
      crp: `${crp} mg/L`,
      wbc: row.wbc_count ? `${row.wbc_count} x10³/µL` : '--',
      lactate: row.lactate_mmol_l ? `${row.lactate_mmol_l} mmol/L` : '--',
      tempNum: temp,
      hrNum: hr,
      bpSys: bpSys,
      bpDia: bpDia,
      spo2Num: spo2,
      rrNum: rr,
      crpNum: crp,
      updatedAt: admissionDate
    },

    organFunction: {
      kidney: row.kidney_function || 'Normal',
      liver: row.liver_function || 'Normal'
    },

    history: {
      comorbidities: comorbidities,
      allergies: allergies,
      drugAllergy: allergiesStr,
      allergySeverity: row.allergy_severity || 'None',
      priorAntibioticCount90d: parseInt(row.prior_antibiotic_exposure_count_90d) || 0,
      priorAntibiotic90d: row.prior_antibiotic_90d || 'None in prior 90 days',
      priorAntibioticDays: parseInt(row.prior_antibiotic_days) || 0,
      priorResistantOrganism: row.prior_resistant_organism || 'None known',
      wardEndemicResistanceRate: parseFloat(row.ward_endemic_resistance_rate) || 0.25,
      unitResistanceRate: row.ward_endemic_resistance_rate ? `${(parseFloat(row.ward_endemic_resistance_rate) * 100).toFixed(1)}%` : '25.0%'
    },

    aiPrediction: {
      amrProbability: parseFloat(row.amr_probability) || (riskScore / 100),
      amrProbabilityPercent: riskScore,
      riskCategory: riskCategory,
      esblProb: parseFloat(row.esbl_ecoli_kp_probability) || 0.35,
      mrsaProb: parseFloat(row.mrsa_probability) || 0.22,
      mdrPseudomonasProb: parseFloat(row.mdr_pseudomonas_probability) || 0.28,
      creProb: parseFloat(row.cre_probability) || 0.12,
      firstLineOption: row.ai_first_line_option || 'Meropenem + Vancomycin',
      alternativeOption: row.ai_alternative_option || 'Ceftazidime-Avibactam',
      coverageScore: parseFloat(row.coverage_score_percent) || 90.0,
      renalSafetyNote: row.renal_safety_note || 'Standard renal dosing',
      safetyWarnings: row.safety_warnings || 'None',
      explanation: row.ai_explanation || `AMR risk assessed at ${riskScore}% (${riskCategory}) based on clinical features and prior history.`
    },

    shapAttributions: {
      priorAntibiotic: parseFloat(row.shap_prior_antibiotic) || 0.0,
      priorResistantCulture: parseFloat(row.shap_prior_resistant_culture) || 0.0,
      wardResistance: parseFloat(row.shap_ward_resistance) || 0.0,
      icu: parseFloat(row.shap_icu) || 0.0,
      comorbidity: parseFloat(row.shap_comorbidity) || 0.0,
      vitals: parseFloat(row.shap_vitals) || 0.0
    },

    doctorDecision: {
      decision: doctorDecision,
      rationale: doctorDecisionRationale,
      currentRegimen: currentRegimen,
      decidedAt: row.doctor_decision_datetime || null
    },

    cultureResult: {
      status: cultureStatus,
      organism: culturePathogen,
      resistancePhenotype: resistancePhenotype,
      match: cultureMatch,
      collectedDate: row.culture_collection_datetime || '',
      resultDate: row.culture_result_datetime || '',
      specimen: row.infection_source || 'Blood / Sputum / Urine'
    },

    outcome: {
      treatmentOutcome: treatmentOutcome,
      deteriorationFlag: row.deterioration_flag || 'No',
      edgeCaseFlag: row.edge_case_flag || 'No',
      clinicalNote: row.clinical_note_for_llm || ''
    },

    monitoringTimeline: [
      {
        id: `vital-${patientId}-1`,
        time: admissionDate,
        temp: temp,
        hr: hr,
        bp: `${bpSys}/${bpDia}`,
        crp: crp,
        status: (temp >= 38.5 || spo2 < 94) ? 'Needs Attention' : 'Stable'
      }
    ]
  };
};
