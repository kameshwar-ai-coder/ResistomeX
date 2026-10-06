import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Stethoscope,
  Activity,
  Microscope,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Sparkles
} from 'lucide-react';

export const RoleAssessmentEditorModal = ({ isOpen, onClose, patient }) => {
  const { updatePatientRoleData } = usePatients();
  const { role: currentAuthRole } = useAuth();

  const [activeRoleTab, setActiveRoleTab] = useState(
    currentAuthRole === 'nurse' ? 'nurse' : currentAuthRole === 'admin' ? 'admin' : 'doctor'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Local state initialized with current patient values
  const [doctorData, setDoctorData] = useState({
    primary_diagnosis: patient?.primaryDiagnosis || '',
    infection_source: patient?.infectionSource || 'Bloodstream / Sepsis',
    suspected_pathogen: patient?.suspectedPathogen || 'Gram-negative Bacilli',
    prior_antibiotic_90d: patient?.history?.priorAntibiotic90d || 'Ceftriaxone',
    prior_antibiotic_days: patient?.history?.priorAntibioticDays || 7,
    prior_resistant_organism: patient?.history?.priorResistantOrganism || 'None known',
    clinical_note_for_llm: patient?.outcomeNotes || ''
  });

  const [nurseData, setNurseData] = useState({
    temperature_c: patient?.vitals?.tempNum || parseFloat(patient?.vitals?.temp) || 38.5,
    heart_rate_bpm: patient?.vitals?.hrNum || parseInt(patient?.vitals?.hr) || 98,
    systolic_bp_mmhg: patient?.vitals?.bpSys || parseInt(patient?.vitals?.bp?.split('/')[0]) || 115,
    diastolic_bp_mmhg: patient?.vitals?.bpDia || parseInt(patient?.vitals?.bp?.split('/')[1]) || 72,
    spo2_percent: patient?.vitals?.spo2Num || parseInt(patient?.vitals?.spo2) || 95,
    respiratory_rate_bpm: patient?.vitals?.rrNum || 20,
    crp_mg_l: patient?.vitals?.crpNum || 45.0,
    bed: patient?.bed || 'Bed 01',
    ward: patient?.ward || 'ICU Ward 22'
  });

  const [labData, setLabData] = useState({
    culture_status: patient?.cultureResult?.status || 'Pending Lab',
    culture_pathogen: patient?.cultureResult?.organism || 'Gram-negative Bacilli',
    resistance_phenotype: patient?.cultureResult?.resistancePhenotype || 'Pending DST',
    culture_match_to_predicted_risk: patient?.cultureResult?.match || 'Pending'
  });

  const [adminData, setAdminData] = useState({
    ward: patient?.ward || 'ICU Ward 22',
    ward_endemic_resistance_rate: patient?.history?.wardEndemicResistanceRate || 0.28,
    admission_status: patient?.admissionStatus || 'Admitted'
  });

  if (!isOpen || !patient) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (activeRoleTab === 'doctor') {
        await updatePatientRoleData(patient.id, 'doctor', doctorData);
      } else if (activeRoleTab === 'nurse') {
        await updatePatientRoleData(patient.id, 'nurse', nurseData);
      } else if (activeRoleTab === 'lab') {
        await updatePatientRoleData(patient.id, 'lab', labData);
      } else if (activeRoleTab === 'admin') {
        await updatePatientRoleData(patient.id, 'admin', adminData);
      }

      setSuccessMsg(`Successfully updated AMR assessment data for ${activeRoleTab.toUpperCase()} role!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update patient role parameters.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#dcdcec] shadow-2xl max-w-2xl w-full p-6 my-8 animate-in fade-in zoom-in-95 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ededf1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111124] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111124]">Update AMR Assessment Parameters</h3>
              <p className="text-xs text-[#5a5b82]">
                Patient: <span className="font-semibold text-[#111124]">{patient.name} ({patient.mrn})</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f3f3f7] rounded-xl border border-[#ededf1]">
          <button
            type="button"
            onClick={() => setActiveRoleTab('doctor')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeRoleTab === 'doctor' ? 'bg-white text-[#111124] shadow-xs' : 'text-[#5a5b82] hover:text-[#111124]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
            <span>Physician</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoleTab('nurse')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeRoleTab === 'nurse' ? 'bg-white text-[#111124] shadow-xs' : 'text-[#5a5b82] hover:text-[#111124]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-rose-600" />
            <span>Nursing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoleTab('lab')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeRoleTab === 'lab' ? 'bg-white text-[#111124] shadow-xs' : 'text-[#5a5b82] hover:text-[#111124]'
            }`}
          >
            <Microscope className="w-3.5 h-3.5 text-emerald-600" />
            <span>Microbiology / Lab</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoleTab('admin')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeRoleTab === 'admin' ? 'bg-white text-[#111124] shadow-xs' : 'text-[#5a5b82] hover:text-[#111124]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Admin / Unit</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dynamic Form per Active Role */}
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* DOCTOR FIELDS */}
          {activeRoleTab === 'doctor' && (
            <div className="space-y-3 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">primary_diagnosis *</label>
                  <input
                    type="text"
                    required
                    value={doctorData.primary_diagnosis}
                    onChange={e => setDoctorData({ ...doctorData, primary_diagnosis: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">infection_source</label>
                  <input
                    type="text"
                    value={doctorData.infection_source}
                    onChange={e => setDoctorData({ ...doctorData, infection_source: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">suspected_pathogen</label>
                  <input
                    type="text"
                    value={doctorData.suspected_pathogen}
                    onChange={e => setDoctorData({ ...doctorData, suspected_pathogen: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">prior_resistant_organism</label>
                  <input
                    type="text"
                    value={doctorData.prior_resistant_organism}
                    onChange={e => setDoctorData({ ...doctorData, prior_resistant_organism: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">prior_antibiotic_90d</label>
                  <input
                    type="text"
                    value={doctorData.prior_antibiotic_90d}
                    onChange={e => setDoctorData({ ...doctorData, prior_antibiotic_90d: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">prior_antibiotic_days</label>
                  <input
                    type="number"
                    value={doctorData.prior_antibiotic_days}
                    onChange={e => setDoctorData({ ...doctorData, prior_antibiotic_days: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111124] mb-1">clinical_note_for_llm</label>
                <textarea
                  rows={2}
                  value={doctorData.clinical_note_for_llm}
                  onChange={e => setDoctorData({ ...doctorData, clinical_note_for_llm: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* NURSE FIELDS */}
          {activeRoleTab === 'nurse' && (
            <div className="space-y-3 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">temperature_c (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nurseData.temperature_c}
                    onChange={e => setNurseData({ ...nurseData, temperature_c: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">heart_rate_bpm (bpm)</label>
                  <input
                    type="number"
                    value={nurseData.heart_rate_bpm}
                    onChange={e => setNurseData({ ...nurseData, heart_rate_bpm: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">systolic_bp_mmhg</label>
                  <input
                    type="number"
                    value={nurseData.systolic_bp_mmhg}
                    onChange={e => setNurseData({ ...nurseData, systolic_bp_mmhg: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">diastolic_bp_mmhg</label>
                  <input
                    type="number"
                    value={nurseData.diastolic_bp_mmhg}
                    onChange={e => setNurseData({ ...nurseData, diastolic_bp_mmhg: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">spo2_percent (%)</label>
                  <input
                    type="number"
                    value={nurseData.spo2_percent}
                    onChange={e => setNurseData({ ...nurseData, spo2_percent: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">respiratory_rate_bpm</label>
                  <input
                    type="number"
                    value={nurseData.respiratory_rate_bpm}
                    onChange={e => setNurseData({ ...nurseData, respiratory_rate_bpm: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">crp_mg_l (mg/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nurseData.crp_mg_l}
                    onChange={e => setNurseData({ ...nurseData, crp_mg_l: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">bed location</label>
                  <input
                    type="text"
                    value={nurseData.bed}
                    onChange={e => setNurseData({ ...nurseData, bed: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">ward</label>
                  <input
                    type="text"
                    value={nurseData.ward}
                    onChange={e => setNurseData({ ...nurseData, ward: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LAB FIELDS */}
          {activeRoleTab === 'lab' && (
            <div className="space-y-3 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">culture_status</label>
                  <select
                    value={labData.culture_status}
                    onChange={e => setLabData({ ...labData, culture_status: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Unavailable">Unavailable</option>
                    <option value="Pending Lab">Pending Lab</option>
                    <option value="Preliminary Growth">Preliminary Growth</option>
                    <option value="Completed Final">Completed Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">culture_pathogen</label>
                  <input
                    type="text"
                    value={labData.culture_pathogen}
                    onChange={e => setLabData({ ...labData, culture_pathogen: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">resistance_phenotype</label>
                  <input
                    type="text"
                    value={labData.resistance_phenotype}
                    onChange={e => setLabData({ ...labData, resistance_phenotype: e.target.value })}
                    placeholder="e.g. ESBL Positive / CRE"
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">culture_match_to_predicted_risk</label>
                  <select
                    value={labData.culture_match_to_predicted_risk}
                    onChange={e => setLabData({ ...labData, culture_match_to_predicted_risk: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Concordant">Concordant (Matched AI Risk)</option>
                    <option value="Discordant">Discordant</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN FIELDS */}
          {activeRoleTab === 'admin' && (
            <div className="space-y-3 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">ward</label>
                  <input
                    type="text"
                    value={adminData.ward}
                    onChange={e => setAdminData({ ...adminData, ward: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">ward_endemic_resistance_rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={adminData.ward_endemic_resistance_rate}
                    onChange={e => setAdminData({ ...adminData, ward_endemic_resistance_rate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#111124] mb-1">admission_status</label>
                  <select
                    value={adminData.admission_status}
                    onChange={e => setAdminData({ ...adminData, admission_status: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#ededf1] rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Admitted">Admitted</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Recovered & Discharged">Recovered & Discharged</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ededf1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-[#111124] hover:bg-[#26263a] rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Updates...' : `Save ${activeRoleTab.toUpperCase()} Data`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
