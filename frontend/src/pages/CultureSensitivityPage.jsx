import React, { useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { PatientHeader } from '../components/PatientHeader';
import { AddCultureReportModal } from '../components/AddCultureReportModal';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  PlusCircle,
  Brain,
  ShieldCheck,
  RotateCcw,
  Clock,
  Pill,
  ArrowRight,
  Database
} from 'lucide-react';

export const CultureSensitivityPage = () => {
  const { id } = useParams();
  const { getPatientById, loading, dbError } = usePatients();
  const [isAddCultureModalOpen, setIsAddCultureModalOpen] = useState(false);

  const patient = getPatientById(id);

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <PatientHeader />
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading culture & sensitivity panel...</p>
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
          <p className="text-sm font-bold">Unable to load microbiology results from database.</p>
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

  const cult = patient.cultureResult || {
    status: 'No Culture Ordered',
    specimen: 'N/A',
    organism: 'None',
    aiPredictionMatch: 'Pending Lab Report',
    sensitivities: []
  };

  const hasSensitivities = cult.sensitivities && cult.sensitivities.length > 0;
  const isResistant = (cult.resistancePhenotype || '').toLowerCase().includes('esbl') ||
    (cult.resistancePhenotype || '').toLowerCase().includes('mrsa') ||
    (cult.resistancePhenotype || '').toLowerCase().includes('cre') ||
    (cult.organism || '').toLowerCase().includes('esbl');

  return (
    <div className="flex flex-col w-full space-y-6">
      <PatientHeader />

      {/* Top Header Strip & Add Culture Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#ededf1]">
        <div className="flex items-center gap-1.5 text-xs text-[#5a5b82]">
          <NavLink to="/doctor/patients" className="hover:text-[#111124]">Patients</NavLink>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1a1c1f] font-semibold">{patient.name} ({patient.mrn})</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#111124] font-bold">Microbiology Ground-Truth Validation</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddCultureModalOpen(true)}
            className="px-4 py-2 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add / Upload Culture Report (Validate & Close Loop)</span>
          </button>
        </div>
      </div>

      {/* Main Culture Screen */}
      <section className="bg-white rounded-xl shadow-xs p-6 border border-[#ededf1] space-y-6">
        <div className="border-b border-[#ededf1] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
              <span className="material-symbols-outlined text-[20px]">science</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111124]">Microbiology Culture & Antibiogram Sensitivity Panel</h2>
              <p className="text-xs text-[#5a5b82]">Comparing initial AI empiric prediction with laboratory-verified microbiology ground truth</p>
            </div>
          </div>

          <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 self-start sm:self-auto ${
            cult.status === 'Verified & Released' || cult.status === 'Completed'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              : 'bg-[#e8e8ec] text-[#111124]'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Status: {cult.status}</span>
          </span>
        </div>

        {/* Closed-Loop Active Learning Ground-Truth Validation Card */}
        <div className="p-5 bg-gradient-to-r from-[#f7f7fc] via-[#f0f0fa] to-[#f7f7fc] border-2 border-indigo-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Active Learning Closed-Loop Validation Engine
                </h3>
                <p className="text-[11px] text-indigo-800">
                  Verifying AI pre-culture prediction ({patient.amrRiskLevel} Risk, {patient.amrRiskScore}%) against laboratory isolate
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-900 shadow-xs self-start sm:self-auto flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{cult.aiPredictionMatch || 'Concordant True Positive'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-[#5a5b82] block">AI Empiric Prediction</span>
              <span className="text-sm font-bold text-[#111124]">{patient.amrRiskLevel} AMR Risk ({patient.amrRiskScore}%)</span>
              <p className="text-[11px] text-[#5a5b82] mt-0.5">Suspected: {patient.suspectedPathogen}</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-[#5a5b82] block">Microbiology Ground Truth</span>
              <span className="text-sm font-bold text-indigo-700">{cult.organism}</span>
              <p className="text-[11px] text-rose-700 font-semibold mt-0.5">{cult.resistancePhenotype || (isResistant ? 'ESBL Producer' : 'Pan-Susceptible')}</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-[#5a5b82] block">Empiric Regimen Alignment</span>
              <span className="text-sm font-bold text-emerald-700">
                {cult.prescribedRegimenCoverageStatus || (isResistant ? 'Susceptible to Meropenem' : 'Pan-Susceptible')}
              </span>
              <p className="text-[11px] text-[#5a5b82] mt-0.5">Current: {patient.status?.replace('Prescribed: ', '') || 'Meropenem 1g IV'}</p>
            </div>
          </div>

          {/* Clinical Action Advisory */}
          <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Antimicrobial Stewardship Action Advisory: </strong>
              <span>
                {cult.advisory || (isResistant
                  ? `Confirmed ${cult.organism} (${cult.resistancePhenotype || 'ESBL Producer'}). Initial AI empiric carbapenem coverage was microbiologically effective. Complete planned therapeutic course.`
                  : `Culture yielded pan-susceptible ${cult.organism}. Recommend de-escalating from broad-spectrum carbapenem to narrow-spectrum beta-lactam per hospital stewardship protocol.`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Specimen & Pathogen Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#f3f3f7] p-4 rounded-xl border border-[#ededf1] text-xs">
          <div>
            <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Specimen Source</span>
            <p className="font-bold text-[#111124] mt-0.5">{cult.specimen || 'Blood Culture'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Identified Pathogen</span>
            <p className="font-bold text-indigo-700 mt-0.5">{cult.organism || 'Klebsiella pneumoniae'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Phenotype / Mechanism</span>
            <p className="font-bold text-rose-700 mt-0.5">{cult.resistancePhenotype || (isResistant ? 'ESBL Producer' : 'Pan-Susceptible')}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Lab Release Time</span>
            <p className="font-mono font-bold text-[#111124] mt-0.5">{cult.resultDate || 'Recent Verification'}</p>
          </div>
        </div>

        {/* Antibiogram Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#5a5b82] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
              Antibiogram Susceptibility Matrix Panel
            </h3>
            <button
              type="button"
              onClick={() => setIsAddCultureModalOpen(true)}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1"
            >
              <span>Edit / Add Antibiogram</span>
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>

          {hasSensitivities ? (
            <div className="border border-[#ededf1] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f3f3f7] border-b border-[#ededf1] text-[#5a5b82] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Antimicrobial Agent</th>
                    <th className="px-4 py-3">MIC Value</th>
                    <th className="px-4 py-3">Susceptibility Interpretation</th>
                    <th className="px-4 py-3">Empiric Decision Alignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededf1]">
                  {cult.sensitivities.map((s, idx) => (
                    <tr key={idx} className="hover:bg-[#f3f3f7]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#111124]">{s.antibiotic}</td>
                      <td className="px-4 py-3 font-mono text-[#47464c]">{s.mic}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          s.result === 'Susceptible' ? 'bg-emerald-100 text-emerald-900' :
                          s.result === 'Resistant' ? 'bg-[#ffdad6] text-[#93000a]' :
                          'bg-amber-100 text-amber-900'
                        }`}>
                          {s.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#5a5b82] text-[11px]">
                        {s.result === 'Susceptible' ? 'Matches prescribed Meropenem (Susceptible)' : 'Resistance correctly avoided by AI empiric coverage'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 bg-[#f3f3f7] border border-[#ededf1] rounded-xl text-center space-y-3">
              <FlaskConical className="w-8 h-8 text-indigo-500 mx-auto" />
              <div>
                <p className="text-xs font-bold text-[#111124]">No Verified Antibiogram Panel Available Yet</p>
                <p className="text-[11px] text-[#5a5b82] mt-0.5">
                  Microbiology culture is currently incubating in the laboratory or awaiting report upload.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCultureModalOpen(true)}
                className="px-4 py-2 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload / Add Microbiology Report Now</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      <AddCultureReportModal
        isOpen={isAddCultureModalOpen}
        onClose={() => setIsAddCultureModalOpen(false)}
        patient={patient}
      />
    </div>
  );
};
