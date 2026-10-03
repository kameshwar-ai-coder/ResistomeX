import React from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { PatientHeader } from '../components/PatientHeader';

export const AMRRiskAssessmentPage = () => {
  const { id } = useParams();
  const { getPatientById, loading, dbError } = usePatients();
  const patient = getPatientById(id);

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <PatientHeader />
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading AMR risk assessment...</p>
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
          <p className="text-sm font-bold">Unable to load AMR risk assessment from database.</p>
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

  return (
    <div className="flex flex-col w-full space-y-6">
      <PatientHeader />

      {/* Top Status Bar */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#ededf1]">
        <div className="flex items-center gap-1.5 text-xs text-[#5a5b82]">
          <NavLink to="/doctor/patients" className="hover:text-[#111124]">Patients</NavLink>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="font-semibold text-[#1a1c1f]">{patient.name} ({patient.mrn})</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="font-semibold text-[#111124]">AMR Risk Result</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Rule-Based Clinical Risk Heuristic
        </div>
      </div>

      {/* Central AMR Risk Hero Banner */}
      <section className="bg-white rounded-xl shadow-xs p-6 border border-[#ededf1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col max-w-2xl">
            <div className="flex items-center gap-1 text-[#ba1a1a] text-xs uppercase font-bold tracking-wider mb-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>Antimicrobial Resistance Risk Stratification</span>
            </div>
            <h2 className="text-2xl font-bold text-[#111124] tracking-tight">
              {patient.amrRiskLevel} Resistance Probability
            </h2>
            <p className="text-sm text-[#5a5b82] mt-2 leading-relaxed">
              High likelihood of resistance to standard empiric beta-lactams and 3rd-generation cephalosporins. Tailored non-standard empiric therapy is strongly indicated.
            </p>
          </div>

          {/* Prominent Visual Risk Gauge Badge */}
          <div className="flex items-center gap-4 bg-[#ffdad6]/40 p-4 rounded-xl border border-[#ffdad6] shrink-0">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-[#ffdad6]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                <path className="text-[#ba1a1a]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${patient.amrRiskScore}, 100`} strokeLinecap="round" strokeWidth="3.5" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-[#93000a] leading-none">{patient.amrRiskScore}%</span>
                <span className="text-[9px] uppercase tracking-wider text-[#ba1a1a] font-semibold mt-0.5">Risk</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="px-3 py-1 rounded bg-[#ba1a1a] text-white text-xs font-bold text-center">
                {patient.amrRiskLevel.toUpperCase()} RISK
              </span>
              <span className="text-[11px] text-[#93000a] mt-1.5 font-medium">Confidence: 94.2%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Driver Analysis Section: Why this result? */}
      <section className="bg-white rounded-xl shadow-xs p-6 border border-[#ededf1]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#ededf1]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
              <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111124]">Key Resistance Drivers</h3>
              <p className="text-xs text-[#5a5b82]">Primary clinical factors determining this patient's resistance score</p>
            </div>
          </div>
          <span className="text-xs text-[#5a5b82] uppercase font-semibold">4 Evaluated Determinants</span>
        </div>

        {/* 4 Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patient.shapFeatures.map((feat, idx) => (
            <div key={idx} className="bg-[#f3f3f7] rounded-xl p-4 flex flex-col justify-between hover:bg-[#ededf1] transition-colors border border-[#ededf1]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded bg-white text-[#111124] flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">
                      {idx === 0 ? 'medication' : idx === 1 ? 'verified_user' : idx === 2 ? 'domain' : 'badge'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111124]">{feat.feature}</h4>
                    <p className="text-xs text-[#47464c] mt-1 leading-snug">{feat.description}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold ${
                  feat.impact > 0 ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {feat.impact > 0 ? `+${feat.impact}` : feat.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <NavLink
          to={`/doctor/patient/${patient.id}/explainability`}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#f3f3f7] hover:bg-[#ededf1] text-[#111124] font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">troubleshoot</span>
          <span>Why This Prediction? (SHAP)</span>
        </NavLink>

        <NavLink
          to={`/doctor/patient/${patient.id}/treatment-support`}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#111124] hover:bg-[#26263a] text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5 shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">medication</span>
          <span>Proceed to Treatment Support</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </NavLink>
      </div>
    </div>
  );
};
