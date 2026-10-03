import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { AddPatientModal } from '../components/AddPatientModal';

export const PatientsListPage = () => {
  const { patients, searchQuery, setSearchQuery, selectedRiskFilter, setSelectedRiskFilter, loading, dbError } = usePatients();
  const { role } = useAuth();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [infectionFilter, setInfectionFilter] = useState('');
  const [cohortFilter, setCohortFilter] = useState('All');
  const [statusTab, setStatusTab] = useState('Active'); // 'Active' | 'Discharged' | 'All'

  // Sync tab with location search if navigated via /doctor/patients?tab=history
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'history') {
      setStatusTab('All');
    } else {
      setStatusTab('Active');
    }
  }, [location.search]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading master inpatient registry...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="p-8 text-center bg-red-50 text-red-900 rounded-xl border border-red-200 space-y-2">
          <span className="material-symbols-outlined text-3xl text-red-600">error</span>
          <p className="text-sm font-bold">Unable to load inpatient registry from database.</p>
          <p className="text-xs text-red-700">{dbError}</p>
        </div>
      </div>
    );
  }

  const activeCount = patients.filter(p => p.admissionStatus === 'Admitted' || !p.admissionStatus).length;
  const dischargedCount = patients.filter(p => p.admissionStatus === 'Recovered & Discharged').length;

  const filtered = patients.filter(p => {
    const isDischarged = p.admissionStatus === 'Recovered & Discharged';
    const matchesTab =
      statusTab === 'All' ||
      (statusTab === 'Active' && !isDischarged) ||
      (statusTab === 'Discharged' && isDischarged);

    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.bed.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.suspectedPathogen.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.outcomeNotes && p.outcomeNotes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRisk = selectedRiskFilter === 'All' || p.amrRiskLevel === selectedRiskFilter;
    const matchesInfection = !infectionFilter || p.infectionSource.toLowerCase().includes(infectionFilter.toLowerCase());
    const matchesCohort = cohortFilter === 'All' || (cohortFilter === 'ICU' && p.ward.includes('ICU')) || (cohortFilter === 'Critical' && p.amrRiskLevel === 'High');
    
    return matchesTab && matchesSearch && matchesRisk && matchesInfection && matchesCohort;
  });

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Header & Metric Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[#5a5b82] px-2 py-0.5 rounded bg-[#e8e8ec] font-semibold">
              Clinical Registry & History
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#47464c] bg-[#f3f3f7] px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Bi-directional LIS Live
            </span>
          </div>
          <h1 className="text-2xl text-[#111124] tracking-tight font-bold">
            {statusTab === 'Discharged' ? 'Discharged & Recovered Patient History' : statusTab === 'All' ? 'Patient Clinical History (All Patients)' : 'Inpatient Directory & Records'}
          </h1>
          <p className="text-xs text-[#47464c] max-w-2xl">
            Complete clinical audit trail of active hospitalized patients and recovered historical records, antimicrobial treatment outcomes, and genomic resistance profiles.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start lg:self-auto">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-xs border border-[#ededf1]">
            <div className="w-9 h-9 rounded-lg bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
              <span className="material-symbols-outlined text-[20px]">folder_shared</span>
            </div>
            <div>
              <div className="text-[10px] text-[#5a5b82] uppercase font-semibold">Total Records</div>
              <div className="text-sm text-[#111124] font-bold">{patients.length} <span className="text-xs font-normal text-[#47464c]">Patients</span></div>
            </div>
          </div>
          {role !== 'nurse' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#111124] text-white text-xs font-semibold hover:bg-[#26263a] transition-all shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Add Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Toggle: Active vs Discharged & Recovered History */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#ededf1] pb-3">
        <button
          onClick={() => setStatusTab('Active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            statusTab === 'Active'
              ? 'bg-[#111124] text-white shadow-xs'
              : 'bg-white text-[#5a5b82] hover:bg-[#f3f3f7] border border-[#ededf1]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">bed</span>
          <span>Active Inpatients</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusTab === 'Active' ? 'bg-white/20 text-white' : 'bg-[#f3f3f7] text-[#111124]'}`}>
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('Discharged')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            statusTab === 'Discharged'
              ? 'bg-[#111124] text-white shadow-xs'
              : 'bg-white text-[#5a5b82] hover:bg-[#f3f3f7] border border-[#ededf1]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history_edu</span>
          <span>Discharged & Recovered History</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusTab === 'Discharged' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
            {dischargedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            statusTab === 'All'
              ? 'bg-[#111124] text-white shadow-xs'
              : 'bg-white text-[#5a5b82] hover:bg-[#f3f3f7] border border-[#ededf1]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">all_inclusive</span>
          <span>All Patient Archives</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusTab === 'All' ? 'bg-white/20 text-white' : 'bg-[#f3f3f7] text-[#111124]'}`}>
            {patients.length}
          </span>
        </button>
      </div>

      {/* Surveillance Filter Suite */}
      <div className="bg-white rounded-xl shadow-xs p-4 space-y-4 border border-[#ededf1]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Field */}
          <div className="md:col-span-4 relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#5a5b82] text-[19px]">search</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f3f3f7] text-[#1a1c1f] text-xs placeholder:text-[#78767d] focus:outline-none focus:bg-white transition-colors"
              placeholder="Search by name, MRN, outcome, pathogen, or ward..."
              type="text"
            />
          </div>

          {/* AMR Risk Tier Selector */}
          <div className="md:col-span-3 relative">
            <select
              value={selectedRiskFilter}
              onChange={e => setSelectedRiskFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-lg bg-[#f3f3f7] text-[#1a1c1f] text-xs focus:outline-none cursor-pointer"
            >
              <option value="All">AMR Risk: All Tiers</option>
              <option value="High">Critical Risk (≥75%)</option>
              <option value="Medium">Guarded (40–74%)</option>
              <option value="Low">Standard Risk (&lt;40%)</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[#5a5b82] text-[18px] pointer-events-none">expand_more</span>
          </div>

          {/* Primary Infection Focus */}
          <div className="md:col-span-3 relative">
            <select
              value={infectionFilter}
              onChange={e => setInfectionFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-lg bg-[#f3f3f7] text-[#1a1c1f] text-xs focus:outline-none cursor-pointer"
            >
              <option value="">Infection: All Sites</option>
              <option value="blood">Bloodstream / Sepsis</option>
              <option value="respiratory">Respiratory (HAP/VAP)</option>
              <option value="urinary">Urinary Tract (CAUTI)</option>
              <option value="abdominal">Intra-abdominal</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[#5a5b82] text-[18px] pointer-events-none">expand_more</span>
          </div>

          {/* Reset button */}
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={() => { setSearchQuery(''); setSelectedRiskFilter('All'); setInfectionFilter(''); setCohortFilter('All'); }}
              className="text-xs text-[#5a5b82] hover:text-[#111124] transition-colors flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset
            </button>
          </div>
        </div>

        {/* Quick Triage Filter Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#ededf1]">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] uppercase tracking-wider text-[#5a5b82] font-semibold">Cohort:</span>
            <button
              onClick={() => setCohortFilter('All')}
              className={`px-2.5 py-1 rounded text-xs font-medium ${cohortFilter === 'All' ? 'bg-[#111124] text-white' : 'bg-[#f3f3f7] text-[#1a1c1f]'}`}
            >
              All Records
            </button>
            <button
              onClick={() => setCohortFilter('Critical')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${cohortFilter === 'Critical' ? 'bg-[#111124] text-white' : 'bg-[#f3f3f7] text-[#1a1c1f]'}`}
            >
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
              Critical AMR
            </button>
            <button
              onClick={() => setCohortFilter('ICU')}
              className={`px-2.5 py-1 rounded text-xs font-medium ${cohortFilter === 'ICU' ? 'bg-[#111124] text-white' : 'bg-[#f3f3f7] text-[#1a1c1f]'}`}
            >
              ICU Cohort
            </button>
          </div>
          <span className="text-xs text-[#5a5b82]">Filtered: {filtered.length} records</span>
        </div>
      </div>

      {/* Structured Master Table */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-[#ededf1]">
        {loading ? (
          <div className="p-12 text-center text-[#5a5b82] space-y-3">
            <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
            <p className="text-sm font-semibold">Loading patient data from database...</p>
          </div>
        ) : dbError ? (
          <div className="p-8 text-center bg-red-50 text-red-900 border-b border-red-200 space-y-2">
            <span className="material-symbols-outlined text-3xl text-red-600">error</span>
            <p className="text-sm font-bold">Unable to load patient data from database.</p>
            <p className="text-xs text-red-700">{dbError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#5a5b82] space-y-2">
            <span className="material-symbols-outlined text-4xl text-[#8e8ea9]">search_off</span>
            <p className="text-base font-bold text-[#111124]">No patients found.</p>
            <p className="text-xs">No records match the selected filters or database query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1000px]">
              <thead>
                <tr className="bg-[#f3f3f7] text-[#5a5b82] uppercase text-[10px] tracking-wider font-semibold border-b border-[#ededf1]">
                  <th className="py-3 px-4">MRN</th>
                  <th className="py-3 px-4">Patient & Demographics</th>
                  <th className="py-3 px-4">Infection & Pathogen</th>
                  <th className="py-3 px-4">Admission Timeline</th>
                  <th className="py-3 px-4">AMR Risk</th>
                  <th className="py-3 px-4">Status & Outcome</th>
                  {role !== 'nurse' && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededf1]">
              {filtered.map(patient => {
                const isRecovered = patient.admissionStatus === 'Recovered & Discharged';

                return (
                  <tr key={patient.id} className="hover:bg-[#f3f3f7]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#111124]">{patient.mrn}</td>
                    <td className="py-3 px-4">
                      <NavLink
                        to={role === 'nurse' ? `/nurse/patient/${patient.id}` : `/doctor/patient/${patient.id}/clinical`}
                        className="font-bold text-[#111124] hover:underline block"
                      >
                        {patient.name}
                      </NavLink>
                      <div className="text-[11px] text-[#5a5b82]">
                        {patient.age}y / {patient.gender} · <span className="font-semibold text-[#111124]">{patient.ward}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#1a1c1f]">{patient.infectionSource}</div>
                      <div className="text-[11px] text-[#ba1a1a] font-medium">{patient.suspectedPathogen}</div>
                    </td>
                    <td className="py-3 px-4 text-[#5a5b82] text-[11px]">
                      <div>Admitted: <strong>{patient.admissionDate}</strong></div>
                      {patient.dischargeDate ? (
                        <div className="text-emerald-700 font-medium">Discharged: <strong>{patient.dischargeDate}</strong></div>
                      ) : (
                        <div className="text-indigo-600 font-medium">Current Inpatient</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        patient.amrRiskLevel === 'High' ? 'bg-[#ffdad6] text-[#93000a]' :
                        patient.amrRiskLevel === 'Medium' ? 'bg-amber-100 text-amber-900' :
                        'bg-emerald-100 text-emerald-900'
                      }`}>
                        {patient.amrRiskLevel} {patient.amrRiskScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {isRecovered ? (
                        <div>
                          <div className="font-semibold text-emerald-800 text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            <span>Recovered & Discharged</span>
                          </div>
                          <p className="text-[11px] text-[#47464c] mt-0.5">{patient.outcomeNotes}</p>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-[#111124] text-xs">
                            Active Bed: {patient.bed}
                          </div>
                          <p className="text-[11px] text-[#5a5b82] mt-0.5">{patient.status}</p>
                        </div>
                      )}
                    </td>
                    {role !== 'nurse' && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <NavLink
                            to={`/doctor/patient/${patient.id}/amr-risk`}
                            className="px-2.5 py-1 bg-[#111124] hover:bg-[#26263a] text-white font-semibold rounded text-[11px]"
                          >
                            AMR Risk
                          </NavLink>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <AddPatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
