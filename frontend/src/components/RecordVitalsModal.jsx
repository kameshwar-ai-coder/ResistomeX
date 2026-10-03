import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { X, HeartPulse, Check } from 'lucide-react';

export const RecordVitalsModal = ({ isOpen, onClose, patient }) => {
  const { updateVitals } = usePatients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [vitals, setVitals] = useState({
    temp: patient?.vitals?.temp || '38.0 °C',
    hr: patient?.vitals?.hr || '90 bpm',
    bp: patient?.vitals?.bp || '120/80 mmHg',
    spo2: patient?.vitals?.spo2 || '96%',
    wbc: patient?.vitals?.wbc || '12.0 x10³/µL',
    crp: patient?.vitals?.crp || '45 mg/L'
  });

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setIsSubmitting(true);
      await updateVitals(patient.id, vitals);
      onClose();
    } catch (err) {
      console.error('[RecordVitalsModal] Failed to record vitals:', err.message);
      setErrorMsg(err.message || 'Failed to persist vitals to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#dcdcec] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#dcdcec]">
          <div className="flex items-center gap-2 text-[#26263A]">
            <HeartPulse className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold">Record Vitals - {patient.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Temperature</label>
              <input
                type="text"
                value={vitals.temp}
                onChange={e => setVitals({ ...vitals, temp: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Heart Rate</label>
              <input
                type="text"
                value={vitals.hr}
                onChange={e => setVitals({ ...vitals, hr: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Pressure</label>
              <input
                type="text"
                value={vitals.bp}
                onChange={e => setVitals({ ...vitals, bp: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SpO2 Oxygen</label>
              <input
                type="text"
                value={vitals.spo2}
                onChange={e => setVitals({ ...vitals, spo2: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">WBC Count</label>
              <input
                type="text"
                value={vitals.wbc}
                onChange={e => setVitals({ ...vitals, wbc: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">CRP (C-Reactive Protein)</label>
              <input
                type="text"
                value={vitals.crp}
                onChange={e => setVitals({ ...vitals, crp: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dcdcec]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Vitals Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
