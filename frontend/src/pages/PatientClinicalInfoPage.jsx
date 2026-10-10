import React, { useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { PatientHeader } from '../components/PatientHeader';
import { RoleAssessmentEditorModal } from '../components/RoleAssessmentEditorModal';
import {
  Edit3,
  Badge,
  Activity,
  Stethoscope,
  Microscope,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const PatientClinicalInfoPage = () => {
  const { id } = useParams();
  const { getPatientById, loading, dbError } = usePatients();
  const { role: userRole } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const patient = getPatientById(id);

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <PatientHeader />
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading clinical intake record...</p>
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
          <p className="text-sm font-bold">Unable to load clinical record from database.</p>
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

      {/* Top Breadcrumb & Edit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#ededf1]">
        <div className="flex items-center gap-1.5 text-xs text-[#5a5b82]">
          <NavLink to="/doctor/patients" className="hover:text-[#111124]">Patients</NavLink>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1a1c1f] font-medium">{patient.name} ({patient.mrn})</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#5a5b82]">Clinical Intake & 10k Parameters</span>
        </div>

        <button
          type="button"
          onClick={() => setIsEditorOpen(true)}
          className="px-4 py-2 rounded-lg bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-300" />
          <span>Edit Role Clinical Data ({userRole.toUpperCase()})</span>
        </button>
      </div>

      {/* 2-Column Main Clinical Grid (matching 10k Dataset Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMN 1 */}
        <div className="flex flex-col gap-6">
          
          {/* CARD 1: PATIENT IDENTITY & ENCOUNTER */}
          <section className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ededf1]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#111124] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </div>
                <div>
                  <h2 className="text-sm text-[#111124] font-bold">1. Patient Baseline & Encounter</h2>
                  <p className="text-[11px] text-[#5a5b82]">10k Schema: patient_id, encounter_id, admission_datetime</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                {patient.encounterId || 'ENC-20250001'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1]">
                <label className="text-[10px] text-[#5a5b82] font-semibold block mb-0.5">patient_id / MRN</label>
                <div className="font-mono font-bold text-[#111124]">{patient.id}</div>
              </div>
              <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1]">
                <label className="text-[10px] text-[#5a5b82] font-semibold block mb-0.5">age_years & sex</label>
                <div className="font-bold text-[#111124]">{patient.age} years • {patient.gender}</div>
              </div>
              <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1]">
                <label className="text-[10px] text-[#5a5b82] font-semibold block mb-0.5">ward & bed</label>
                <div className="font-bold text-[#111124]">{patient.ward} • {patient.bed}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1]">
                <label className="text-[10px] text-[#5a5b82] font-semibold block mb-0.5">pregnancy_status</label>
                <div className="font-medium text-[#111124]">{patient.pregnancyStatus || 'Not applicable'}</div>
              </div>
              <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1]">
                <label className="text-[10px] text-[#5a5b82] font-semibold block mb-0.5">admission_datetime</label>
                <div className="font-medium text-[#111124]">{patient.admissionDate || '2025-01-01'}</div>
              </div>
            </div>
          </section>

          {/* CARD 2: CURRENT CLINICAL PRESENTATION & NURSING VITALS */}
          <section className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ededf1]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm text-[#111124] font-bold">2. Clinical Presentation & Nursing Vitals</h2>
                  <p className="text-[11px] text-[#5a5b82]">10k Schema: temperature_c, heart_rate_bpm, systolic/diastolic, crp_mg_l</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                Acute Vitals
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-[#5a5b82] font-semibold block mb-1">primary_diagnosis & infection_source</label>
                <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1] text-xs font-bold text-[#111124]">
                  {patient.primaryDiagnosis} ({patient.infectionSource})
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#5a5b82] font-semibold block mb-1">suspected_pathogen</label>
                <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1] text-xs font-semibold text-indigo-900">
                  {patient.suspectedPathogen}
                </div>
              </div>
            </div>

            {/* Bedside Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[#f9f9fd] p-2 rounded-lg border border-[#ededf1] text-center">
                <span className="text-[10px] text-[#5a5b82] block">temperature_c</span>
                <span className="font-bold text-base text-[#ba1a1a]">{patient.vitals.temp}</span>
              </div>
              <div className="bg-[#f9f9fd] p-2 rounded-lg border border-[#ededf1] text-center">
                <span className="text-[10px] text-[#5a5b82] block">heart_rate_bpm</span>
                <span className="font-bold text-base text-[#111124]">{patient.vitals.hr}</span>
              </div>
              <div className="bg-[#f9f9fd] p-2 rounded-lg border border-[#ededf1] text-center">
                <span className="text-[10px] text-[#5a5b82] block">bp_mmhg</span>
                <span className="font-bold text-base text-[#111124]">{patient.vitals.bp}</span>
              </div>
              <div className="bg-[#f9f9fd] p-2 rounded-lg border border-[#ededf1] text-center">
                <span className="text-[10px] text-[#5a5b82] block">spo2_percent</span>
                <span className="font-bold text-base text-[#111124]">{patient.vitals.spo2}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#f9f9fd] p-2 rounded-lg border border-[#ededf1]">
                <span className="text-[10px] text-[#5a5b82] block">respiratory_rate_bpm</span>
                <span className="font-semibold text-[#111124]">{patient.vitals.rr || '20 bpm'}</span>
              </div>
              <div className="bg-[#f9f9fd] p-2 rounded-lg border border-[#ededf1]">
                <span className="text-[10px] text-[#5a5b82] block">crp_mg_l</span>
                <span className="font-semibold text-[#111124]">{patient.vitals.crp}</span>
              </div>
            </div>
          </section>

        </div>

        {/* COLUMN 2 */}
        <div className="flex flex-col gap-6">
          
          {/* CARD 3: PRIOR ANTIBIOTIC EXPOSURES & COMORBIDITIES */}
          <section className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ededf1]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm text-[#111124] font-bold">3. Prior Antibiotic Exposures & Comorbidities</h2>
                  <p className="text-[11px] text-[#5a5b82]">10k Schema: prior_antibiotic_90d, prior_resistant_organism</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-[#f9f9fd] p-3 rounded-lg border border-[#ededf1] space-y-1">
                <span className="text-[10px] text-[#5a5b82] font-semibold block">prior_antibiotic_90d & exposure_count</span>
                <div className="font-bold text-[#111124]">
                  {patient.history.priorAntibiotic90d || 'None recorded in prior 90 days'}
                </div>
                <div className="text-[11px] text-[#5a5b82]">
                  Exposure Count (90d): {patient.history.priorAntibioticCount90d || 0} • Duration: {patient.history.priorAntibioticDays || 0} days
                </div>
              </div>

              <div className="bg-[#f9f9fd] p-3 rounded-lg border border-[#ededf1] space-y-1">
                <span className="text-[10px] text-[#5a5b82] font-semibold block">prior_resistant_organism</span>
                <div className="font-bold text-[#ba1a1a]">
                  {patient.history.priorResistantOrganism || 'None known'}
                </div>
              </div>

              <div className="bg-[#f9f9fd] p-3 rounded-lg border border-[#ededf1] space-y-1">
                <span className="text-[10px] text-[#5a5b82] font-semibold block">comorbidities & organ_function</span>
                <div className="font-medium text-[#111124]">
                  {Array.isArray(patient.history.comorbidities) ? patient.history.comorbidities.join('; ') : (patient.history.comorbidities || 'None documented')}
                </div>
                <div className="text-[11px] text-[#5a5b82] mt-1">
                  Kidney: <span className="font-semibold text-[#111124]">{patient.organFunction?.kidney || 'Normal'}</span> • Liver: <span className="font-semibold text-[#111124]">{patient.organFunction?.liver || 'Normal'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* CARD 4: MICROBIOLOGY CULTURE & DRUG ALLERGIES */}
          <section className="bg-white rounded-xl p-5 shadow-xs border border-[#ededf1] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ededf1]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Microscope className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm text-[#111124] font-bold">4. Microbiology Culture & Allergies</h2>
                  <p className="text-[11px] text-[#5a5b82]">10k Schema: culture_status, culture_pathogen, resistance_phenotype</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1]">
                <span className="text-[10px] text-[#5a5b82] block">culture_status</span>
                <span className="font-bold text-[#111124]">{patient.cultureResult?.status || 'Pending'}</span>
              </div>
              <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1]">
                <span className="text-[10px] text-[#5a5b82] block">culture_pathogen</span>
                <span className="font-bold text-[#111124]">{patient.cultureResult?.organism || 'Pending'}</span>
              </div>
            </div>

            <div className="bg-[#f9f9fd] p-2.5 rounded-lg border border-[#ededf1] text-xs">
              <span className="text-[10px] text-[#5a5b82] block">drug_allergy & allergy_severity</span>
              <span className="font-bold text-[#ba1a1a]">
                {patient.history?.drugAllergy || (patient.history?.allergies?.[0]?.allergen) || 'None known'}
              </span>
            </div>
          </section>

          {/* Quick CTA to AMR Risk Result */}
          <div className="bg-[#111124] text-white rounded-xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">AMR Risk Status</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                {patient.amrRiskLevel} ({patient.amrRiskScore}%)
              </span>
            </div>
            <p className="text-xs text-[#c5c5d5]">
              Evaluate multi-drug resistance risk and view explainability attributions.
            </p>
            <NavLink
              to={`/doctor/patient/${patient.id}/amr-risk`}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-[#111124] font-bold text-xs rounded-lg hover:bg-[#ededf1] transition-colors"
            >
              <span>View AMR Risk Stratification</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>

        </div>
      </div>

      {/* Role Editor Modal */}
      <RoleAssessmentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        patient={patient}
      />
    </div>
  );
};
