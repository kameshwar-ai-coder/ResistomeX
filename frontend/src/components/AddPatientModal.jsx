import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { X, UserPlus, AlertCircle } from 'lucide-react';

export const AddPatientModal = ({ isOpen, onClose }) => {
  const { addNewPatient } = usePatients();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    ward: 'ICU Ward 22',
    bed: 'ICU Bed 05',
    primaryDiagnosis: '',
    infectionSource: 'Bloodstream / Sepsis',
    suspectedPathogen: 'ESBL-producing Gram-negative Bacilli',
    priorAntibiotics: '',
    comorbidities: '',
    allergies: '',
    temp: '38.5 °C',
    hr: '104 bpm',
    bp: '110/70 mmHg',
    spo2: '95%'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = formData.name.trim();
    const ageNum = parseInt(formData.age, 10);
    const trimmedDiagnosis = formData.primaryDiagnosis.trim();

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
      const newPatient = await addNewPatient({
        ...formData,
        name: trimmedName,
        age: ageNum,
        primaryDiagnosis: trimmedDiagnosis
      });

      onClose();
      if (newPatient && newPatient.id) {
        navigate(`/doctor/patient/${newPatient.id}/amr-risk`);
      }
    } catch (err) {
      console.error('[AddPatientModal] Failed to register patient:', err.message);
      setErrorMsg(err.message || 'Failed to register patient in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#dcdcec] shadow-2xl max-w-xl w-full p-6 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-[#dcdcec]">
          <div className="flex items-center gap-2 text-[#26263A]">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold">Register New Clinical Patient</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Age & Gender *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Age"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital Ward</label>
              <select
                value={formData.ward}
                onChange={e => setFormData({ ...formData, ward: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ICU Ward 22">ICU Ward 22</option>
                <option value="Surgical Ward">Surgical Ward</option>
                <option value="General Medical Ward">General Medical Ward</option>
                <option value="Emergency Department">Emergency Department</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bed Location</label>
              <input
                type="text"
                value={formData.bed}
                onChange={e => setFormData({ ...formData, bed: e.target.value })}
                placeholder="e.g. Bed 05"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Clinical Diagnosis *</label>
            <input
              type="text"
              required
              value={formData.primaryDiagnosis}
              onChange={e => setFormData({ ...formData, primaryDiagnosis: e.target.value })}
              placeholder="e.g. Severe Sepsis secondary to Pyelonephritis"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Infection Source</label>
              <input
                type="text"
                value={formData.infectionSource}
                onChange={e => setFormData({ ...formData, infectionSource: e.target.value })}
                placeholder="e.g. Urine, Blood, Lungs, Wound"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Prior Antibiotics (Past 90 Days)</label>
              <input
                type="text"
                value={formData.priorAntibiotics}
                onChange={e => setFormData({ ...formData, priorAntibiotics: e.target.value })}
                placeholder="e.g. Ceftriaxone 1g IV for 7 days"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Known Allergies</label>
            <input
              type="text"
              value={formData.allergies}
              onChange={e => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="e.g. Penicillin - Anaphylaxis"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-800">
              Upon submitting, patient parameters will be saved to Supabase database and evaluated against clinical risk heuristics.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#dcdcec]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#26263A] hover:bg-[#1b1b2a] rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Registering...</span>
                </>
              ) : (
                'Register Inpatient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
