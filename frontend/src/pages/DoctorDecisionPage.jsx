import React, { useState } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { PatientHeader } from '../components/PatientHeader';
import {
  CheckCircle2,
  Sliders,
  AlertOctagon,
  Sparkles,
  Brain,
  ShieldCheck,
  RotateCcw,
  Zap,
  Info,
  Clock,
  Pill,
  ArrowRight,
  HelpCircle,
  Database,
  Flame
} from 'lucide-react';

export const DoctorDecisionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPatientById, recordDoctorDecision, loading, dbError } = usePatients();
  const patient = getPatientById(id);

  // Core Decision Mode: 'accept' | 'modify' | 'override'
  const [decisionChoice, setDecisionChoice] = useState('accept');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [learningFeedbackResult, setLearningFeedbackResult] = useState(null);

  // -------------------------------------------------------------------------
  // 1. ACCEPT STATE
  // -------------------------------------------------------------------------
  const [confirmedPathogens, setConfirmedPathogens] = useState(['ESBL Enterobacterales', 'Pseudomonas aeruginosa']);
  const [confirmedDuration, setConfirmedDuration] = useState(7);
  const [therapeuticIntent, setTherapeuticIntent] = useState('Empiric First-Line');
  const [agreedDrivers, setAgreedDrivers] = useState(['Prior 90-Day Antibiotic Exposure', 'Unit Endemic Resistance Rate']);
  const [acceptRationale, setAcceptRationale] = useState(
    'Proceeding with AI recommended empiric regimen (Meropenem 1g IV q8h). High concordance with patient acute risk profile and suspected bacteremia source.'
  );

  // -------------------------------------------------------------------------
  // 2. MODIFY STATE
  // -------------------------------------------------------------------------
  const [modificationCategory, setModificationCategory] = useState('Dose Adjustment (Renal Clearance / AKI)');
  const [modifiedDrug, setModifiedDrug] = useState('Meropenem');
  const [modifiedDosage, setModifiedDosage] = useState('500mg');
  const [modifiedFrequency, setModifiedFrequency] = useState('q8h');
  const [modifiedRoute, setModifiedRoute] = useState('IV (Extended Infusion 3h)');
  const [modifiedDuration, setModifiedDuration] = useState(7);
  const [clinicalJustification, setClinicalJustification] = useState('Moderate CKD (eGFR 42 mL/min) requires renal dose calibration to avoid drug accumulation.');
  const [overweightedFeatures, setOverweightedFeatures] = useState(['Baseline Patient Age']);
  const [underweightedFeatures, setUnderweightedFeatures] = useState(['Renal Clearance / eGFR']);

  // -------------------------------------------------------------------------
  // 3. OVERRIDE STATE
  // -------------------------------------------------------------------------
  const [overrideReason, setOverrideReason] = useState('Disagreement with AMR Risk Score (Clinical Assessment is Low Risk)');
  const [customDrug, setCustomDrug] = useState('Piperacillin-Tazobactam 3.375g IV q6h');
  const [customDosage, setCustomDosage] = useState('3.375g');
  const [customFrequency, setCustomFrequency] = useState('q6h');
  const [customRoute, setCustomRoute] = useState('IV Infusion');
  const [customDuration, setCustomDuration] = useState(5);
  const [disagreedAssumptions, setDisagreedAssumptions] = useState(['AMR Risk Score was Overestimated (False High)', 'Inappropriate Broad Spectrum for Source']);
  const [overrideRationale, setOverrideRationale] = useState(
    'Overriding carbapenem recommendation. Patient hemodynamically stable without septic shock; de-escalating to Piperacillin-Tazobactam per antimicrobial stewardship protocol.'
  );

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <PatientHeader />
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading doctor decision portal...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <PatientHeader />
        <div className="p-8 text-center bg-red-50 text-red-900 rounded-xl border border-red-200 space-y-2">
          <span className="material-symbols-outlined text-3xl text-red-600">error</span>
          <p className="text-sm font-bold">Unable to load decision portal from database.</p>
          <p className="text-xs text-red-700">{dbError}</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <PatientHeader />
        <div className="p-12 text-center text-[#5a5b82] space-y-2 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-4xl text-[#8e8ea9]">person_off</span>
          <p className="text-base font-bold text-[#111124]">Patient record not found.</p>
          <p className="text-xs">The requested patient record could not be retrieved from the database.</p>
        </div>
      </div>
    );
  }

  // Toggle helpers for multi-select checkboxes
  const toggleArrayItem = (setter, currentList, item) => {
    if (currentList.includes(item)) {
      setter(currentList.filter(i => i !== item));
    } else {
      setter([...currentList, item]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalRegimen = '';
    let finalRationale = '';
    let detailedData = {};

    if (decisionChoice === 'accept') {
      finalRegimen = 'Meropenem 1g IV q8h';
      finalRationale = acceptRationale;
      detailedData = {
        confirmed_pathogens: confirmedPathogens,
        confirmed_risk_level: patient.amrRiskLevel,
        confirmed_duration_days: confirmedDuration,
        therapeutic_intent: therapeuticIntent,
        agreed_shap_features: agreedDrivers,
        feedback_reward_score: 1.0
      };
    } else if (decisionChoice === 'modify') {
      finalRegimen = `${modifiedDrug} ${modifiedDosage} ${modifiedRoute} ${modifiedFrequency}`;
      finalRationale = `${clinicalJustification} | Modification note: ${modifiedDrug} ${modifiedDosage} for ${modifiedDuration} days.`;
      detailedData = {
        modification_category: modificationCategory,
        modified_drug: modifiedDrug,
        modified_dosage: modifiedDosage,
        modified_frequency: modifiedFrequency,
        modified_route: modifiedRoute,
        modified_duration_days: modifiedDuration,
        clinical_justification: clinicalJustification,
        overweighted_features: overweightedFeatures,
        underweighted_features: underweightedFeatures,
        feedback_reward_score: 0.5
      };
    } else {
      finalRegimen = customDrug;
      finalRationale = overrideRationale;
      detailedData = {
        override_reason: overrideReason,
        custom_drug: customDrug,
        custom_dosage: customDosage,
        custom_frequency: customFrequency,
        custom_route: customRoute,
        custom_duration_days: customDuration,
        disagreed_ai_assumptions: disagreedAssumptions,
        feedback_reward_score: -1.0
      };
    }

    await recordDoctorDecision(patient.id, finalRegimen, finalRationale, decisionChoice, detailedData);
    setIsSubmitted(true);
    setLearningFeedbackResult({
      decisionType: decisionChoice.toUpperCase(),
      regimen: finalRegimen,
      reward: decisionChoice === 'accept' ? '+1.0 (Positive Reinforcement)' : decisionChoice === 'modify' ? '+0.5 (Calibration Gradient)' : '-1.0 (Negative Penalty & Custom Regimen Cataloged)',
      learningNote: decisionChoice === 'accept'
        ? `Model reinforced for ${patient.infectionSource} empiric carbapenem coverage in ${patient.amrRiskLevel} risk.`
        : decisionChoice === 'modify'
        ? `LLM learned ${modificationCategory} for ${modifiedDrug}. Next time similar clinical parameters occur, the LLM will suggest this calibrated regimen.`
        : `LLM stored clinician override rationale. Regimen '${customDrug}' indexed in Few-Shot knowledge memory for future cases.`
    });

    // Auto navigate to Patient Monitoring after brief confirmation
    setTimeout(() => {
      navigate(`/doctor/patient/${patient.id}/monitoring`);
    }, 1800);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      <PatientHeader />

      {/* Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ededf1]">
        <div className="flex items-center gap-1.5 text-xs text-[#5a5b82]">
          <NavLink to="/doctor/patients" className="hover:text-[#111124]">Patients</NavLink>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="hover:text-[#111124]">{patient.name} ({patient.mrn})</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <NavLink to={`/doctor/patient/${patient.id}/treatment-support`} className="hover:text-[#111124]">Treatment Support</NavLink>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#111124] font-bold">Doctor Decision & Continuous ML Learning</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-semibold">
          <Brain className="w-3.5 h-3.5 text-indigo-600" />
          <span>Active Learning & LLM Memory Loop Active</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111124] tracking-tight flex items-center gap-2">
            <span>Doctor Clinical Decision Portal</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              Online Calibration
            </span>
          </h1>
          <p className="text-xs text-[#5a5b82] mt-0.5">
            Record your verified clinical determination. Every Accept, Modify, or Override feeds the continuous active learning loop to improve future AI suggestions.
          </p>
        </div>
      </div>

      {/* Post-Submission Learning Toast */}
      {isSubmitted && learningFeedbackResult && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Clinical Decision Saved & Ingested into LLM/ML Active Learning Buffer!</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-emerald-900 bg-white/70 p-3 rounded-lg border border-emerald-200">
            <div><strong>Prescribed Regimen:</strong> {learningFeedbackResult.regimen}</div>
            <div><strong>Active Learning Signal:</strong> {learningFeedbackResult.reward}</div>
            <div className="md:col-span-2 mt-1 text-emerald-800">
              <strong>🤖 How AI Learns for Next Time:</strong> {learningFeedbackResult.learningNote}
            </div>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">Redirecting to Patient Telemetry Monitoring...</p>
        </div>
      )}

      {/* AI Assessment Reference Summary Card */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#ededf1]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5a5b82] text-[20px]">psychology</span>
            <span className="text-xs font-bold text-[#111124] uppercase tracking-wider">Baseline AI Assessment Input</span>
          </div>
          <NavLink
            to={`/doctor/patient/${patient.id}/explainability`}
            className="text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-1"
          >
            <span>Inspect SHAP Feature Attribution Waterfall</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </NavLink>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#f9f9fd] p-3 rounded-lg border border-[#ededf1]">
            <span className="text-[10px] text-[#78767d] uppercase font-semibold block">Predicted AMR Risk</span>
            <span className="text-sm font-bold text-[#ba1a1a]">{patient.amrRiskLevel} Risk ({patient.amrRiskScore}%)</span>
            <p className="text-[11px] text-[#5a5b82] mt-0.5">Suspected: {patient.suspectedPathogen}</p>
          </div>
          <div className="bg-[#f9f9fd] p-3 rounded-lg border border-[#ededf1]">
            <span className="text-[10px] text-[#78767d] uppercase font-semibold block">AI Empiric Recommendation</span>
            <span className="text-sm font-bold text-[#111124]">Meropenem 1g IV q8h</span>
            <p className="text-[11px] text-[#5a5b82] mt-0.5">First-Line broad Gram-negative coverage</p>
          </div>
          <div className="bg-[#f9f9fd] p-3 rounded-lg border border-[#ededf1]">
            <span className="text-[10px] text-[#78767d] uppercase font-semibold block">Key Clinical Constraint</span>
            <span className="text-sm font-bold text-amber-700">Moderate CKD (eGFR 42)</span>
            <p className="text-[11px] text-[#5a5b82] mt-0.5">Drug Allergy: {patient.history?.drugAllergy || 'None known'}</p>
          </div>
        </div>
      </div>

      {/* Main Decision Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-base font-bold text-[#111124]">Select Clinical Determination Action</h2>
          <p className="text-xs text-[#5a5b82]">Choose how to act upon the AI recommendation. Detailed options below allow the LLM to learn your exact clinical criteria.</p>
        </div>

        {/* 3-Action Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* ACTION 1: ACCEPT */}
          <div
            onClick={() => setDecisionChoice('accept')}
            className={`cursor-pointer rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between border relative ${
              decisionChoice === 'accept'
                ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                : 'bg-white border-[#ededf1] hover:border-emerald-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${decisionChoice === 'accept' ? 'bg-emerald-600 text-white' : 'bg-[#ededf1]'}`}>
                  {decisionChoice === 'accept' && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111124] tracking-tight">ACCEPT</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  +1.0 Reward
                </span>
              </div>
              <p className="text-xs text-[#47464c] font-medium mt-1">Concur with AI recommended empiric regimen.</p>
              <p className="text-xs text-[#78767d] mt-2 leading-relaxed">
                Approve <strong>Meropenem monotherapy (1g IV q8h)</strong>. Confirms alignment with clinical presentation and microbiology suspicion.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-emerald-100 flex items-center gap-1 text-emerald-800 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reinforces model weights for similar cases</span>
            </div>
          </div>

          {/* ACTION 2: MODIFY */}
          <div
            onClick={() => setDecisionChoice('modify')}
            className={`cursor-pointer rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between border relative ${
              decisionChoice === 'modify'
                ? 'bg-amber-50/50 border-amber-600 ring-2 ring-amber-500/20 shadow-md'
                : 'bg-white border-[#ededf1] hover:border-amber-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${decisionChoice === 'modify' ? 'bg-amber-600 text-white' : 'bg-[#ededf1]'}`}>
                  {decisionChoice === 'modify' && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111124] tracking-tight">MODIFY</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  +0.5 Gradient
                </span>
              </div>
              <p className="text-xs text-[#47464c] font-medium mt-1">Calibrate dosage, frequency, or agent.</p>
              <p className="text-xs text-[#78767d] mt-2 leading-relaxed">
                Adjust dose for renal clearance (CKD), de-escalate spectrum, or tailor infusion duration based on clinical judgment.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-amber-100 flex items-center gap-1 text-amber-800 text-[11px] font-semibold">
              <Brain className="w-3.5 h-3.5 text-amber-600" />
              <span>LLM learns fine-tuned parameter calibration</span>
            </div>
          </div>

          {/* ACTION 3: OVERRIDE */}
          <div
            onClick={() => setDecisionChoice('override')}
            className={`cursor-pointer rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between border relative ${
              decisionChoice === 'override'
                ? 'bg-rose-50/50 border-rose-600 ring-2 ring-rose-500/20 shadow-md'
                : 'bg-white border-[#ededf1] hover:border-rose-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${decisionChoice === 'override' ? 'bg-rose-600 text-white' : 'bg-[#ededf1]'}`}>
                  {decisionChoice === 'override' && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111124] tracking-tight">OVERRIDE</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  -1.0 Penalty
                </span>
              </div>
              <p className="text-xs text-[#47464c] font-medium mt-1">Decline AI options & catalog custom regimen.</p>
              <p className="text-xs text-[#78767d] mt-2 leading-relaxed">
                Prescribe alternative custom therapy (e.g. stewardship protocol, clinical trial, or disagreement with AMR risk level).
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-rose-100 flex items-center gap-1 text-rose-800 text-[11px] font-semibold">
              <Database className="w-3.5 h-3.5 text-rose-600" />
              <span>Indexes custom regimen in Few-Shot pool</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DETAILED SECTION 1: ACCEPT WORKFLOW */}
        {/* ========================================================================= */}
        {decisionChoice === 'accept' && (
          <div className="bg-white rounded-xl p-6 border border-emerald-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-100 text-emerald-950 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Structured Accept Dimensions (Active Learning Positive Reinforcement)</span>
            </div>

            {/* Pathogen Verification */}
            <div>
              <label className="block text-xs font-bold text-[#111124] mb-1.5">
                1. Confirm Suspected Pathogens Covered by Prescribed Option
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  'ESBL Enterobacterales',
                  'Pseudomonas aeruginosa',
                  'AmpC Beta-lactamase Producers',
                  'Carbapenem-Resistant (CRE)',
                  'Methicillin-Resistant (MRSA)',
                  'Streptococcus pneumoniae'
                ].map(path => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => toggleArrayItem(setConfirmedPathogens, confirmedPathogens, path)}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                      confirmedPathogens.includes(path)
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-[#f9f9fd] border-[#ededf1] text-[#5a5b82] hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{path}</span>
                      {confirmedPathogens.includes(path) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Therapeutic Intent & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111124] mb-1">
                  2. Therapeutic Intent
                </label>
                <select
                  value={therapeuticIntent}
                  onChange={e => setTherapeuticIntent(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f9f9fd] border border-[#ededf1] rounded-lg text-xs font-semibold text-[#111124] focus:outline-none"
                >
                  <option value="Empiric First-Line (Awaiting Cultures)">Empiric First-Line (Awaiting Cultures)</option>
                  <option value="Targeted Therapy (Gram-negative Bacteremia)">Targeted Therapy (Gram-negative Bacteremia)</option>
                  <option value="Prophylactic Coverage (High-risk Sepsis)">Prophylactic Coverage (High-risk Sepsis)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111124] mb-1">
                  3. Planned Antimicrobial Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 7, 10, 14].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setConfirmedDuration(days)}
                      className={`py-2 rounded-lg border text-xs font-bold text-center transition-all ${
                        confirmedDuration === days
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-[#f9f9fd] border-[#ededf1] text-[#111124] hover:bg-gray-100'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Agreed AI Drivers */}
            <div>
              <label className="block text-xs font-bold text-[#111124] mb-1.5">
                4. Which AI Risk Drivers Clinically Justified this Acceptance? (Supervised Feedback)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'Prior 90-Day Antibiotic Exposure',
                  'Unit Endemic Resistance Rate',
                  'Prior Resistant Isolate in 12 Months',
                  'Acute Inflammatory Vitals & CRP Sepsis Markers',
                  'Comorbidity & Immunocompromised State'
                ].map(driver => (
                  <button
                    key={driver}
                    type="button"
                    onClick={() => toggleArrayItem(setAgreedDrivers, agreedDrivers, driver)}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all flex items-center justify-between ${
                      agreedDrivers.includes(driver)
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-[#f9f9fd] border-[#ededf1] text-[#5a5b82] hover:bg-gray-100'
                    }`}
                  >
                    <span>{driver}</span>
                    {agreedDrivers.includes(driver) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Audit Rationale */}
            <div>
              <label className="block text-xs font-bold text-[#111124] mb-1">
                5. Attending Physician Medical Audit Note / Rationale *
              </label>
              <textarea
                rows={2}
                required
                value={acceptRationale}
                onChange={e => setAcceptRationale(e.target.value)}
                className="w-full px-3 py-2 bg-[#f9f9fd] border border-[#ededf1] rounded-lg text-xs focus:outline-none"
                placeholder="State clinical reasoning for approving this regimen..."
              />
            </div>

            {/* Active Learning Preview */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-950">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">How the ML Model Learns:</strong>
                <span>
                  Logging this decision assigns a <strong>+1.0 positive reward</strong> to the TreeSHAP feature weights for prior antibiotic history and endemic unit resistance in {patient.infectionSource} infections.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DETAILED SECTION 2: MODIFY WORKFLOW */}
        {/* ========================================================================= */}
        {decisionChoice === 'modify' && (
          <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-amber-100 text-amber-950 font-bold text-sm">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Structured Modification & Calibration (Supervised Parameter Guidance)</span>
            </div>

            {/* Modification Category */}
            <div>
              <label className="block text-xs font-bold text-[#111124] mb-1.5">
                1. Primary Reason for Clinical Modification
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {[
                  'Dose Adjustment (Renal Clearance / AKI)',
                  'Spectrum De-escalation (Stewardship)',
                  'Frequency & Extended Infusion Calibration',
                  'Synergistic Combination Add-on',
                  'Hepatic Clearance / Tolerance Optimization',
                  'Drug Interaction Mitigation'
                ].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setModificationCategory(cat)}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                      modificationCategory === cat
                        ? 'bg-amber-100 border-amber-500 text-amber-950 font-bold'
                        : 'bg-[#f9f9fd] border-[#ededf1] text-[#5a5b82] hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Calibrated Regimen Details */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#fdfaf6] p-4 rounded-xl border border-amber-200">
              <div>
                <label className="block text-[11px] font-bold text-[#111124] mb-1">Drug Agent</label>
                <select
                  value={modifiedDrug}
                  onChange={e => setModifiedDrug(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-bold text-[#111124] focus:outline-none"
                >
                  <option value="Meropenem">Meropenem</option>
                  <option value="Piperacillin-Tazobactam">Piperacillin-Tazobactam</option>
                  <option value="Cefepime">Cefepime</option>
                  <option value="Ceftazidime-Avibactam">Ceftazidime-Avibactam</option>
                  <option value="Ertapenem">Ertapenem</option>
                  <option value="Aztreonam">Aztreonam</option>
                  <option value="Amikacin + Meropenem">Amikacin + Meropenem</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111124] mb-1">Calibrated Dose</label>
                <select
                  value={modifiedDosage}
                  onChange={e => setModifiedDosage(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-bold text-[#111124] focus:outline-none"
                >
                  <option value="500mg (Renal Adjusted)">500mg (Renal Adjusted)</option>
                  <option value="1g (Standard Empiric)">1g (Standard Empiric)</option>
                  <option value="2g (Meningitis/Severe)">2g (Meningitis/Severe)</option>
                  <option value="3.375g (Renal Pip-Tazo)">3.375g (Renal Pip-Tazo)</option>
                  <option value="4.5g (Full Pip-Tazo)">4.5g (Full Pip-Tazo)</option>
                  <option value="750mg">750mg</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111124] mb-1">Frequency & Infusion</label>
                <select
                  value={modifiedFrequency}
                  onChange={e => setModifiedFrequency(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-bold text-[#111124] focus:outline-none"
                >
                  <option value="q8h">q8h (Every 8 Hours)</option>
                  <option value="q12h">q12h (Renal Extension)</option>
                  <option value="q6h">q6h (Every 6 Hours)</option>
                  <option value="q24h">q24h (Once Daily)</option>
                  <option value="Extended 3h Infusion q8h">Extended 3h Infusion q8h</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111124] mb-1">Target Duration</label>
                <div className="grid grid-cols-3 gap-1">
                  {[5, 7, 10].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setModifiedDuration(d)}
                      className={`py-2 rounded-md border text-xs font-bold transition-all ${
                        modifiedDuration === d
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white border-[#ededf1] text-[#111124]'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Attribution Corrections (What did the AI get wrong?) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111124] mb-1.5">
                  AI Over-weighted Features (Model Was Overly Sensitive To):
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    'Baseline Patient Age',
                    'Bedside Heart Rate / Tachycardia',
                    'Empiric Prior Antibiotic Days',
                    'Ward Endemic Sepsis History'
                  ].map(feat => (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => toggleArrayItem(setOverweightedFeatures, overweightedFeatures, feat)}
                      className={`w-full p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                        overweightedFeatures.includes(feat)
                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                          : 'bg-[#f9f9fd] border-[#ededf1] text-[#5a5b82]'
                      }`}
                    >
                      <span>{feat}</span>
                      {overweightedFeatures.includes(feat) && <span className="text-[10px] font-mono text-amber-800">OVER-WEIGHTED</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111124] mb-1.5">
                  AI Under-weighted Features (Model Should Give More Weight To):
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    'Renal Clearance / eGFR',
                    'Source Control Drainage Status',
                    'Recent Antibiogram Sensitivity Trend',
                    'Patient Hemodynamic Stability'
                  ].map(feat => (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => toggleArrayItem(setUnderweightedFeatures, underweightedFeatures, feat)}
                      className={`w-full p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                        underweightedFeatures.includes(feat)
                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                          : 'bg-[#f9f9fd] border-[#ededf1] text-[#5a5b82]'
                      }`}
                    >
                      <span>{feat}</span>
                      {underweightedFeatures.includes(feat) && <span className="text-[10px] font-mono text-amber-800">UNDER-WEIGHTED</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clinical Justification */}
            <div>
              <label className="block text-xs font-bold text-[#111124] mb-1">
                Clinical Modification Rationale / Prescription Order *
              </label>
              <textarea
                rows={2}
                required
                value={clinicalJustification}
                onChange={e => setClinicalJustification(e.target.value)}
                className="w-full px-3 py-2 bg-[#f9f9fd] border border-[#ededf1] rounded-lg text-xs focus:outline-none"
                placeholder="State rationale for dosage or agent calibration..."
              />
            </div>

            {/* Active Learning Preview */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-950">
              <Brain className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">How the LLM Learns for Next Time:</strong>
                <span>
                  The decision support engine indexes this modification rule: <em>When a patient with Moderate CKD presents with high AMR risk in {patient.infectionSource}, prioritize {modifiedDrug} ({modifiedDosage} {modifiedFrequency})</em> instead of unadjusted 1g.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DETAILED SECTION 3: OVERRIDE WORKFLOW */}
        {/* ========================================================================= */}
        {decisionChoice === 'override' && (
          <div className="bg-white rounded-xl p-6 border border-rose-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-100 text-rose-950 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              <span>Structured Override & Cataloging (Active Learning Hard-Negative Feedback)</span>
            </div>

            {/* Override Category */}
            <div>
              <label className="block text-xs font-bold text-[#111124] mb-1.5">
                1. Mandatory Override Reason (Required for EHR Quality Assurance)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'Disagreement with AMR Risk Score (Clinical Assessment is Low Risk)',
                  'Preliminary Offline Lab / Rapid Blood Culture Result Available',
                  'Severe Uncoded Allergy / Toxic Epidermal Reaction Risk',
                  'Hospital Antimicrobial Stewardship Restriction Protocol',
                  'Palliative Care / Goals-of-Care De-escalation Focus',
                  'Documented Prior Clinical Failure of Carbapenem Class'
                ].map(reason => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setOverrideReason(reason)}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                      overrideReason === reason
                        ? 'bg-rose-100 border-rose-500 text-rose-950 font-bold'
                        : 'bg-[#f9f9fd] border-[#ededf1] text-[#5a5b82] hover:bg-gray-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Prescribed Custom Regimen */}
            <div className="bg-[#fef7f7] p-4 rounded-xl border border-rose-200 space-y-3">
              <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                2. Prescribed Custom Antimicrobial Regimen
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">Drug Name & Combination *</label>
                  <input
                    type="text"
                    required
                    value={customDrug}
                    onChange={e => setCustomDrug(e.target.value)}
                    placeholder="e.g. Ciprofloxacin 400mg IV + Metronidazole 500mg IV"
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-bold text-[#111124] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">Route & Frequency</label>
                  <input
                    type="text"
                    value={customFrequency}
                    onChange={e => setCustomFrequency(e.target.value)}
                    placeholder="e.g. q12h IV Infusion"
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-medium text-[#111124] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Disagreed AI Assumptions */}
            <div>
              <label className="block text-xs font-bold text-[#111124] mb-1.5">
                3. Mark Disagreed AI Assumptions (Teaches AI Where It Failed):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'AMR Risk Score was Overestimated (False High)',
                  'Inappropriate Broad Spectrum for Source',
                  'Ignored Severe Renal / Hepatic Compromise',
                  'Missed Known Drug-Drug Interaction',
                  'Failed to Account for Source Control Debridement'
                ].map(assump => (
                  <button
                    key={assump}
                    type="button"
                    onClick={() => toggleArrayItem(setDisagreedAssumptions, disagreedAssumptions, assump)}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all flex items-center justify-between ${
                      disagreedAssumptions.includes(assump)
                        ? 'bg-rose-100 border-rose-400 text-rose-950 font-bold'
                        : 'bg-[#f9f9fd] border-[#ededf1] text-[#5a5b82]'
                    }`}
                  >
                    <span>{assump}</span>
                    {disagreedAssumptions.includes(assump) && <span className="text-[10px] font-mono text-rose-800">DISAGREED</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Override Rationale */}
            <div>
              <label className="block text-xs font-bold text-[#111124] mb-1">
                4. Mandatory Physician Override Audit Justification *
              </label>
              <textarea
                rows={3}
                required
                value={overrideRationale}
                onChange={e => setOverrideRationale(e.target.value)}
                className="w-full px-3 py-2 bg-[#f9f9fd] border border-[#ededf1] rounded-lg text-xs focus:outline-none"
                placeholder="Detail clinical rationale for overriding automated guidance..."
              />
            </div>

            {/* Active Learning Preview */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-950">
              <Database className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">How the LLM Learns for Next Time:</strong>
                <span>
                  The ML calibration model registers a <strong>-1.0 penalty</strong> on the initial carbapenem suggestion and catalogs your custom regimen <em>'{customDrug}'</em> in the Few-Shot clinical memory pool for similar patient admissions.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form Submission Actions */}
        <div className="bg-white rounded-xl p-5 border border-[#ededf1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#111124] text-white flex items-center justify-center font-bold text-sm">
              MV
            </div>
            <div>
              <div className="text-xs font-bold text-[#111124]">Dr. Marcus Vance, MD</div>
              <p className="text-[11px] text-[#5a5b82]">Attending Infectious Disease Physician • Lic #ID-98402</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <NavLink
              to={`/doctor/patient/${patient.id}/treatment-support`}
              className="px-4 py-2.5 bg-[#f3f3f7] hover:bg-[#ededf1] text-[#111124] text-xs font-bold rounded transition-colors"
            >
              Back to Options
            </NavLink>

            <button
              type="submit"
              className={`px-6 py-2.5 text-white text-xs font-bold rounded transition-all shadow-xs flex items-center gap-2 ${
                decisionChoice === 'accept'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : decisionChoice === 'modify'
                  ? 'bg-amber-700 hover:bg-amber-800'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Confirm & Ingest Decision ({decisionChoice.toUpperCase()})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
