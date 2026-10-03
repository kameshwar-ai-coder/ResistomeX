import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { AddPatientModal } from '../components/AddPatientModal';

export const DoctorDashboardPage = () => {
  const { patients, loading, dbError } = usePatients();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading active inpatient worklist...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="p-8 text-center bg-red-50 text-red-900 rounded-xl border border-red-200 space-y-2">
          <span className="material-symbols-outlined text-3xl text-red-600">error</span>
          <p className="text-sm font-bold">Unable to load patient records from database.</p>
          <p className="text-xs text-red-700">{dbError}</p>
        </div>
      </div>
    );
  }

  // Active hospitalized patients only
  const activePatients = patients.filter(p => p.admissionStatus === 'Admitted' || !p.admissionStatus);

  const activeCount = activePatients.length;
  const highRiskCount = activePatients.filter(p => p.amrRiskLevel === 'High').length;
  const awaitingCulturesCount = activePatients.filter(p => (p.cultureResult?.status || '').includes('Pending') || (p.cultureResult?.status || '').includes('Progress')).length;
  const actionsNeededCount = activePatients.filter(p => (p.status || '').includes('Review') || (p.status || '').includes('Priority')).length;

  const filteredPatients = activePatients.filter(p => {
    if (activeFilter === 'High Risk') return p.amrRiskLevel === 'High';
    if (activeFilter === 'ICU Only') return (p.ward || '').includes('ICU');
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-[#111124] tracking-tight">Physician Worklist</h1>
          <p className="text-xs text-[#5a5b82]">Prioritized overview of active inpatients, immediate risks, and pending lab cultures.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#111124] hover:bg-[#26263a] text-white text-xs px-4 py-2 rounded font-semibold transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>New AMR Assessment</span>
        </button>
      </div>

      {/* 1. TOP SUMMARY STATS (4 Glanceable Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Patients */}
        <div className="bg-white p-4 rounded border border-[#ededf1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#5a5b82] uppercase font-semibold tracking-wider">Active Patients</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl text-[#111124] font-bold">{activeCount}</span>
              <span className="text-xs text-[#5a5b82]">total</span>
            </div>
            <p className="text-xs text-[#47464c] mt-1">Ward: 22 · ICU: 16</p>
          </div>
          <div className="w-10 h-10 rounded bg-[#f3f3f7] flex items-center justify-center text-[#5a5b82]">
            <span className="material-symbols-outlined text-[22px]">group</span>
          </div>
        </div>

        {/* High AMR Risk */}
        <div className="bg-white p-4 rounded border border-[#ededf1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#5a5b82] uppercase font-semibold tracking-wider">High AMR Risk</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl text-[#111124] font-bold">{highRiskCount}</span>
              <span className="bg-[#ffdad6] text-[#93000a] px-1.5 py-0.5 rounded text-[11px] font-bold">High Alert</span>
            </div>
            <p className="text-xs text-[#ba1a1a] font-medium mt-1">Requires immediate action</p>
          </div>
          <div className="w-10 h-10 rounded bg-[#ffdad6]/40 flex items-center justify-center text-[#ba1a1a]">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
        </div>

        {/* Awaiting Cultures */}
        <div className="bg-white p-4 rounded border border-[#ededf1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#5a5b82] uppercase font-semibold tracking-wider">Awaiting Cultures</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl text-[#111124] font-bold">{awaitingCulturesCount}</span>
              <span className="text-xs text-[#5a5b82]">pending</span>
            </div>
            <p className="text-xs text-[#47464c] mt-1">3 results due in &lt; 4h</p>
          </div>
          <div className="w-10 h-10 rounded bg-[#f3f3f7] flex items-center justify-center text-[#5a5b82]">
            <span className="material-symbols-outlined text-[22px]">science</span>
          </div>
        </div>

        {/* Actions Needed */}
        <div className="bg-white p-4 rounded border border-[#111124] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#111124] uppercase font-bold tracking-wider">Actions Needed</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl text-[#111124] font-bold">{actionsNeededCount}</span>
              <span className="bg-[#111124] text-white px-1.5 py-0.5 rounded text-[11px] font-bold">Review</span>
            </div>
            <p className="text-xs text-[#47464c] mt-1">Pending clinical decisions</p>
          </div>
          <div className="w-10 h-10 rounded bg-[#111124] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">fact_check</span>
          </div>
        </div>
      </section>

      {/* 2. MAIN AREA: PATIENTS REQUIRING ATTENTION */}
      <section className="bg-white rounded border border-[#ededf1] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ededf1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></span>
            <h2 className="text-base text-[#111124] font-semibold">Patients Requiring Attention</h2>
            <span className="text-xs text-[#5a5b82] bg-[#ededf1] px-2 py-0.5 rounded-full font-medium">
              {filteredPatients.length} priority cases
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveFilter('All')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeFilter === 'All' ? 'bg-[#111124] text-white' : 'hover:bg-[#ededf1] text-[#47464c]'
              }`}
            >
              All ({activePatients.length})
            </button>
            <button
              onClick={() => setActiveFilter('High Risk')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeFilter === 'High Risk' ? 'bg-[#111124] text-white' : 'hover:bg-[#ededf1] text-[#47464c]'
              }`}
            >
              High Risk ({highRiskCount})
            </button>
            <button
              onClick={() => setActiveFilter('ICU Only')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeFilter === 'ICU Only' ? 'bg-[#111124] text-white' : 'hover:bg-[#ededf1] text-[#47464c]'
              }`}
            >
              ICU Only
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#ededf1]">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="px-6 py-4 hover:bg-[#f3f3f7]/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  patient.amrRiskLevel === 'High' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#e2e0fb] text-[#111124]'
                }`}>
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-[#111124] font-semibold">{patient.name}</span>
                    <span className="text-xs text-[#5a5b82] font-medium">{patient.age}y</span>
                    <span className="text-xs font-mono text-[#5a5b82]">{patient.mrn}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-[#ededf1] text-[#1a1c1f] font-medium">{patient.bed}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#47464c] flex-wrap">
                    <span className="font-medium text-[#1a1c1f]">Source: {patient.infectionSource}</span>
                    <span className="text-[#78767d]">·</span>
                    <span className="inline-flex items-center gap-1 text-[#ba1a1a] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                      {patient.suspectedPathogen}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 justify-between lg:justify-end">
                <div className="flex flex-col items-start lg:items-end">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    patient.amrRiskLevel === 'High' ? 'bg-[#ffdad6] text-[#93000a]' :
                    patient.amrRiskLevel === 'Medium' ? 'bg-amber-100 text-amber-900' :
                    'bg-emerald-100 text-emerald-900'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${patient.amrRiskLevel === 'High' ? 'bg-[#ba1a1a]' : 'bg-emerald-600'}`}></span>
                    {patient.amrRiskLevel} {patient.amrRiskScore}%
                  </span>
                  <span className="text-[11px] text-[#5a5b82] mt-0.5">AMR Risk</span>
                </div>

                <NavLink
                  to={`/doctor/patient/${patient.id}/amr-risk`}
                  className="bg-[#111124] hover:bg-[#26263a] text-white text-xs px-4 py-2 rounded font-medium transition-colors shadow-xs"
                >
                  Review
                </NavLink>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AddPatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
