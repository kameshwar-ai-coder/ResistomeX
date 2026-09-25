import React from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { PatientHeader } from '../components/PatientHeader';

export const PatientClinicalInfoPage = () => {
  const { id } = useParams();
  const { getPatientById } = usePatients();
  const patient = getPatientById(id || 'P-72309');

  return (
    <div className="flex flex-col w-full space-y-6">
      <PatientHeader />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-[#5a5b82]">
        <NavLink to="/doctor/patients" className="hover:text-[#111124]">Patients</NavLink>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[#1a1c1f] font-medium">{patient.name} ({patient.mrn})</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[#5a5b82]">Clinical Intake</span>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1 */}
        <div className="flex flex-col gap-6">
          {/* CARD 1: PATIENT BASELINE */}
          <section className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#ededf1]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#e8e8ec] flex items-center justify-center text-[#111124]">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </div>
                <h2 className="text-sm text-[#111124] font-semibold">1. Patient Baseline</h2>
              </div>
              <span className="text-[11px] text-[#5a5b82] bg-[#f3f3f7] px-2 py-0.5 rounded">Core Profile</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-[#5a5b82] font-medium block mb-1">Patient MRN</label>
                <input className="w-full bg-[#f3f3f7] text-[#111124] font-medium text-xs px-3 py-2 rounded focus:outline-none" readonly value={patient.mrn} />
              </div>
              <div>
                <label className="text-[11px] text-[#5a5b82] font-medium block mb-1">Age</label>
                <div className="flex items-center bg-[#f3f3f7] rounded px-3 py-2 text-xs">
                  <span className="font-bold text-[#111124]">{patient.age}</span>
                  <span className="text-[#5a5b82] ml-1">years</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#5a5b82] font-medium block mb-1">Biological Sex</label>
                <div className="bg-[#f3f3f7] p-1 rounded font-semibold text-xs text-[#111124]">
                  {patient.gender}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#5a5b82] font-medium block mb-1">Admission Date</label>
                <div className="bg-[#f3f3f7] px-3 py-2 rounded text-xs font-medium text-[#111124]">
                  {patient.admissionDate}
                </div>
              </div>
            </div>
          </section>

          {/* CARD 2: CURRENT PRESENTATION & VITALS */}
          <section className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#ededf1]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#e8e8ec] flex items-center justify-center text-[#111124]">
                  <span className="material-symbols-outlined text-[18px]">ecg_heart</span>
                </div>
                <h2 className="text-sm text-[#111124] font-semibold">2. Current Presentation</h2>
              </div>
              <span className="text-[11px] text-[#ba1a1a] bg-[#ffdad6]/40 px-2 py-0.5 rounded font-medium">Acute Onset</span>
            </div>

            <div>
              <label className="text-[11px] text-[#5a5b82] font-medium block mb-1">Suspected Primary Infection Source</label>
              <div className="bg-[#f3f3f7] px-3 py-2 rounded text-xs font-semibold text-[#111124]">
                {patient.infectionSource}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#5a5b82] font-medium block mb-1">Active Symptoms & Clinical Signs</label>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-[#e8e8ec] px-2.5 py-1 rounded text-[#111124] text-xs font-medium">High Fever</span>
                <span className="bg-[#e8e8ec] px-2.5 py-1 rounded text-[#111124] text-xs font-medium">Hypotension</span>
                <span className="bg-[#e8e8ec] px-2.5 py-1 rounded text-[#111124] text-xs font-medium">Rigors / Chills</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#5a5b82] font-medium block">Immediate Bedside Vitals</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#f3f3f7] p-2.5 rounded">
                  <span className="text-[10px] text-[#5a5b82]">Temp</span>
                  <div className="text-sm font-bold text-[#ba1a1a] mt-0.5">{patient.vitals.temp}</div>
                </div>
                <div className="bg-[#f3f3f7] p-2.5 rounded">
                  <span className="text-[10px] text-[#5a5b82]">BP</span>
                  <div className="text-sm font-bold text-[#ba1a1a] mt-0.5">{patient.vitals.bp}</div>
                </div>
                <div className="bg-[#f3f3f7] p-2.5 rounded">
                  <span className="text-[10px] text-[#5a5b82]">Pulse</span>
                  <div className="text-sm font-bold text-[#111124] mt-0.5">{patient.vitals.hr}</div>
                </div>
                <div className="bg-[#f3f3f7] p-2.5 rounded">
                  <span className="text-[10px] text-[#5a5b82]">SpO2</span>
                  <div className="text-sm font-bold text-[#111124] mt-0.5">{patient.vitals.spo2}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* COLUMN 2 */}
        <div className="flex flex-col gap-6">
          {/* CARD 3: ANTIBIOTIC EXPOSURE HISTORY */}
          <section className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#ededf1]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#e8e8ec] flex items-center justify-center text-[#111124]">
                  <span className="material-symbols-outlined text-[18px]">medication</span>
                </div>
                <h2 className="text-sm text-[#111124] font-semibold">3. Antibiotic Exposure (Past 90 Days)</h2>
              </div>
            </div>

            {patient.history.priorAntibiotics90Days.length > 0 ? (
              <div className="space-y-2">
                {patient.history.priorAntibiotics90Days.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#f3f3f7] rounded border border-[#ededf1] text-xs">
                    <div className="font-bold text-[#111124]">{item.name}</div>
                    <div className="text-[#5a5b82] text-[11px] mt-0.5">Duration: {item.duration} · Given: {item.timing}</div>
                    <span className="text-[10px] font-semibold text-[#111124] bg-white px-2 py-0.5 rounded mt-1 inline-block">
                      Indication: {item.reason}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#5a5b82] italic">No prior 90-day antibiotic exposure recorded.</p>
            )}
          </section>

          {/* CARD 4: PAST RESISTANT ISOLATES & ALLERGIES */}
          <section className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#ededf1]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#e8e8ec] flex items-center justify-center text-[#111124]">
                  <span className="material-symbols-outlined text-[18px]">history</span>
                </div>
                <h2 className="text-sm text-[#111124] font-semibold">4. Microbiology History & Allergies</h2>
              </div>
            </div>

            {patient.history.priorCultures12Months.length > 0 && (
              <div className="p-3 bg-[#ffdad6]/40 border border-[#ffdad6] rounded text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#ba1a1a]">Past Resistant Isolate (12 Months)</span>
                <div className="font-bold text-[#111124]">{patient.history.priorCultures12Months[0].organism}</div>
                <div className="text-[#93000a] text-[11px] font-semibold">{patient.history.priorCultures12Months[0].resistance}</div>
              </div>
            )}

            {patient.history.allergies.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-100 rounded text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#ba1a1a]">Drug Allergy Alert</span>
                <div className="font-bold text-[#ba1a1a]">{patient.history.allergies[0].allergen} — {patient.history.allergies[0].severity}</div>
                <div className="text-gray-700 text-[11px]">Reaction: {patient.history.allergies[0].reaction}</div>
              </div>
            )}
          </section>

          {/* CTA Next Step */}
          <div className="bg-[#111124] text-white rounded-xl p-5 space-y-3 shadow-sm">
            <div className="text-xs font-bold uppercase text-[#c5c5d5]">Next Step</div>
            <p className="text-xs text-[#c5c5d5]">Run XGBoost AMR prediction model based on collected clinical profile parameters.</p>
            <NavLink
              to={`/doctor/patient/${patient.id}/amr-risk`}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-[#111124] font-bold text-xs rounded hover:bg-[#ededf1] transition-colors"
            >
              <span>Run AMR Risk Assessment</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
