import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { RecordVitalsModal } from '../components/RecordVitalsModal';

export const NurseDashboardPage = () => {
  const { patients, loading, dbError } = usePatients();
  const [selectedPatientForVitals, setSelectedPatientForVitals] = useState(null);

  // Filter only active admitted patients currently in hospital
  const activePatients = patients.filter(p => p.admissionStatus === 'Admitted' || !p.admissionStatus);

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading nurse ward worklist...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <div className="p-8 text-center bg-red-50 text-red-900 rounded-xl border border-red-200 space-y-2">
          <span className="material-symbols-outlined text-3xl text-red-600">error</span>
          <p className="text-sm font-bold">Unable to load nurse worklist from database.</p>
          <p className="text-xs text-red-700">{dbError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#111124] text-[24px]">medical_services</span>
            <h1 className="text-2xl font-bold text-[#111124] tracking-tight">ICU Ward Nurse Worklist</h1>
          </div>
          <p className="text-xs text-[#5a5b82] mt-0.5">
            Assigned ward patients, rapid vital sign recording, upcoming medication doses, and deterioration alerts.
          </p>
        </div>

        <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-full self-start sm:self-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Shift: Active Charge Nurse
        </span>
      </div>

      {/* Rapid Alert Banner */}
      {activePatients.length > 0 && (
        <div className="p-4 bg-[#ffdad6]/40 border border-[#ffdad6] rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div className="text-xs text-[#93000a]">
              <strong>Vital Check Reminder:</strong> {activePatients[0].name} ({activePatients[0].bed}) due for vital sign recording.
            </div>
          </div>
          <button
            onClick={() => setSelectedPatientForVitals(activePatients[0])}
            className="px-3 py-1.5 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded shadow-xs shrink-0"
          >
            Record Vitals Now
          </button>
        </div>
      )}

      {/* Patient Vitals Grid */}
      {activePatients.length === 0 ? (
        <div className="p-12 text-center text-[#5a5b82] space-y-2 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-4xl text-[#8e8ea9]">inpatient</span>
          <p className="text-base font-bold text-[#111124]">No active ward inpatients.</p>
          <p className="text-xs">There are currently no active admitted patients assigned to this ward worklist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activePatients.map(patient => (
          <div
            key={patient.id}
            className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#ededf1] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#111124] text-white flex items-center justify-center font-bold text-xs">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111124]">{patient.name}</h3>
                  <p className="text-[11px] text-[#5a5b82]">{patient.bed} • <span className="font-mono font-bold">{patient.mrn}</span></p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                patient.amrRiskLevel === 'High' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {patient.amrRiskLevel} AMR Risk
              </span>
            </div>

            {/* Current Vitals Block */}
            <div className="grid grid-cols-4 gap-2 bg-[#f3f3f7] p-3 rounded-xl border border-[#ededf1] text-center">
              <div>
                <span className="text-[9px] font-bold text-[#5a5b82] uppercase">Temp</span>
                <p className="text-xs font-bold text-[#111124]">{patient.vitals.temp}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#5a5b82] uppercase">HR</span>
                <p className="text-xs font-bold text-[#111124]">{patient.vitals.hr}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#5a5b82] uppercase">BP</span>
                <p className="text-xs font-bold text-[#111124]">{patient.vitals.bp}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#5a5b82] uppercase">SpO2</span>
                <p className="text-xs font-bold text-[#111124]">{patient.vitals.spo2}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#5a5b82]">Regimen: <strong className="text-[#111124]">{patient.decisionLog.chosenOption || 'Meropenem 1g IV'}</strong></span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPatientForVitals(patient)}
                  className="px-3 py-1.5 bg-[#f3f3f7] hover:bg-[#ededf1] text-[#111124] font-bold text-xs rounded transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Update Vitals</span>
                </button>

                <NavLink
                  to={`/nurse/patient/${patient.id}`}
                  className="px-3 py-1.5 bg-[#111124] hover:bg-[#26263a] text-white font-bold text-xs rounded transition-colors flex items-center gap-1"
                >
                  <span>Details</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </NavLink>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <RecordVitalsModal
        isOpen={!!selectedPatientForVitals}
        onClose={() => setSelectedPatientForVitals(null)}
        patient={selectedPatientForVitals}
      />
    </div>
  );
};
