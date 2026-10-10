import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { 
  User, 
  Bed, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Dna, 
  HelpCircle, 
  Pill, 
  CheckCircle, 
  Activity, 
  FlaskConical, 
  ArrowLeft 
} from 'lucide-react';

export const PatientHeader = () => {
  const { id } = useParams();
  const { getPatientById, loading } = usePatients();
  const patient = getPatientById(id);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#dcdcec] p-4 mb-6 text-xs text-[#5a5b82] flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-xl animate-spin">sync</span>
        <span>Loading patient profile...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white rounded-xl border border-[#dcdcec] p-4 mb-6 text-xs text-[#5a5b82] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NavLink to="/doctor/patients" className="p-1.5 rounded bg-[#F7F7FB] hover:bg-[#EDEDF4] text-[#26263A]">
            <ArrowLeft className="w-4 h-4" />
          </NavLink>
          <span>Patient record not found for ID: <strong>{id}</strong></span>
        </div>
      </div>
    );
  }

  const patientIdToUse = patient.id;

  const navTabs = [
    { label: 'Clinical Info', path: `/doctor/patient/${patientIdToUse}/clinical`, icon: FileText },
    { label: 'AMR Risk Engine', path: `/doctor/patient/${patientIdToUse}/amr-risk`, icon: Dna },
    { label: 'Why This Prediction?', path: `/doctor/patient/${patientIdToUse}/explainability`, icon: HelpCircle },
    { label: 'Treatment Support', path: `/doctor/patient/${patientIdToUse}/treatment-support`, icon: Pill },
    { label: 'Doctor Decision', path: `/doctor/patient/${patientIdToUse}/decision`, icon: CheckCircle },
    { label: 'Patient Monitoring', path: `/doctor/patient/${patientIdToUse}/monitoring`, icon: Activity },
    { label: 'Culture & Sensitivity', path: `/doctor/patient/${patientIdToUse}/culture`, icon: FlaskConical },
  ];

  const getRiskBadge = (level, score) => {
    if (level === 'High') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          HIGH AMR RISK ({score}%)
        </span>
      );
    }
    if (level === 'Medium') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          MEDIUM RISK ({score}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        LOW RISK ({score}%)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-[#dcdcec] shadow-xs overflow-hidden mb-6">
      {/* Top Banner Info */}
      <div className="p-5 border-b border-[#dcdcec] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-white via-[#F7F7FB] to-white">
        <div className="flex items-start gap-4">
          <NavLink to="/doctor/patients" className="p-2 rounded-lg bg-[#F7F7FB] hover:bg-[#EDEDF4] text-[#26263A] transition-colors mt-1">
            <ArrowLeft className="w-4 h-4" />
          </NavLink>
          <div className="w-12 h-12 rounded-xl bg-[#26263A] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {(patient.name || 'PT').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2) || 'PT'}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-[#26263A] tracking-tight">{patient.name || 'Inpatient'}</h1>
              <span className="text-sm font-semibold text-gray-500">{patient.age}y / {patient.gender}</span>
              <span className="text-xs font-mono font-bold bg-gray-100 px-2.5 py-0.5 rounded text-gray-700">{patient.mrn}</span>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-100">{patient.bed}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1 flex items-center gap-2">
              <span className="font-semibold text-gray-900">Diagnosis:</span> {patient.primaryDiagnosis}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-1.5 flex-wrap">
              <span><strong>Infection Source:</strong> {patient.infectionSource}</span>
              <span>•</span>
              <span><strong>Suspected Pathogen:</strong> {patient.suspectedPathogen}</span>
              <span>•</span>
              <span><strong>Attending:</strong> {patient.attendingDoctor}</span>
            </div>
          </div>
        </div>

        {/* Right Status Pill & Actions */}
        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
          {getRiskBadge(patient.amrRiskLevel, patient.amrRiskScore)}
          <span className="text-[11px] text-gray-500">Decision Status: <strong className="text-gray-800">{patient.status}</strong></span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 px-4 overflow-x-auto bg-[#F7F7FB] border-t border-[#dcdcec]">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-[#26263A] text-[#26263A] bg-white shadow-xs'
                    : 'border-transparent text-[#7A7AA3] hover:text-[#26263A] hover:bg-gray-100/60'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
