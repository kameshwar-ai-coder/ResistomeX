import React, { useState } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { PatientHeader } from '../components/PatientHeader';

export const DoctorDecisionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPatientById, recordDoctorDecision } = usePatients();
  const patient = getPatientById(id || 'P-72309');

  const [decisionChoice, setDecisionChoice] = useState('accept'); // 'accept' | 'modify' | 'override'
  const [rationale, setRationale] = useState(
    `Proceeding with AI recommended empiric regimen (Meropenem monotherapy) pending blood culture sensitivity results.`
  );
  const [customRegimen, setCustomRegimen] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(patient.decisionLog.status === 'ACCEPTED');

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalRegimen = decisionChoice === 'override' ? customRegimen : 
      decisionChoice === 'modify' ? 'Meropenem 500mg IV q8h (Renal Adjusted)' : 'Meropenem 1g IV q8h';
    
    recordDoctorDecision(patient.id, finalRegimen, rationale, decisionChoice);
    setIsSubmitted(true);

    // Auto navigate to Patient Monitoring after brief confirmation
    setTimeout(() => {
      navigate(`/doctor/patient/${patient.id}/monitoring`);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      <PatientHeader />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-[#5a5b82]">
        <NavLink to="/doctor/patients" className="hover:text-[#111124]">Patients</NavLink>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="hover:text-[#111124]">{patient.name} ({patient.mrn})</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="hover:text-[#111124]">Treatment Support</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[#111124] font-semibold">Doctor Decision</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111124] tracking-tight">Doctor Decision</h1>
          <p className="text-xs text-[#5a5b82] mt-0.5">Record your clinical determination for patient {patient.name}</p>
        </div>

        {isSubmitted && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Decision Saved to EHR Audit Log → Redirecting to Monitoring...
          </span>
        )}
      </div>

      {/* AI Assessment Summary Card */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#ededf1]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5a5b82] text-[20px]">psychology</span>
            <span className="text-xs font-bold text-[#111124] uppercase tracking-wider">AI Assessment Summary</span>
          </div>
          <NavLink
            to={`/doctor/patient/${patient.id}/treatment-support`}
            className="text-xs text-[#5a5b82] hover:text-[#111124] font-medium flex items-center gap-1"
          >
            <span>Review treatment options</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </NavLink>
        </div>

        <div className="mt-3 bg-[#f3f3f7] rounded-lg p-3 flex flex-col md:flex-row items-center gap-4 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">biotech</span>
            <div>
              <span className="text-[10px] text-[#78767d] uppercase font-semibold">AMR Risk</span>
              <div className="font-bold text-[#111124]">{patient.amrRiskLevel} Risk ({patient.amrRiskScore}% probability)</div>
            </div>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#ededf1]"></div>
          <div className="flex items-center gap-2 flex-1">
            <span className="material-symbols-outlined text-[#5a5b82] text-[20px]">medication</span>
            <div>
              <span className="text-[10px] text-[#78767d] uppercase font-semibold">Treatment Support</span>
              <div className="font-bold text-[#111124]">Option 1 recommended (Meropenem monotherapy)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Selection Section */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-[#111124]">Choose your decision</h2>
          <p className="text-xs text-[#5a5b82]">Select an action to proceed with the treatment plan.</p>
        </div>

        {/* 3-Column Decision Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: ACCEPT */}
          <div
            onClick={() => {
              setDecisionChoice('accept');
              setRationale(`Proceeding with AI recommended empiric regimen (Meropenem monotherapy) pending blood culture results.`);
            }}
            className={`cursor-pointer rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between border ${
              decisionChoice === 'accept'
                ? 'bg-[#f9f9fd] border-[#111124] ring-2 ring-[#111124]/10 shadow-md'
                : 'bg-white border-[#ededf1] hover:bg-[#f9f9fd]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${decisionChoice === 'accept' ? 'bg-[#111124] text-white' : 'bg-[#ededf1]'}`}>
                  {decisionChoice === 'accept' && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </div>
              </div>
              <h3 className="text-base font-bold text-[#111124] tracking-tight">ACCEPT</h3>
              <p className="text-xs text-[#47464c] font-medium mt-1">Use the AI-supported option.</p>
              <p className="text-xs text-[#78767d] mt-3 leading-relaxed">
                Proceed with the recommended empiric regimen (Meropenem monotherapy) pending blood culture sensitivity results.
              </p>
            </div>
            <div className="mt-4 pt-2 flex items-center gap-1 text-[#78767d] text-[11px] uppercase font-semibold">
              <span className="material-symbols-outlined text-[14px]">done_all</span>
              <span>Fast-track to Pharmacy</span>
            </div>
          </div>

          {/* Card 2: MODIFY */}
          <div
            onClick={() => {
              setDecisionChoice('modify');
              setRationale(`Modifying dosage / frequency for ${patient.name} based on renal clearance.`);
            }}
            className={`cursor-pointer rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between border ${
              decisionChoice === 'modify'
                ? 'bg-[#f9f9fd] border-[#111124] ring-2 ring-[#111124]/10 shadow-md'
                : 'bg-white border-[#ededf1] hover:bg-[#f9f9fd]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
                  <span className="material-symbols-outlined text-[24px]">tune</span>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${decisionChoice === 'modify' ? 'bg-[#111124] text-white' : 'bg-[#ededf1]'}`}>
                  {decisionChoice === 'modify' && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </div>
              </div>
              <h3 className="text-base font-bold text-[#111124] tracking-tight">MODIFY</h3>
              <p className="text-xs text-[#47464c] font-medium mt-1">Make changes based on clinical judgment.</p>
              <p className="text-xs text-[#78767d] mt-3 leading-relaxed">
                Adjust medication, dosage frequency, or substitute agent based on patient tolerance and clinical factors.
              </p>
            </div>
            <div className="mt-4 pt-2 flex items-center gap-1 text-[#78767d] text-[11px] uppercase font-semibold">
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              <span>Dose / Agent Calibration</span>
            </div>
          </div>

          {/* Card 3: OVERRIDE */}
          <div
            onClick={() => {
              setDecisionChoice('override');
              setRationale(`Overriding AI recommendation due to specific clinical indication.`);
            }}
            className={`cursor-pointer rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between border ${
              decisionChoice === 'override'
                ? 'bg-[#f9f9fd] border-[#111124] ring-2 ring-[#111124]/10 shadow-md'
                : 'bg-white border-[#ededf1] hover:bg-[#f9f9fd]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
                  <span className="material-symbols-outlined text-[24px]">do_not_disturb_on</span>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${decisionChoice === 'override' ? 'bg-[#111124] text-white' : 'bg-[#ededf1]'}`}>
                  {decisionChoice === 'override' && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </div>
              </div>
              <h3 className="text-base font-bold text-[#111124] tracking-tight">OVERRIDE</h3>
              <p className="text-xs text-[#47464c] font-medium mt-1">Decline AI options & input custom regimen.</p>
              <p className="text-xs text-[#78767d] mt-3 leading-relaxed">
                Prescribe custom non-suggested empiric regimen with mandatory clinical rationale audit logging.
              </p>
            </div>
            <div className="mt-4 pt-2 flex items-center gap-1 text-[#78767d] text-[11px] uppercase font-semibold">
              <span className="material-symbols-outlined text-[14px]">lock_reset</span>
              <span>Audited Override Log</span>
            </div>
          </div>
        </div>

        {/* Inputs based on choice */}
        <div className="bg-white rounded-xl p-5 border border-[#ededf1] space-y-4">
          {decisionChoice === 'override' && (
            <div>
              <label className="block text-xs font-bold text-[#111124] mb-1">Custom Antibiotic Regimen *</label>
              <input
                type="text"
                required
                value={customRegimen}
                onChange={e => setCustomRegimen(e.target.value)}
                placeholder="Specify drug name, dose, route, and frequency..."
                className="w-full px-3 py-2 bg-[#f3f3f7] border border-[#ededf1] rounded text-xs focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#111124] mb-1">Required Clinical Rationale / Medical Audit Note *</label>
            <textarea
              rows={3}
              required
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              className="w-full px-3 py-2 bg-[#f3f3f7] border border-[#ededf1] rounded text-xs focus:outline-none"
              placeholder="State reason for clinical decision..."
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#5a5b82]">Physician: <strong>Dr. Marcus Vance, MD</strong></span>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Confirm & Save Decision</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
