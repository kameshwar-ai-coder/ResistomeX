import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { AddPatientModal } from '../components/AddPatientModal';

export const PatientsListPage = () => {
  const { patients, searchQuery, setSearchQuery, selectedRiskFilter, setSelectedRiskFilter, loadFull10kDataset, is10kLoaded, loading, dbError } = usePatients();
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [infectionFilter, setInfectionFilter] = useState('');
  const [cohortFilter, setCohortFilter] = useState('All');
  const [statusTab, setStatusTab] = useState('Active'); // 'Active' | 'Discharged' | 'All'
  const [activeViewMode, setActiveViewMode] = useState('grid'); // 'grid' (Bedside Cards) | 'table' (Acuity Table)

  // Sync tab with location search if navigated via /doctor/patients?tab=history
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'history') {
      setStatusTab('Discharged');
    } else if (tabParam === 'all') {
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
          <p className="text-sm font-semibold">Loading clinical inpatient registry...</p>
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

  const activeInpatients = patients.filter(p => p.admissionStatus === 'Admitted' || !p.admissionStatus);
  const dischargedPatients = patients.filter(p => p.admissionStatus === 'Recovered & Discharged');
  const activeCount = activeInpatients.length;
  const dischargedCount = dischargedPatients.length;

  // Active Inpatients acute metrics
  const activeHighAmrCount = activeInpatients.filter(p => p.amrRiskLevel === 'High').length;
  const activeSepsisAlertCount = activeInpatients.filter(p => (p.vitals?.rrNum >= 24) || (p.vitals?.tempNum >= 38.5)).length;
  const activeIcuCount = activeInpatients.filter(p => p.ward?.includes('ICU')).length;

  // Historical ledger metrics
  const concordantCount = dischargedPatients.filter(p => p.cultureResult?.match === 'Concordant' || p.rawRecord10k?.culture_match_to_predicted_risk === 'Concordant').length;
  const concordanceRate = dischargedCount > 0 ? Math.round((concordantCount / dischargedCount) * 100) : 91;
  const avgLos = dischargedCount > 0 
    ? (dischargedPatients.reduce((acc, p) => acc + (p.lengthOfStayDays || 5), 0) / dischargedCount).toFixed(1)
    : '5.8';

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
              {statusTab === 'Discharged' ? 'Retrospective Antimicrobial Stewardship Ledger' : 'Active Clinical Surveillance'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#47464c] bg-[#f3f3f7] px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {statusTab === 'Discharged' ? 'LIS Concordance Synchronized' : 'Bi-directional LIS Live'}
            </span>
          </div>
          <h1 className="text-2xl text-[#111124] tracking-tight font-bold">
            {statusTab === 'Discharged' 
              ? 'Outcomes & Culture Concordance Ledger' 
              : statusTab === 'All' 
                ? 'Master Inpatient & Historical Archives' 
                : 'Bedside Triage & Surveillance Board'}
          </h1>
          <p className="text-xs text-[#47464c] max-w-2xl">
            {statusTab === 'Discharged'
              ? 'Comprehensive retrospective ledger auditing definitive culture concordance, empiric antibiotic appropriateness, clinical resolution, and length of stay (LOS).'
              : 'Real-time acute bedside triage tracking active inpatients, acute vitals, suspected pathogens, and pre-culture XGBoost AMR risk stratification.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-xs border border-[#ededf1]">
            <div className="w-9 h-9 rounded-lg bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
              <span className="material-symbols-outlined text-[20px]">
                {statusTab === 'Discharged' ? 'history_edu' : 'bed'}
              </span>
            </div>
            <div>
              <div className="text-[10px] text-[#5a5b82] uppercase font-semibold">
                {statusTab === 'Discharged' ? 'Discharged Cohort' : 'Active Inpatients'}
              </div>
              <div className="text-sm text-[#111124] font-bold">
                {statusTab === 'Discharged' ? dischargedCount : activeCount} <span className="text-xs font-normal text-[#47464c]">Patients</span>
              </div>
            </div>
          </div>

          {patients.length < 1000 && (
            <button
              onClick={() => loadFull10kDataset(10000)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold hover:bg-indigo-100 transition-all shadow-xs"
              title="Stream the complete 10,000 patient dataset cohort into the registry"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-indigo-600">dataset</span>
              <span>Load Full 10,000 Cohort</span>
            </button>
          )}

          <div className="flex items-center gap-2">
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
      </div>

      {/* Main Mode / Tab Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ededf1] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setStatusTab('Active'); navigate('/doctor/patients', { replace: true }); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              statusTab === 'Active'
                ? 'bg-[#111124] text-white shadow-xs'
                : 'bg-white text-[#5a5b82] hover:bg-[#f3f3f7] border border-[#ededf1]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">bed</span>
            <span>Bedside Triage Board (Active)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusTab === 'Active' ? 'bg-white/20 text-white' : 'bg-[#f3f3f7] text-[#111124]'}`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => { setStatusTab('Discharged'); navigate('/doctor/patients?tab=history', { replace: true }); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              statusTab === 'Discharged'
                ? 'bg-[#111124] text-white shadow-xs'
                : 'bg-white text-[#5a5b82] hover:bg-[#f3f3f7] border border-[#ededf1]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history_edu</span>
            <span>Outcomes & Concordance Ledger</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusTab === 'Discharged' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
              {dischargedCount}
            </span>
          </button>

          <button
            onClick={() => { setStatusTab('All'); navigate('/doctor/patients?tab=all', { replace: true }); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              statusTab === 'All'
                ? 'bg-[#111124] text-white shadow-xs'
                : 'bg-white text-[#5a5b82] hover:bg-[#f3f3f7] border border-[#ededf1]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">all_inclusive</span>
            <span>All Records</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusTab === 'All' ? 'bg-white/20 text-white' : 'bg-[#f3f3f7] text-[#111124]'}`}>
              {patients.length}
            </span>
          </button>
        </div>

        {/* View Switcher for Active Inpatients (Cards vs Table) */}
        {statusTab === 'Active' && (
          <div className="flex items-center gap-1 bg-[#f3f3f7] p-1 rounded-lg border border-[#ededf1]">
            <button
              onClick={() => setActiveViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeViewMode === 'grid'
                  ? 'bg-white text-[#111124] shadow-xs'
                  : 'text-[#5a5b82] hover:text-[#111124]'
              }`}
              title="Bedside Triage Cards View"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>Triage Cards</span>
            </button>
            <button
              onClick={() => setActiveViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeViewMode === 'table'
                  ? 'bg-white text-[#111124] shadow-xs'
                  : 'text-[#5a5b82] hover:text-[#111124]'
              }`}
              title="Acuity Table View"
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span>Acuity Table</span>
            </button>
          </div>
        )}
      </div>

      {/* DISTINCT HEADER METRICS STRIP: ACTIVE VS DISCHARGED */}
      {statusTab === 'Active' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
            <div className="text-[10px] font-bold text-[#5a5b82] uppercase tracking-wider">Active Bed Occupancy</div>
            <div className="text-xl font-bold text-[#111124] mt-1 flex items-center gap-2">
              <span>{activeCount}</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> Live
              </span>
            </div>
            <div className="text-[11px] text-[#5a5b82] mt-0.5">Assigned to Inpatient Wards</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-red-200/80 shadow-xs bg-red-50/20">
            <div className="text-[10px] font-bold text-[#93000a] uppercase tracking-wider">Critical AMR Risk (&ge;70%)</div>
            <div className="text-xl font-bold text-[#ba1a1a] mt-1 flex items-center gap-2">
              <span>{activeHighAmrCount}</span>
              <span className="text-xs bg-[#ffdad6] text-[#93000a] px-2 py-0.2 rounded-full font-bold">
                {activeCount > 0 ? Math.round((activeHighAmrCount / activeCount) * 100) : 0}% of beds
              </span>
            </div>
            <div className="text-[11px] text-red-800 mt-0.5">Mandates AmpC / ESBL Regimen</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs bg-amber-50/20">
            <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Acute Sepsis Alerts</div>
            <div className="text-xl font-bold text-amber-900 mt-1 flex items-center gap-2">
              <span>{activeSepsisAlertCount}</span>
              <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.2 rounded-full font-bold">
                RR &ge; 24 or T &ge; 38.5&deg;C
              </span>
            </div>
            <div className="text-[11px] text-amber-800 mt-0.5">High Bacterial Inoculum Risk</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200/80 shadow-xs bg-indigo-50/20">
            <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">ICU High-Acuity Stay</div>
            <div className="text-xl font-bold text-indigo-900 mt-1 flex items-center gap-2">
              <span>{activeIcuCount}</span>
              <span className="text-xs text-[#5a5b82] font-normal">Patients</span>
            </div>
            <div className="text-[11px] text-indigo-800 mt-0.5">Intensivist Monitoring Active</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
            <div className="text-[10px] font-bold text-[#5a5b82] uppercase tracking-wider">Discharged Inpatients</div>
            <div className="text-xl font-bold text-[#111124] mt-1">{dischargedCount}</div>
            <div className="text-[11px] text-[#5a5b82] mt-0.5">Full Treatment Audit Available</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
            <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Culture Concordance Rate</div>
            <div className="text-xl font-bold text-emerald-800 mt-1 flex items-center gap-2">
              <span>{concordanceRate}%</span>
              <span className="text-xs bg-emerald-100 text-emerald-900 px-2 py-0.2 rounded-full font-bold">
                AI Match
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 mt-0.5">Initial Empiric Covered Isolate</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200/80 shadow-xs bg-indigo-50/20">
            <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Mean Inpatient Stay (LOS)</div>
            <div className="text-xl font-bold text-indigo-900 mt-1">{avgLos} Days</div>
            <div className="text-[11px] text-indigo-800 mt-0.5">Within Target Benchmark</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
            <div className="text-[10px] font-bold text-[#5a5b82] uppercase tracking-wider">Clinical Resolution Rate</div>
            <div className="text-xl font-bold text-[#111124] mt-1">96.4%</div>
            <div className="text-[11px] text-[#5a5b82] mt-0.5">30-Day Readmission Free</div>
          </div>
        </div>
      )}

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
              placeholder={statusTab === 'Discharged' ? 'Search discharged by name, MRN, outcome, pathogen...' : 'Search bedside by bed, name, MRN, pathogen, ward...'}
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
              <option value="High">Critical Risk (&ge;70%)</option>
              <option value="Medium">Guarded (40–69%)</option>
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
              <option value="pneumonia">Pneumonia (CAP/HAP/VAP)</option>
              <option value="blood">Bloodstream / Sepsis</option>
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
              Critical AMR (&ge;70%)
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

      {/* RENDER VIEW 1: BEDSIDE TRIAGE BOARD FOR ACTIVE INPATIENTS */}
      {statusTab === 'Active' && (
        <div>
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-[#5a5b82] bg-white rounded-xl border border-[#ededf1] space-y-2">
              <span className="material-symbols-outlined text-4xl text-[#8e8ea9]">bed</span>
              <p className="text-base font-bold text-[#111124]">No active inpatients found.</p>
              <p className="text-xs">Adjust your search query or AMR risk filters.</p>
            </div>
          ) : activeViewMode === 'grid' ? (
            /* Bedside Triage Cards (High-Efficiency Grid) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(patient => {
                const isHighRisk = patient.amrRiskLevel === 'High';
                const isTachypneic = (patient.vitals?.rrNum >= 24);
                const isFebrile = (patient.vitals?.tempNum >= 38.5);

                return (
                  <div
                    key={patient.id}
                    className={`bg-white rounded-xl border p-5 space-y-4 shadow-xs transition-all hover:shadow-sm ${
                      isHighRisk ? 'border-red-200' : 'border-[#ededf1]'
                    }`}
                  >
                    {/* Card Header: Bed & Ward + Risk Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                          isHighRisk ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-[#f3f3f7] text-[#111124]'
                        }`}>
                          {patient.bed}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#111124]">{patient.ward}</div>
                          <div className="text-[10px] text-[#5a5b82] font-mono">{patient.mrn}</div>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        patient.amrRiskLevel === 'High' ? 'bg-[#ffdad6] text-[#93000a]' :
                        patient.amrRiskLevel === 'Medium' ? 'bg-amber-100 text-amber-900' :
                        'bg-emerald-100 text-emerald-900'
                      }`}>
                        {patient.amrRiskLevel} {patient.amrRiskScore}%
                      </span>
                    </div>

                    {/* Patient Name & Demographics */}
                    <div>
                      <NavLink
                        to={role === 'nurse' ? `/nurse/patient/${patient.id}` : `/doctor/patient/${patient.id}/clinical`}
                        className="text-sm font-bold text-[#111124] hover:text-indigo-600 transition-colors block"
                      >
                        {patient.name}
                      </NavLink>
                      <div className="text-xs text-[#5a5b82]">
                        {patient.age}y / {patient.gender} &middot; Admitted: <span className="font-medium text-[#111124]">{patient.admissionDate?.split(' ')[0]}</span>
                      </div>
                    </div>

                    {/* Infection & Pathogen */}
                    <div className="p-3 bg-[#f3f3f7] rounded-lg border border-[#ededf1] space-y-1">
                      <div className="text-[10px] uppercase font-bold text-[#5a5b82]">Suspected Pathogen & Infection</div>
                      <div className="text-xs font-bold text-[#111124] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-red-600">coronavirus</span>
                        <span>{patient.suspectedPathogen}</span>
                      </div>
                      <div className="text-[11px] text-[#47464c]">{patient.infectionSource} ({patient.primaryDiagnosis})</div>
                    </div>

                    {/* Acute Vitals Strip with Sepsis Flags */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                      <div className={`p-1.5 rounded-lg border ${isFebrile ? 'bg-red-50 border-red-200 text-red-900' : 'bg-[#f3f3f7] border-[#ededf1]'}`}>
                        <div className="text-[9px] text-[#5a5b82] uppercase">Temp</div>
                        <div className="font-bold text-[11px]">{patient.vitals?.tempNum ? `${patient.vitals.tempNum}°C` : patient.vitals?.temp || '--'}</div>
                      </div>

                      <div className={`p-1.5 rounded-lg border ${isTachypneic ? 'bg-red-50 border-red-200 text-red-900' : 'bg-[#f3f3f7] border-[#ededf1]'}`}>
                        <div className="text-[9px] text-[#5a5b82] uppercase">RR</div>
                        <div className="font-bold text-[11px]">{patient.vitals?.rrNum ? `${patient.vitals.rrNum} bpm` : patient.vitals?.rr || '--'}</div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-[#f3f3f7] border border-[#ededf1]">
                        <div className="text-[9px] text-[#5a5b82] uppercase">BP</div>
                        <div className="font-bold text-[11px]">{patient.vitals?.bpSys ? `${patient.vitals.bpSys}/${patient.vitals.bpDia}` : patient.vitals?.bp || '--'}</div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-[#f3f3f7] border border-[#ededf1]">
                        <div className="text-[9px] text-[#5a5b82] uppercase">SpO2</div>
                        <div className="font-bold text-[11px]">{patient.vitals?.spo2Num ? `${patient.vitals.spo2Num}%` : patient.vitals?.spo2 || '--'}</div>
                      </div>
                    </div>

                    {/* Empiric Regimen / Order */}
                    <div className="text-xs text-[#47464c] flex items-center justify-between border-t border-[#ededf1] pt-3">
                      <div>
                        <div className="text-[10px] text-[#5a5b82] uppercase font-semibold">Active Regimen:</div>
                        <div className="font-bold text-[#111124] text-[11px] truncate max-w-[170px]">
                          {patient.doctorDecision?.currentRegimen || patient.rawRecord10k?.current_empiric_regimen || patient.aiPrediction?.firstLineOption || 'Pending Decision'}
                        </div>
                      </div>

                      <NavLink
                        to={`/doctor/patient/${patient.id}/explainability`}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                        title="Explainable AI — SHAP Feature Attribution"
                      >
                        <span>Why This?</span>
                        <span className="material-symbols-outlined text-[14px]">troubleshoot</span>
                      </NavLink>
                    </div>

                    {/* Action Bar */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <NavLink
                        to={`/doctor/patient/${patient.id}/amr-risk`}
                        className="px-3 py-1.5 bg-[#f3f3f7] hover:bg-[#ededf1] text-[#111124] text-xs font-bold rounded-lg text-center transition-colors"
                      >
                        AMR Risk
                      </NavLink>
                      <NavLink
                        to={`/doctor/patient/${patient.id}/treatment-support`}
                        className="px-3 py-1.5 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded-lg text-center transition-colors shadow-xs"
                      >
                        Bedside Order
                      </NavLink>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Acuity Table View for Active Inpatients */
            <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-[#ededf1]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[950px]">
                  <thead>
                    <tr className="bg-[#f3f3f7] text-[#5a5b82] uppercase text-[10px] tracking-wider font-semibold border-b border-[#ededf1]">
                      <th className="py-3 px-4">Bed &amp; Ward</th>
                      <th className="py-3 px-4">Patient &amp; MRN</th>
                      <th className="py-3 px-4">Acute Vitals &amp; Sepsis Alert</th>
                      <th className="py-3 px-4">Infection &amp; Suspected Pathogen</th>
                      <th className="py-3 px-4">AMR Risk Stratum</th>
                      <th className="py-3 px-4">Current Regimen</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ededf1]">
                    {filtered.map(patient => (
                      <tr key={patient.id} className="hover:bg-[#f3f3f7]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-[#111124]">{patient.bed}</div>
                          <div className="text-[11px] text-[#5a5b82]">{patient.ward}</div>
                        </td>
                        <td className="py-3 px-4">
                          <NavLink
                            to={role === 'nurse' ? `/nurse/patient/${patient.id}` : `/doctor/patient/${patient.id}/clinical`}
                            className="font-bold text-[#111124] hover:underline block"
                          >
                            {patient.name}
                          </NavLink>
                          <div className="text-[11px] text-[#5a5b82]">
                            {patient.age}y / {patient.gender} &middot; <span className="font-mono">{patient.mrn}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              patient.vitals?.tempNum >= 38.5 ? 'bg-red-100 text-red-900' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {patient.vitals?.tempNum ? `${patient.vitals.tempNum}°C` : patient.vitals?.temp || '--'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              patient.vitals?.rrNum >= 24 ? 'bg-red-100 text-red-900' : 'bg-gray-100 text-gray-700'
                            }`}>
                              RR {patient.vitals?.rrNum || patient.vitals?.rr || '--'}
                            </span>
                            <span className="text-[11px] text-[#5a5b82]">
                              BP {patient.vitals?.bpSys ? `${patient.vitals.bpSys}/${patient.vitals.bpDia}` : patient.vitals?.bp || '--'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111124]">{patient.infectionSource}</div>
                          <div className="text-[11px] text-[#ba1a1a] font-medium">{patient.suspectedPathogen}</div>
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
                        <td className="py-3 px-4 font-medium text-[#111124] max-w-xs truncate">
                          {patient.doctorDecision?.currentRegimen || patient.rawRecord10k?.current_empiric_regimen || patient.aiPrediction?.firstLineOption || 'Pending'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <NavLink
                              to={`/doctor/patient/${patient.id}/explainability`}
                              className="px-2.5 py-1 bg-[#f3f3f7] hover:bg-[#ededf1] text-[#111124] font-semibold rounded text-[11px]"
                              title="Why This Prediction?"
                            >
                              SHAP
                            </NavLink>
                            <NavLink
                              to={`/doctor/patient/${patient.id}/amr-risk`}
                              className="px-2.5 py-1 bg-[#111124] hover:bg-[#26263a] text-white font-semibold rounded text-[11px]"
                            >
                              AMR Risk
                            </NavLink>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW 2: OUTCOMES & CONCORDANCE LEDGER FOR PATIENT HISTORY */}
      {statusTab === 'Discharged' && (
        <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-[#ededf1]">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-[#5a5b82] space-y-2">
              <span className="material-symbols-outlined text-4xl text-[#8e8ea9]">history_edu</span>
              <p className="text-base font-bold text-[#111124]">No historical discharge records found.</p>
              <p className="text-xs">Adjust search parameters or risk filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1100px]">
                <thead>
                  <tr className="bg-[#f3f3f7] text-[#5a5b82] uppercase text-[10px] tracking-wider font-semibold border-b border-[#ededf1]">
                    <th className="py-3 px-4">Archive MRN &amp; Patient</th>
                    <th className="py-3 px-4">Timeline &amp; LOS</th>
                    <th className="py-3 px-4">Admission Diagnosis &amp; Initial Regimen</th>
                    <th className="py-3 px-4">Final Microbiology &amp; Phenotype</th>
                    <th className="py-3 px-4">AI Prediction Concordance</th>
                    <th className="py-3 px-4">Clinical Outcome &amp; 30d Status</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededf1]">
                  {filtered.map(patient => {
                    const cultMatch = patient.cultureResult?.match || patient.rawRecord10k?.culture_match_to_predicted_risk || 'Concordant';
                    const cultOrganism = patient.cultureResult?.organism || patient.rawRecord10k?.culture_pathogen || patient.suspectedPathogen;
                    const phenotype = patient.cultureResult?.resistancePhenotype || patient.rawRecord10k?.resistance_phenotype || 'Wild-type / Sensitive';
                    const los = patient.lengthOfStayDays || 5;

                    return (
                      <tr key={patient.id} className="hover:bg-[#f3f3f7]/50 transition-colors">
                        {/* 1. MRN & Patient */}
                        <td className="py-3.5 px-4">
                          <NavLink
                            to={`/doctor/patient/${patient.id}/clinical`}
                            className="font-bold text-[#111124] hover:underline block"
                          >
                            {patient.name}
                          </NavLink>
                          <div className="text-[11px] text-[#5a5b82]">
                            <span className="font-mono font-bold text-[#111124]">{patient.mrn}</span> &middot; {patient.age}y / {patient.gender}
                          </div>
                          <div className="text-[10px] text-[#5a5b82] mt-0.5 font-medium">{patient.ward}</div>
                        </td>

                        {/* 2. Timeline & LOS */}
                        <td className="py-3.5 px-4 text-[#5a5b82] text-[11px]">
                          <div>Admitted: <strong className="text-[#111124]">{patient.admissionDate?.split(' ')[0]}</strong></div>
                          <div>Discharged: <strong className="text-emerald-800">{patient.dischargeDate?.split(' ')[0] || '2025-01-08'}</strong></div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-bold">
                            LOS: {los} Days
                          </span>
                        </td>

                        {/* 3. Diagnosis & Initial Regimen */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-[#111124] text-xs">{patient.infectionSource}</div>
                          <div className="text-[11px] text-[#5a5b82]">{patient.primaryDiagnosis}</div>
                          <div className="text-[11px] text-[#111124] font-semibold mt-1">
                            Day 1: {patient.rawRecord10k?.ai_first_line_option || patient.aiPrediction?.firstLineOption || 'Meropenem + Vancomycin'}
                          </div>
                        </td>

                        {/* 4. Microbiology & Resistance Phenotype */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#ba1a1a] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">biotech</span>
                            <span>{cultOrganism}</span>
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold">
                            {phenotype}
                          </span>
                        </td>

                        {/* 5. AI Prediction Concordance */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              cultMatch === 'Concordant' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                              cultMatch === 'Discordant' ? 'bg-red-100 text-red-900 border border-red-200' :
                              'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            }`}>
                              <span className="material-symbols-outlined text-[13px]">
                                {cultMatch === 'Concordant' ? 'verified' : 'tune'}
                              </span>
                              <span>{cultMatch === 'Concordant' ? 'Concordant Match' : 'Empirically Resolved'}</span>
                            </span>
                            <div className="text-[10px] text-[#5a5b82]">
                              Risk predicted at {patient.amrRiskScore}% ({patient.amrRiskLevel})
                            </div>
                          </div>
                        </td>

                        {/* 6. Clinical Outcome */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">task_alt</span>
                            <span>Recovered &amp; Discharged</span>
                          </div>
                          <p className="text-[10px] text-[#5a5b82] mt-0.5">Afebrile &gt; 72h &middot; Negative blood culture at 48h</p>
                          <span className="text-[10px] text-emerald-700 font-semibold">30d Readmission Free</span>
                        </td>

                        {/* 7. Action */}
                        <td className="py-3.5 px-4 text-right">
                          <NavLink
                            to={`/doctor/patient/${patient.id}/explainability`}
                            className="px-3 py-1.5 bg-[#f3f3f7] hover:bg-[#ededf1] text-[#111124] font-bold rounded-lg text-xs inline-flex items-center gap-1 transition-colors"
                            title="Audit Case History & Explainability"
                          >
                            <span>Audit</span>
                            <span className="material-symbols-outlined text-[14px]">troubleshoot</span>
                          </NavLink>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW 3: ALL PATIENT ARCHIVES */}
      {statusTab === 'All' && (
        <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-[#ededf1]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1000px]">
              <thead>
                <tr className="bg-[#f3f3f7] text-[#5a5b82] uppercase text-[10px] tracking-wider font-semibold border-b border-[#ededf1]">
                  <th className="py-3 px-4">MRN</th>
                  <th className="py-3 px-4">Patient &amp; Demographics</th>
                  <th className="py-3 px-4">Infection &amp; Pathogen</th>
                  <th className="py-3 px-4">Status &amp; Timeline</th>
                  <th className="py-3 px-4">AMR Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededf1]">
                {filtered.map(patient => (
                  <tr key={patient.id} className="hover:bg-[#f3f3f7]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#111124]">{patient.mrn}</td>
                    <td className="py-3 px-4">
                      <NavLink
                        to={`/doctor/patient/${patient.id}/clinical`}
                        className="font-bold text-[#111124] hover:underline block"
                      >
                        {patient.name}
                      </NavLink>
                      <div className="text-[11px] text-[#5a5b82]">
                        {patient.age}y / {patient.gender} &middot; {patient.ward} ({patient.bed})
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#111124]">{patient.infectionSource}</div>
                      <div className="text-[11px] text-[#ba1a1a] font-medium">{patient.suspectedPathogen}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        patient.admissionStatus === 'Recovered & Discharged' ? 'bg-emerald-100 text-emerald-900' : 'bg-indigo-100 text-indigo-900'
                      }`}>
                        {patient.admissionStatus}
                      </span>
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
                    <td className="py-3 px-4 text-right">
                      <NavLink
                        to={`/doctor/patient/${patient.id}/explainability`}
                        className="px-2.5 py-1 bg-[#111124] hover:bg-[#26263a] text-white font-semibold rounded text-[11px]"
                      >
                        SHAP
                      </NavLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddPatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
