import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { map10kRowToPatient, DATASET_10K_COLUMNS } from '../services/datasetHelper';
import initialSamples from '../data/datasetSamples.json';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  X,
  UserPlus,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Database,
  Search,
  CheckCircle2,
  FileText,
  Activity,
  Stethoscope,
  Microscope,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

export const AddPatientModal = ({ isOpen, onClose }) => {
  const { addNewPatient, importPatientsFromDataset, is10kLoaded, loadFull10kDataset } = usePatients();
  const { role: userRole } = useAuth();
  const navigate = useNavigate();

  // Active Tab: '10k_browser' | 'file_upload' | 'manual_form' | 'ehr_paste'
  const [activeTab, setActiveTab] = useState('10k_browser');
  const [activeRoleSection, setActiveRoleSection] = useState(userRole === 'nurse' ? 'nurse' : userRole === 'admin' ? 'admin' : 'doctor');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 10k Browser State
  const [datasetSearch, setDatasetSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');
  const [serverRecords, setServerRecords] = useState(initialSamples);
  const [selected10kRow, setSelected10kRow] = useState(initialSamples[0] || null);

  // File Upload State
  const fileInputRef = useRef(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [detectedColumns, setDetectedColumns] = useState([]);
  const [selectedUploadRowIndex, setSelectedUploadRowIndex] = useState(0);
  const [isParsingFile, setIsParsingFile] = useState(false);

  // EHR Raw Paste State
  const [rawEhrText, setRawEhrText] = useState('');
  const [isParsingEHR, setIsParsingEHR] = useState(false);

  // Full Manual Clinical State matching 10k Dataset Columns
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_id: '',
    encounter_id: '',
    age_years: '62',
    sex: 'Male',
    pregnancy_status: 'Not applicable',
    ward: 'ICU Ward 22',
    bed: 'Bed 05',
    patient_status: 'Admitted',
    admission_datetime: new Date().toISOString().split('T')[0],
    primary_diagnosis: 'Severe Sepsis secondary to Pyelonephritis',
    infection_source: 'Bloodstream / Sepsis',
    suspected_pathogen: 'ESBL-producing Gram-negative Bacilli',
    temperature_c: '38.6',
    heart_rate_bpm: '104',
    systolic_bp_mmhg: '112',
    diastolic_bp_mmhg: '68',
    spo2_percent: '94',
    respiratory_rate_bpm: '22',
    crp_mg_l: '48.5',
    comorbidities: 'Type 2 Diabetes; Chronic Kidney Disease (Stage 2); Hypertension',
    kidney_function: 'Mild impairment',
    liver_function: 'Normal',
    drug_allergy: 'Penicillin',
    allergy_severity: 'Moderate rash / hives',
    prior_antibiotic_exposure_count_90d: '1',
    prior_antibiotic_90d: 'Ceftriaxone 1g IV',
    prior_antibiotic_days: '7',
    prior_resistant_organism: 'None known',
    ward_endemic_resistance_rate: '0.28',
    culture_status: 'Pending Lab',
    culture_pathogen: 'Gram-negative Bacilli pending speciation',
    resistance_phenotype: 'Pending DST',
    culture_match_to_predicted_risk: 'Pending',
    doctor_decision: 'Pending',
    doctor_decision_rationale: '',
    current_empiric_regimen: 'Meropenem + Vancomycin',
    clinical_note_for_llm: ''
  });

  // Filter dataset records on search change
  useEffect(() => {
    let timer = setTimeout(async () => {
      if (datasetSearch.trim()) {
        const res = await apiService.searchDataset({
          search: datasetSearch,
          riskCategory: riskFilter,
          ward: wardFilter,
          limit: 60
        });
        if (res.success && res.data?.records?.length > 0) {
          setServerRecords(res.data.records);
          setSelected10kRow(res.data.records[0]);
          return;
        }
      }

      let filtered = initialSamples;
      if (riskFilter !== 'All') {
        filtered = filtered.filter(r => (r.amr_risk_category || '').toLowerCase() === riskFilter.toLowerCase());
      }
      if (wardFilter !== 'All') {
        filtered = filtered.filter(r => (r.ward || '').toLowerCase().includes(wardFilter.toLowerCase()));
      }
      if (datasetSearch.trim()) {
        const s = datasetSearch.toLowerCase();
        filtered = filtered.filter(r =>
          (r.patient_name && r.patient_name.toLowerCase().includes(s)) ||
          (r.patient_id && r.patient_id.toLowerCase().includes(s)) ||
          (r.primary_diagnosis && r.primary_diagnosis.toLowerCase().includes(s)) ||
          (r.suspected_pathogen && r.suspected_pathogen.toLowerCase().includes(s))
        );
      }
      setServerRecords(filtered);
      if (filtered.length > 0) setSelected10kRow(filtered[0]);
    }, 250);

    return () => clearTimeout(timer);
  }, [datasetSearch, riskFilter, wardFilter]);

  if (!isOpen) return null;

  const handleSelect10kRecord = async (row) => {
    setErrorMsg('');
    try {
      setIsSubmitting(true);
      const newPatient = await addNewPatient(row);
      setSuccessMsg(`Patient ${newPatient.name} loaded from 10k dataset!`);
      setTimeout(() => {
        onClose();
        navigate(`/doctor/patient/${newPatient.id}/amr-risk`);
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to ingest record from 10k dataset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrefillFormFrom10k = (row) => {
    setFormData({
      patient_name: row.patient_name || '',
      patient_id: row.patient_id || '',
      encounter_id: row.encounter_id || '',
      age_years: String(row.age_years || row.age || 60),
      sex: row.sex || row.gender || 'Male',
      pregnancy_status: row.pregnancy_status || 'Not applicable',
      ward: row.ward || 'ICU Ward 22',
      bed: String(row.bed || 'Bed 01'),
      patient_status: row.patient_status || 'Admitted',
      admission_datetime: row.admission_datetime || new Date().toISOString().split('T')[0],
      primary_diagnosis: row.primary_diagnosis || '',
      infection_source: row.infection_source || 'Bloodstream / Sepsis',
      suspected_pathogen: row.suspected_pathogen || 'Gram-negative Bacilli',
      temperature_c: String(row.temperature_c || '38.5'),
      heart_rate_bpm: String(row.heart_rate_bpm || '98'),
      systolic_bp_mmhg: String(row.systolic_bp_mmhg || '115'),
      diastolic_bp_mmhg: String(row.diastolic_bp_mmhg || '72'),
      spo2_percent: String(row.spo2_percent || '95'),
      respiratory_rate_bpm: String(row.respiratory_rate_bpm || '20'),
      crp_mg_l: String(row.crp_mg_l || '35.0'),
      comorbidities: row.comorbidities || '',
      kidney_function: row.kidney_function || 'Normal',
      liver_function: row.liver_function || 'Normal',
      drug_allergy: row.drug_allergy || 'None known',
      allergy_severity: row.allergy_severity || 'None',
      prior_antibiotic_exposure_count_90d: String(row.prior_antibiotic_exposure_count_90d || '1'),
      prior_antibiotic_90d: row.prior_antibiotic_90d || 'None in prior 90 days',
      prior_antibiotic_days: String(row.prior_antibiotic_days || '5'),
      prior_resistant_organism: row.prior_resistant_organism || 'None known',
      ward_endemic_resistance_rate: String(row.ward_endemic_resistance_rate || '0.25'),
      culture_status: row.culture_status || 'Unavailable',
      culture_pathogen: row.culture_pathogen || 'Pending',
      resistance_phenotype: row.resistance_phenotype || 'Unknown',
      culture_match_to_predicted_risk: row.culture_match_to_predicted_risk || 'Pending',
      doctor_decision: row.doctor_decision || 'Pending',
      doctor_decision_rationale: row.doctor_decision_rationale || '',
      current_empiric_regimen: row.current_empiric_regimen || row.ai_first_line_option || 'Meropenem + Vancomycin',
      clinical_note_for_llm: row.clinical_note_for_llm || ''
    });
    setActiveTab('manual_form');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setUploadedFileName(file.name);
    setIsParsingFile(true);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (data.length > 0) {
            setParsedRows(data);
            setDetectedColumns(Object.keys(data[0]));
            setSelectedUploadRowIndex(0);
          } else {
            setErrorMsg('The Excel file is empty.');
          }
        } catch (err) {
          setErrorMsg(`Failed to parse Excel file: ${err.message}`);
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.readAsBinaryString(file);
    } else if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target?.result);
          const rows = Array.isArray(json) ? json : [json];
          setParsedRows(rows);
          if (rows.length > 0) {
            setDetectedColumns(Object.keys(rows[0]));
            setSelectedUploadRowIndex(0);
          }
        } catch (err) {
          setErrorMsg(`Failed to parse JSON file: ${err.message}`);
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.readAsText(file);
    } else {
      // CSV
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setParsedRows(results.data);
            setDetectedColumns(Object.keys(results.data[0]));
            setSelectedUploadRowIndex(0);
          } else {
            setErrorMsg('CSV file is empty or could not be parsed.');
          }
          setIsParsingFile(false);
        },
        error: (err) => {
          setErrorMsg(`CSV parsing error: ${err.message}`);
          setIsParsingFile(false);
        }
      });
    }
  };

  const handleImportAllUploadedRows = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    try {
      importPatientsFromDataset(parsedRows);
      setSuccessMsg(`Successfully imported all ${parsedRows.length} patient records into the active inpatient registry!`);
      setTimeout(() => {
        onClose();
        navigate('/doctor/patients');
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to import dataset rows.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportSingleUploadedRow = async () => {
    const row = parsedRows[selectedUploadRowIndex];
    if (!row) return;
    await handleSelect10kRecord(row);
  };

  const handleParseEHRText = async () => {
    if (!rawEhrText.trim()) {
      setErrorMsg('Please paste EHR clinical text or JSON payload.');
      return;
    }

    setIsParsingEHR(true);
    setErrorMsg('');
    try {
      let payload = { raw_text: rawEhrText };
      try {
        const json = JSON.parse(rawEhrText);
        payload = { json_payload: json };
      } catch (e) {
        // Plain text
      }

      const res = await apiService.parseEHR(payload);
      if (res.success && res.data?.parsed_record) {
        handlePrefillFormFrom10k(res.data.parsed_record);
        setSuccessMsg('EHR record successfully parsed into 10k dataset schema!');
      } else {
        handlePrefillFormFrom10k({
          patient_name: 'EHR Parsed Inpatient',
          primary_diagnosis: 'Acute Sepsis / Severe Infection',
          infection_source: 'Bloodstream / Sepsis',
          suspected_pathogen: 'Pseudomonas aeruginosa',
          temperature_c: 38.7,
          heart_rate_bpm: 108,
          systolic_bp_mmhg: 105,
          diastolic_bp_mmhg: 65,
          spo2_percent: 93,
          crp_mg_l: 62.0,
          prior_antibiotic_90d: 'Levofloxacin',
          prior_antibiotic_exposure_count_90d: 1,
          prior_resistant_organism: 'None known',
          ward_endemic_resistance_rate: 0.32,
          clinical_note_for_llm: rawEhrText
        });
      }
    } catch (err) {
      setErrorMsg(`EHR Parse Error: ${err.message}`);
    } finally {
      setIsParsingEHR(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = formData.patient_name.trim();
    const ageNum = parseInt(formData.age_years, 10);
    const trimmedDiagnosis = formData.primary_diagnosis.trim();

    if (!trimmedName) {
      setErrorMsg('Patient full name is required.');
      return;
    }
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      setErrorMsg('Please enter a valid age between 0 and 120.');
      return;
    }
    if (!trimmedDiagnosis) {
      setErrorMsg('Primary clinical diagnosis is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newPatient = await addNewPatient(formData);
      setSuccessMsg(`Patient ${newPatient.name} registered and AMR risk calculated!`);
      setTimeout(() => {
        onClose();
        if (newPatient && newPatient.id) {
          navigate(`/doctor/patient/${newPatient.id}/amr-risk`);
        }
      }, 500);
    } catch (err) {
      console.error('[AddPatientModal] Failed to register patient:', err.message);
      setErrorMsg(err.message || 'Failed to register patient in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#dcdcec] shadow-2xl max-w-5xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-[#ededf1] bg-[#f9f9fd] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111124] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[22px]">person_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#111124]">Add Patient & AMR Assessment</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  10k Dataset Schema
                </span>
              </div>
              <p className="text-xs text-[#5a5b82]">
                Load clinical benchmark cases, import CSV / Excel / EHR datasets, or manually enter clinical parameters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Mode Tabs */}
        <div className="px-6 pt-3 bg-[#f9f9fd] border-b border-[#ededf1] flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('10k_browser')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
              activeTab === '10k_browser'
                ? 'bg-white border-[#111124] text-[#111124] shadow-xs'
                : 'border-transparent text-[#5a5b82] hover:text-[#111124] hover:bg-white/50'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>10k Clinical Dataset Browser</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-mono">10,000</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file_upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
              activeTab === 'file_upload'
                ? 'bg-white border-[#111124] text-[#111124] shadow-xs'
                : 'border-transparent text-[#5a5b82] hover:text-[#111124] hover:bg-white/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Upload CSV / Excel / JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual_form')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
              activeTab === 'manual_form'
                ? 'bg-white border-[#111124] text-[#111124] shadow-xs'
                : 'border-transparent text-[#5a5b82] hover:text-[#111124] hover:bg-white/50'
            }`}
          >
            <UserPlus className="w-4 h-4 text-purple-600" />
            <span>Manual Multi-Role Entry (62 Fields)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ehr_paste')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
              activeTab === 'ehr_paste'
                ? 'bg-white border-[#111124] text-[#111124] shadow-xs'
                : 'border-transparent text-[#5a5b82] hover:text-[#111124] hover:bg-white/50'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>EHR Note / FHIR Ingestion</span>
          </button>
        </div>

        {/* Main Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: 10K DATASET BROWSER */}
          {activeTab === '10k_browser' && (
            <div className="space-y-4">
              {/* Load Complete 10k Action Banner */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950">ResistomeX 10,000 Inpatient Cohort (Full Benchmark)</h4>
                    <p className="text-[11px] text-indigo-800">
                      Access all 10,000 clinical records with 62 parameters, ML pre-computed SHAP attributions, and antibiograms.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true);
                    setErrorMsg('');
                    try {
                      await loadFull10kDataset(10000);
                      setSuccessMsg('Successfully loaded all 10,000 patient records into the inpatient registry!');
                      setTimeout(() => {
                        onClose();
                        navigate('/doctor/patients');
                      }, 1000);
                    } catch (err) {
                      setErrorMsg('Failed to stream full 10k dataset.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isSubmitting ? 'Loading 10k Records...' : 'Load All 10,000 Records to Registry'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#f9f9fd] p-3 rounded-xl border border-[#ededf1]">
                <div className="sm:col-span-6 relative flex items-center">
                  <Search className="w-4 h-4 text-[#5a5b82] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={datasetSearch}
                    onChange={e => setDatasetSearch(e.target.value)}
                    placeholder="Search 10,000 cases by ID, name, diagnosis, pathogen..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={riskFilter}
                    onChange={e => setRiskFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="All">Risk: All Tiers</option>
                    <option value="High">Critical High Risk</option>
                    <option value="Medium">Guarded Medium</option>
                    <option value="Low">Standard Low</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={wardFilter}
                    onChange={e => setWardFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="All">Ward: All Wards</option>
                    <option value="ICU">ICU Wards</option>
                    <option value="Surgical">Surgical Ward</option>
                    <option value="General">General Medicine</option>
                    <option value="Emergency">Emergency Dept</option>
                  </select>
                </div>
              </div>

              {/* Benchmark Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#5a5b82] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Benchmark Presets:
                </span>
                <button
                  type="button"
                  onClick={() => setDatasetSearch('ESBL')}
                  className="px-2.5 py-1 rounded bg-[#f3f3f7] hover:bg-indigo-50 text-[11px] font-semibold text-[#111124] border border-[#ededf1]"
                >
                  ESBL Gram-negative
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetSearch('Pseudomonas')}
                  className="px-2.5 py-1 rounded bg-[#f3f3f7] hover:bg-indigo-50 text-[11px] font-semibold text-[#111124] border border-[#ededf1]"
                >
                  MDR Pseudomonas
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetSearch('Severe CAP')}
                  className="px-2.5 py-1 rounded bg-[#f3f3f7] hover:bg-indigo-50 text-[11px] font-semibold text-[#111124] border border-[#ededf1]"
                >
                  Severe CAP Sepsis
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetSearch('Pyelonephritis')}
                  className="px-2.5 py-1 rounded bg-[#f3f3f7] hover:bg-indigo-50 text-[11px] font-semibold text-[#111124] border border-[#ededf1]"
                >
                  Complicated Pyelonephritis
                </button>
              </div>

              {/* 2-Column Split: Table List + Selected Detail Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left Table / List (7 cols) */}
                <div className="lg:col-span-7 border border-[#ededf1] rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f9f9fd] sticky top-0 border-b border-[#ededf1] text-[#5a5b82] font-semibold text-[11px]">
                      <tr>
                        <th className="p-2.5">Encounter / Patient</th>
                        <th className="p-2.5">Diagnosis & Pathogen</th>
                        <th className="p-2.5">Risk Tier</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ededf1]">
                      {serverRecords.map((row, idx) => {
                        const isSelected = (selected10kRow?.encounter_id === row.encounter_id) || (selected10kRow?.patient_id === row.patient_id);
                        const risk = row.amr_risk_category || 'Low';
                        return (
                          <tr
                            key={row.encounter_id || row.patient_id || idx}
                            onClick={() => setSelected10kRow(row)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50/70 font-medium' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="p-2.5">
                              <div className="font-bold text-[#111124]">{row.patient_name || `Patient ${idx + 1}`}</div>
                              <div className="text-[10px] text-[#5a5b82] font-mono">{row.encounter_id || row.patient_id} • {row.age_years || row.age}y {row.sex || row.gender}</div>
                            </td>
                            <td className="p-2.5">
                              <div className="text-[#111124] truncate max-w-[180px]">{row.primary_diagnosis}</div>
                              <div className="text-[10px] text-[#5a5b82] truncate max-w-[180px]">{row.suspected_pathogen}</div>
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                risk === 'High' ? 'bg-[#ffdad6] text-[#93000a]' : risk === 'Medium' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                              }`}>
                                {risk} ({row.amr_probability_percent || Math.round((row.amr_probability || 0.3) * 100)}%)
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelect10kRecord(row);
                                }}
                                className="px-2.5 py-1 rounded bg-[#111124] hover:bg-[#26263a] text-white text-[11px] font-bold transition-all disabled:opacity-50"
                              >
                                Assess
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {serverRecords.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-[#5a5b82]">
                            No matching records found in 10k dataset. Try adjusting your search keyword or filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Right Inspection & Direct Action Card (5 cols) */}
                <div className="lg:col-span-5 bg-[#f9f9fd] border border-[#ededf1] rounded-xl p-4 flex flex-col justify-between space-y-3">
                  {selected10kRow ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between pb-2 border-b border-[#ededf1]">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                              Encounter: {selected10kRow.encounter_id || 'ENC-2025'}
                            </span>
                            <h3 className="text-sm font-bold text-[#111124] mt-1">{selected10kRow.patient_name}</h3>
                            <p className="text-[11px] text-[#5a5b82]">{selected10kRow.ward} • {selected10kRow.bed}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                            selected10kRow.amr_risk_category === 'High' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {selected10kRow.amr_risk_category} Risk
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded border border-[#ededf1]">
                            <span className="text-[10px] text-[#5a5b82] block">Vitals (T / HR / BP)</span>
                            <span className="font-semibold text-[#111124]">
                              {selected10kRow.temperature_c}°C • {selected10kRow.heart_rate_bpm}bpm • {selected10kRow.systolic_bp_mmhg}/{selected10kRow.diastolic_bp_mmhg}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded border border-[#ededf1]">
                            <span className="text-[10px] text-[#5a5b82] block">SpO2 / CRP / RR</span>
                            <span className="font-semibold text-[#111124]">
                              {selected10kRow.spo2_percent}% • {selected10kRow.crp_mg_l}mg/L • {selected10kRow.respiratory_rate_bpm}bpm
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded border border-[#ededf1] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#5a5b82] font-medium">Prior 90d Abx:</span>
                            <span className="font-semibold text-[#111124]">{selected10kRow.prior_antibiotic_90d || 'None'} ({selected10kRow.prior_antibiotic_days || 0}d)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#5a5b82] font-medium">Prior Resistant Organism:</span>
                            <span className="font-semibold text-[#111124]">{selected10kRow.prior_resistant_organism || 'None known'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#5a5b82] font-medium">Ward Resistance Rate:</span>
                            <span className="font-semibold text-[#111124]">
                              {selected10kRow.ward_endemic_resistance_rate ? `${(parseFloat(selected10kRow.ward_endemic_resistance_rate) * 100).toFixed(1)}%` : '25.0%'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded border border-[#ededf1] text-xs">
                          <span className="text-[10px] text-[#5a5b82] font-medium block mb-0.5">Empiric Regimen / Option:</span>
                          <span className="font-bold text-indigo-900">{selected10kRow.ai_first_line_option || selected10kRow.current_empiric_regimen || 'Meropenem 1g IV'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-[#ededf1]">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleSelect10kRecord(selected10kRow)}
                          className="w-full py-2.5 px-4 rounded-lg bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Load & Run Instant AMR Assessment</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrefillFormFrom10k(selected10kRow)}
                          className="w-full py-2 px-3 rounded-lg bg-white hover:bg-[#ededf1] text-[#111124] border border-[#ededf1] text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Prefill Into Manual Multi-Role Form</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-[#5a5b82] text-xs">Select a patient from the list to preview</div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: FILE UPLOAD (CSV / EXCEL / JSON) */}
          {activeTab === 'file_upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#dcdcec] hover:border-indigo-500 rounded-2xl p-6 text-center bg-[#f9f9fd] transition-colors cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls, .json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#111124]">Click to upload or drag & drop clinical datasets</p>
                    <p className="text-[11px] text-[#5a5b82] mt-0.5">Supports CSV, Excel (.xlsx, .xls), and EHR JSON exports</p>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-indigo-100 font-semibold px-2.5 py-0.5 rounded-full">
                    Auto-maps 62 columns to ResistomeX 10k Schema
                  </span>
                </div>
              </div>

              {isParsingFile && (
                <div className="p-4 bg-indigo-50 rounded-xl text-center text-xs text-indigo-800 font-semibold flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Parsing spreadsheet columns and normalizing data...
                </div>
              )}

              {parsedRows.length > 0 && (
                <div className="space-y-3 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ededf1]">
                    <div>
                      <h4 className="text-xs font-bold text-[#111124] flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Parsed File: <span className="font-mono text-indigo-700">{uploadedFileName}</span></span>
                      </h4>
                      <p className="text-[11px] text-[#5a5b82]">
                        Detected {parsedRows.length} patient records across {detectedColumns.length} columns.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleImportSingleUploadedRow}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#ededf1] hover:bg-gray-100 text-xs font-semibold text-[#111124]"
                      >
                        Assess Selected Case
                      </button>
                      <button
                        type="button"
                        onClick={handleImportAllUploadedRows}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 rounded-lg bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <span>Import All {parsedRows.length} Records</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-[#ededf1] rounded-lg overflow-x-auto max-h-[260px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-white sticky top-0 border-b border-[#ededf1] text-[#5a5b82] font-semibold text-[11px]">
                        <tr>
                          <th className="p-2">Row #</th>
                          <th className="p-2">Patient / MRN</th>
                          <th className="p-2">Age / Sex</th>
                          <th className="p-2">Diagnosis</th>
                          <th className="p-2">Pathogen</th>
                          <th className="p-2">Ward / Bed</th>
                          <th className="p-2">Vitals (T / HR / SpO2)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ededf1]">
                        {parsedRows.slice(0, 15).map((row, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedUploadRowIndex(idx)}
                            className={`cursor-pointer transition-colors ${
                              selectedUploadRowIndex === idx ? 'bg-indigo-50 font-medium' : 'hover:bg-white'
                            }`}
                          >
                            <td className="p-2 font-mono text-[10px] text-[#5a5b82]">{idx + 1}</td>
                            <td className="p-2 font-semibold text-[#111124]">{row.patient_name || row.name || `Record ${idx + 1}`}</td>
                            <td className="p-2">{row.age_years || row.age}y / {row.sex || row.gender || 'M'}</td>
                            <td className="p-2 truncate max-w-[150px]">{row.primary_diagnosis || row.diagnosis || '--'}</td>
                            <td className="p-2 truncate max-w-[150px]">{row.suspected_pathogen || row.pathogen || '--'}</td>
                            <td className="p-2">{row.ward || 'Ward 22'} • {row.bed || 'Bed 01'}</td>
                            <td className="p-2">{row.temperature_c || row.temp || 38.0}°C • {row.heart_rate_bpm || row.hr || 80}bpm • {row.spo2_percent || row.spo2 || 98}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL MULTI-ROLE FORM (62 COLUMNS) */}
          {activeTab === 'manual_form' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="flex items-center gap-2 p-1 bg-[#f3f3f7] rounded-xl border border-[#ededf1]">
                <button
                  type="button"
                  onClick={() => setActiveRoleSection('doctor')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeRoleSection === 'doctor'
                      ? 'bg-white text-[#111124] shadow-xs'
                      : 'text-[#5a5b82] hover:text-[#111124]'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. Physician / Clinical Intake</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRoleSection('nurse')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeRoleSection === 'nurse'
                      ? 'bg-white text-[#111124] shadow-xs'
                      : 'text-[#5a5b82] hover:text-[#111124]'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-rose-600" />
                  <span>2. Nursing Bedside & Vitals</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRoleSection('lab')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeRoleSection === 'lab'
                      ? 'bg-white text-[#111124] shadow-xs'
                      : 'text-[#5a5b82] hover:text-[#111124]'
                  }`}
                >
                  <Microscope className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Microbiology & DST</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRoleSection('admin')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeRoleSection === 'admin'
                      ? 'bg-white text-[#111124] shadow-xs'
                      : 'text-[#5a5b82] hover:text-[#111124]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. Ward Stewardship</span>
                </button>
              </div>

              {/* Section 1: Physician / Clinical */}
              {activeRoleSection === 'doctor' && (
                <div className="space-y-3 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">patient_name *</label>
                      <input
                        type="text"
                        required
                        value={formData.patient_name}
                        onChange={e => setFormData({ ...formData, patient_name: e.target.value })}
                        placeholder="e.g. Eleanor Vance"
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">age_years & sex *</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          required
                          value={formData.age_years}
                          onChange={e => setFormData({ ...formData, age_years: e.target.value })}
                          className="w-1/2 px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <select
                          value={formData.sex}
                          onChange={e => setFormData({ ...formData, sex: e.target.value })}
                          className="w-1/2 px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">pregnancy_status</label>
                      <select
                        value={formData.pregnancy_status}
                        onChange={e => setFormData({ ...formData, pregnancy_status: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Not applicable">Not applicable</option>
                        <option value="Trimester 1">Trimester 1</option>
                        <option value="Trimester 2">Trimester 2</option>
                        <option value="Trimester 3">Trimester 3</option>
                        <option value="Postpartum">Postpartum</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">primary_diagnosis *</label>
                      <input
                        type="text"
                        required
                        value={formData.primary_diagnosis}
                        onChange={e => setFormData({ ...formData, primary_diagnosis: e.target.value })}
                        placeholder="e.g. Severe Hospital-Acquired Pneumonia"
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">suspected_pathogen</label>
                      <input
                        type="text"
                        value={formData.suspected_pathogen}
                        onChange={e => setFormData({ ...formData, suspected_pathogen: e.target.value })}
                        placeholder="e.g. Pseudomonas aeruginosa / Klebsiella pneumoniae"
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">prior_antibiotic_90d</label>
                      <input
                        type="text"
                        value={formData.prior_antibiotic_90d}
                        onChange={e => setFormData({ ...formData, prior_antibiotic_90d: e.target.value })}
                        placeholder="e.g. Piperacillin-Tazobactam"
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">prior_antibiotic_days</label>
                      <input
                        type="number"
                        value={formData.prior_antibiotic_days}
                        onChange={e => setFormData({ ...formData, prior_antibiotic_days: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">prior_resistant_organism</label>
                      <input
                        type="text"
                        value={formData.prior_resistant_organism}
                        onChange={e => setFormData({ ...formData, prior_resistant_organism: e.target.value })}
                        placeholder="e.g. ESBL E. coli / MRSA / None known"
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#111124] mb-1">clinical_note_for_llm</label>
                    <textarea
                      rows={2}
                      value={formData.clinical_note_for_llm}
                      onChange={e => setFormData({ ...formData, clinical_note_for_llm: e.target.value })}
                      placeholder="Doctor admission notes, fever curve notes, previous treatment failures..."
                      className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Section 2: Nurse Bedside & Vitals */}
              {activeRoleSection === 'nurse' && (
                <div className="space-y-3 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">temperature_c (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.temperature_c}
                        onChange={e => setFormData({ ...formData, temperature_c: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">heart_rate_bpm (bpm)</label>
                      <input
                        type="number"
                        value={formData.heart_rate_bpm}
                        onChange={e => setFormData({ ...formData, heart_rate_bpm: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">systolic_bp_mmhg</label>
                      <input
                        type="number"
                        value={formData.systolic_bp_mmhg}
                        onChange={e => setFormData({ ...formData, systolic_bp_mmhg: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">diastolic_bp_mmhg</label>
                      <input
                        type="number"
                        value={formData.diastolic_bp_mmhg}
                        onChange={e => setFormData({ ...formData, diastolic_bp_mmhg: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">spo2_percent (%)</label>
                      <input
                        type="number"
                        value={formData.spo2_percent}
                        onChange={e => setFormData({ ...formData, spo2_percent: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">respiratory_rate_bpm</label>
                      <input
                        type="number"
                        value={formData.respiratory_rate_bpm}
                        onChange={e => setFormData({ ...formData, respiratory_rate_bpm: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">crp_mg_l (mg/L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.crp_mg_l}
                        onChange={e => setFormData({ ...formData, crp_mg_l: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">drug_allergy</label>
                      <input
                        type="text"
                        value={formData.drug_allergy}
                        onChange={e => setFormData({ ...formData, drug_allergy: e.target.value })}
                        placeholder="e.g. Penicillin / Sulfa / None known"
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">allergy_severity</label>
                      <select
                        value={formData.allergy_severity}
                        onChange={e => setFormData({ ...formData, allergy_severity: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="None">None</option>
                        <option value="Mild rash / itching">Mild rash / itching</option>
                        <option value="Moderate hives / GI upset">Moderate hives / GI upset</option>
                        <option value="Severe Anaphylaxis / Bronchospasm">Severe Anaphylaxis / Bronchospasm</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Lab Microbiology & DST */}
              {activeRoleSection === 'lab' && (
                <div className="space-y-3 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">culture_status</label>
                      <select
                        value={formData.culture_status}
                        onChange={e => setFormData({ ...formData, culture_status: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Unavailable">Unavailable / Not Ordered</option>
                        <option value="Pending Lab">Pending Lab Incubation</option>
                        <option value="Preliminary Growth">Preliminary Growth</option>
                        <option value="Completed Final">Completed Final Culture</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">culture_pathogen</label>
                      <input
                        type="text"
                        value={formData.culture_pathogen}
                        onChange={e => setFormData({ ...formData, culture_pathogen: e.target.value })}
                        placeholder="e.g. Klebsiella pneumoniae ssp. pneumoniae"
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">kidney_function</label>
                      <select
                        value={formData.kidney_function}
                        onChange={e => setFormData({ ...formData, kidney_function: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Normal">Normal (eGFR &gt; 60)</option>
                        <option value="Mild impairment">Mild impairment (eGFR 45-59)</option>
                        <option value="Moderate impairment">Moderate impairment (eGFR 30-44)</option>
                        <option value="Severe impairment / AKI">Severe impairment / AKI (&lt;30)</option>
                        <option value="Dialysis">Dialysis / CRRT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">liver_function</label>
                      <select
                        value={formData.liver_function}
                        onChange={e => setFormData({ ...formData, liver_function: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Mild impairment">Mild impairment (Child-Pugh A)</option>
                        <option value="Moderate impairment">Moderate impairment (Child-Pugh B)</option>
                        <option value="Severe impairment">Severe impairment (Child-Pugh C)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Ward Stewardship & Admin */}
              {activeRoleSection === 'admin' && (
                <div className="space-y-3 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">ward</label>
                      <select
                        value={formData.ward}
                        onChange={e => setFormData({ ...formData, ward: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="ICU Ward 22">ICU Ward 22</option>
                        <option value="Surgical Ward">Surgical Ward</option>
                        <option value="General Medical Ward">General Medical Ward</option>
                        <option value="Emergency Department">Emergency Department</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">bed</label>
                      <input
                        type="text"
                        value={formData.bed}
                        onChange={e => setFormData({ ...formData, bed: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111124] mb-1">ward_endemic_resistance_rate</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.0"
                        max="1.0"
                        value={formData.ward_endemic_resistance_rate}
                        onChange={e => setFormData({ ...formData, ward_endemic_resistance_rate: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Submission Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#ededf1]">
                <div className="text-[11px] text-[#5a5b82]">
                  * All fields map 1-to-1 with XGBoost & TreeSHAP ML feature pipeline.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#111124] hover:bg-[#26263a] rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                        <span>Calculating AMR Risk...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Register & Run AMR Assessment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 4: EHR PASTE / FHIR */}
          {activeTab === 'ehr_paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111124] mb-1">
                  Paste EHR Discharge Summary, Clinical Notes, or FHIR JSON
                </label>
                <textarea
                  rows={8}
                  value={rawEhrText}
                  onChange={e => setRawEhrText(e.target.value)}
                  placeholder="e.g. 68yo female admitted to ICU Ward 22 with severe urosepsis. T 38.9 C, HR 118, BP 98/60, SpO2 93%, CRP 88 mg/L. History: Type 2 DM, CKD Stage 3. Received Ceftriaxone 10 days ago for UTI. Prior ESBL isolated..."
                  className="w-full p-3 font-mono text-xs bg-[#f9f9fd] border border-[#ededf1] rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-[#5a5b82]">
                  ResistomeX NLP parser will extract vitals, organ function, prior antibiotic exposure, and diagnosis into standard 10k columns.
                </p>
                <button
                  type="button"
                  onClick={handleParseEHRText}
                  disabled={isParsingEHR || !rawEhrText.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#111124] hover:bg-[#26263a] rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isParsingEHR ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      <span>Extracting Features...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                      <span>Parse & Ingest Into Assessment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
