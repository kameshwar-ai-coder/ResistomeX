import React, { useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { PatientHeader } from '../components/PatientHeader';

export const TreatmentSupportPage = () => {
  const { id } = useParams();
  const { getPatientById, loading, dbError } = usePatients();
  const patient = getPatientById(id);
  const [selectedOption, setSelectedOption] = useState(1);

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <PatientHeader />
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading treatment decision support options...</p>
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
          <p className="text-sm font-bold">Unable to load treatment options from database.</p>
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

      {/* Breadcrumbs & Context Header Strip */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center gap-1.5 text-xs text-[#5a5b82]">
          <NavLink to="/doctor/patients" className="hover:text-[#111124]">Patients</NavLink>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="hover:text-[#111124]">{patient.name} ({patient.mrn})</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#111124] font-semibold">Treatment Support</span>
        </nav>

        {/* Patient Banner Card */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f3f3f7] flex items-center justify-center text-[#111124] font-bold text-base">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-base text-[#111124] font-semibold tracking-tight">{patient.name}</h2>
                <span className="text-[11px] bg-[#ededf1] px-2 py-0.5 rounded text-[#47464c] uppercase font-medium">{patient.mrn}</span>
                <span className="text-[11px] bg-[#ededf1] px-2 py-0.5 rounded text-[#47464c] uppercase font-medium">{patient.bed}</span>
              </div>
              <p className="text-xs text-[#5a5b82] mt-0.5">
                {patient.primaryDiagnosis} • Admitted 36h ago
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#ffdad6] text-[#93000a] px-4 py-2.5 rounded-lg shadow-xs self-start md:self-auto">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold">AMR Risk Status</span>
              <span className="text-xs font-semibold tracking-tight">{patient.amrRiskLevel.toUpperCase()} RISK ({patient.amrRiskScore}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Title Area */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl text-[#111124] font-bold tracking-tight">Treatment Support</h1>
        <p className="text-xs text-[#5a5b82]">Options for clinical consideration</p>
      </div>

      {/* Treatment Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Option 1 */}
        <div
          onClick={() => setSelectedOption(1)}
          className={`cursor-pointer rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between relative border ${
            selectedOption === 1
              ? 'bg-white border-[#111124] ring-2 ring-[#111124]/10 shadow-md'
              : 'bg-white border-[#ededf1] hover:border-[#78767d]'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#e1dfff] text-[#17173b] font-semibold">
                Option 1 (Empiric Consideration)
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedOption === 1 ? 'bg-[#111124] text-white' : 'bg-[#ededf1]'}`}>
                {selectedOption === 1 && <span className="w-2 h-2 rounded-full bg-white"></span>}
              </div>
            </div>
            <div>
              <h3 className="text-base text-[#111124] font-semibold tracking-tight">Meropenem monotherapy</h3>
              <p className="text-xs text-[#47464c] mt-2 leading-relaxed">
                High susceptibility probability against suspected ESBL-producing Gram-negative bacteremia.
              </p>
            </div>
            <div className="bg-[#f3f3f7] rounded-lg p-3 flex items-start gap-2 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#5a5b82]">info</span>
              <p className="text-xs text-[#47464c]">
                <strong className="font-semibold text-[#111124]">Caution:</strong> Requires dose adjustment for Moderate CKD (eGFR 42 mL/min).
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 flex items-center justify-between border-t border-[#ededf1]">
            <span className="text-xs font-semibold text-[#111124]">Prescribed 1g IV q8h</span>
            <span className="text-[11px] text-[#78767d] uppercase font-medium">Empiric Priority</span>
          </div>
        </div>

        {/* Option 2 */}
        <div
          onClick={() => setSelectedOption(2)}
          className={`cursor-pointer rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between relative border ${
            selectedOption === 2
              ? 'bg-white border-[#111124] ring-2 ring-[#111124]/10 shadow-md'
              : 'bg-white border-[#ededf1] hover:border-[#78767d]'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#ededf1] text-[#47464c] font-semibold">
                Option 2 (Alternative Regimen)
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedOption === 2 ? 'bg-[#111124] text-white' : 'bg-[#ededf1]'}`}>
                {selectedOption === 2 && <span className="w-2 h-2 rounded-full bg-white"></span>}
              </div>
            </div>
            <div>
              <h3 className="text-base text-[#111124] font-semibold tracking-tight">Ceftazidime / Avibactam</h3>
              <p className="text-xs text-[#47464c] mt-2 leading-relaxed">
                Targeted activity against resistant Enterobacterales with preserved renal clearance tolerability.
              </p>
            </div>
            <div className="bg-[#f3f3f7] rounded-lg p-3 flex items-start gap-2 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#5a5b82]">verified_user</span>
              <p className="text-xs text-[#47464c]">
                <strong className="font-semibold text-[#111124]">Caution:</strong> Reserve agent per hospital stewardship policy.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 flex items-center justify-between border-t border-[#ededf1]">
            <span className="text-xs font-semibold text-[#111124]">2.5g IV q8h</span>
            <span className="text-[11px] text-[#78767d] uppercase font-medium">Restricted Agent</span>
          </div>
        </div>

        {/* Option 3 */}
        <div
          onClick={() => setSelectedOption(3)}
          className={`cursor-pointer rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between relative border ${
            selectedOption === 3
              ? 'bg-white border-[#111124] ring-2 ring-[#111124]/10 shadow-md'
              : 'bg-white border-[#ededf1] hover:border-[#78767d]'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#ededf1] text-[#47464c] font-semibold">
                Option 3 (Combination Approach)
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedOption === 3 ? 'bg-[#111124] text-white' : 'bg-[#ededf1]'}`}>
                {selectedOption === 3 && <span className="w-2 h-2 rounded-full bg-white"></span>}
              </div>
            </div>
            <div>
              <h3 className="text-base text-[#111124] font-semibold tracking-tight">Amikacin + Ertapenem</h3>
              <p className="text-xs text-[#47464c] mt-2 leading-relaxed">
                Rapid bactericidal clearance for severe sepsis presentation while awaiting blood cultures.
              </p>
            </div>
            <div className="bg-[#f3f3f7] rounded-lg p-3 flex items-start gap-2 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#5a5b82]">monitoring</span>
              <p className="text-xs text-[#47464c]">
                <strong className="font-semibold text-[#111124]">Caution:</strong> Therapeutic drug monitoring required for aminoglycosides.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 flex items-center justify-between border-t border-[#ededf1]">
            <span className="text-xs font-semibold text-[#111124]">Combination IV</span>
            <span className="text-[11px] text-[#78767d] uppercase font-medium">Synergistic Pair</span>
          </div>
        </div>
      </div>

      {/* CTA Navigation */}
      <div className="pt-4 flex justify-end">
        <NavLink
          to={`/doctor/patient/${patient.id}/decision`}
          className="px-6 py-2.5 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded transition-colors shadow-xs flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span>Make Doctor Decision (Accept / Modify / Override)</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </NavLink>
      </div>
    </div>
  );
};
