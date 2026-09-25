import React, { useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { RecordVitalsModal } from '../components/RecordVitalsModal';

export const NursePatientDetailPage = () => {
  const { id } = useParams();
  const { getPatientById } = usePatients();
  const patient = getPatientById(id || 'P-72309');
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [marLog, setMarLog] = useState([
    { time: '08:00 AM', dose: 'Meropenem 500mg IV', adminBy: 'RN Sarah Jenkins', status: 'Administered' },
    { time: '04:00 PM', dose: 'Meropenem 500mg IV', adminBy: 'RN Sarah Jenkins', status: 'Scheduled' },
    { time: '12:00 AM', dose: 'Meropenem 500mg IV', adminBy: 'Night Shift RN', status: 'Scheduled' }
  ]);

  const toggleMar = (index) => {
    setMarLog(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          status: item.status === 'Administered' ? 'Scheduled' : 'Administered'
        };
      }
      return item;
    }));
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <NavLink to="/nurse/dashboard" className="p-2 rounded bg-[#f3f3f7] text-[#111124] hover:bg-[#ededf1]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </NavLink>
          <div className="w-12 h-12 rounded-full bg-[#111124] text-white flex items-center justify-center font-bold text-base">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111124]">{patient.name}</h1>
            <p className="text-xs text-[#5a5b82]">{patient.bed} • {patient.ward} • MRN: <span className="font-mono font-bold text-[#111124]">{patient.mrn}</span></p>
          </div>
        </div>

        <button
          onClick={() => setIsVitalsModalOpen(true)}
          className="px-4 py-2 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">ecg_heart</span>
          <span>Record New Vital Signs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Vitals & MAR */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Vital Signs Card */}
          <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#111124] flex items-center gap-2 border-b border-[#ededf1] pb-3">
              <span className="material-symbols-outlined text-[18px]">monitor_heart</span>
              Nurse Vital Sign Recording ({patient.vitals.updatedAt})
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#f3f3f7] rounded border border-[#ededf1]">
                <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Temperature</span>
                <p className="text-lg font-bold text-[#111124] mt-0.5">{patient.vitals.temp}</p>
              </div>
              <div className="p-3 bg-[#f3f3f7] rounded border border-[#ededf1]">
                <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Heart Rate</span>
                <p className="text-lg font-bold text-[#111124] mt-0.5">{patient.vitals.hr}</p>
              </div>
              <div className="p-3 bg-[#f3f3f7] rounded border border-[#ededf1]">
                <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Blood Pressure</span>
                <p className="text-lg font-bold text-[#111124] mt-0.5">{patient.vitals.bp}</p>
              </div>
              <div className="p-3 bg-[#f3f3f7] rounded border border-[#ededf1]">
                <span className="text-[10px] font-bold text-[#5a5b82] uppercase">SpO2 Oxygen</span>
                <p className="text-lg font-bold text-[#111124] mt-0.5">{patient.vitals.spo2}</p>
              </div>
              <div className="p-3 bg-[#f3f3f7] rounded border border-[#ededf1]">
                <span className="text-[10px] font-bold text-[#5a5b82] uppercase">WBC Count</span>
                <p className="text-lg font-bold text-[#111124] mt-0.5">{patient.vitals.wbc}</p>
              </div>
              <div className="p-3 bg-[#f3f3f7] rounded border border-[#ededf1]">
                <span className="text-[10px] font-bold text-[#5a5b82] uppercase">CRP Inflammatory</span>
                <p className="text-lg font-bold text-[#111124] mt-0.5">{patient.vitals.crp}</p>
              </div>
            </div>
          </div>

          {/* MAR (Medication Administration Record) */}
          <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#111124] flex items-center gap-2 border-b border-[#ededf1] pb-3">
              <span className="material-symbols-outlined text-[18px]">medication</span>
              Medication Administration Record (MAR Signoff)
            </h2>

            <div className="space-y-3">
              {marLog.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#f3f3f7] border border-[#ededf1] rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#5a5b82]">schedule</span>
                    <div>
                      <span className="font-bold text-[#111124]">{item.dose}</span>
                      <p className="text-[11px] text-[#5a5b82]">Scheduled: {item.time} • Assigned: {item.adminBy}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleMar(idx)}
                    className={`px-3 py-1.5 rounded font-bold text-xs transition-colors flex items-center gap-1 ${
                      item.status === 'Administered'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-[#111124] text-white hover:bg-[#26263a]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>{item.status}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: AMR Risk & Precautions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-3">
            <h3 className="text-xs font-bold text-[#5a5b82] uppercase tracking-wider">AMR Risk Banner</h3>
            <div className={`p-4 rounded-xl border text-center space-y-1 ${
              patient.amrRiskLevel === 'High' ? 'bg-[#ffdad6]/40 border-[#ffdad6] text-[#93000a]' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <span className="text-xs font-bold uppercase">{patient.amrRiskLevel} AMR Risk ({patient.amrRiskScore}%)</span>
              <p className="text-[11px] text-gray-700 mt-1">Contact Isolation Precautions: Glove & Gown required</p>
            </div>
          </div>
        </div>
      </div>

      <RecordVitalsModal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        patient={patient}
      />
    </div>
  );
};
