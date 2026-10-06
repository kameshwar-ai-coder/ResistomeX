import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import {
  FlaskConical,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Brain,
  ShieldAlert,
  HelpCircle,
  FileCheck2,
  Activity
} from 'lucide-react';

const PRESET_PANELS = {
  esbl: {
    name: 'ESBL Klebsiella pneumoniae',
    organism: 'Klebsiella pneumoniae',
    phenotype: 'ESBL Producer (blaCTX-M confirmed)',
    gramStain: 'Gram-negative bacilli',
    sensitivities: [
      { antibiotic: 'Meropenem', mic: '<= 0.25 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Ertapenem', mic: '<= 0.5 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Amikacin', mic: '4 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Ceftriaxone', mic: '>= 64 µg/mL', result: 'Resistant' },
      { antibiotic: 'Cefepime', mic: '32 µg/mL', result: 'Resistant' },
      { antibiotic: 'Ciprofloxacin', mic: '>= 4 µg/mL', result: 'Resistant' },
      { antibiotic: 'Piperacillin-Tazobactam', mic: '16/4 µg/mL', result: 'Intermediate' }
    ]
  },
  mrsa: {
    name: 'MRSA (Staphylococcus aureus)',
    organism: 'Staphylococcus aureus',
    phenotype: 'MRSA (mecA positive)',
    gramStain: 'Gram-positive cocci in clusters',
    sensitivities: [
      { antibiotic: 'Vancomycin', mic: '1.0 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Linezolid', mic: '1.5 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Daptomycin', mic: '0.5 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Oxacillin', mic: '>= 8 µg/mL', result: 'Resistant' },
      { antibiotic: 'Cefazolin', mic: '>= 32 µg/mL', result: 'Resistant' },
      { antibiotic: 'Levofloxacin', mic: '4 µg/mL', result: 'Resistant' }
    ]
  },
  pseudomonas: {
    name: 'MDR Pseudomonas aeruginosa',
    organism: 'Pseudomonas aeruginosa',
    phenotype: 'MDR Pseudomonas (Efflux + Porin Loss)',
    gramStain: 'Gram-negative bacilli',
    sensitivities: [
      { antibiotic: 'Ceftazidime-Avibactam', mic: '2/4 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Colistin', mic: '1.0 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Meropenem', mic: '16 µg/mL', result: 'Resistant' },
      { antibiotic: 'Piperacillin-Tazobactam', mic: '64/4 µg/mL', result: 'Resistant' },
      { antibiotic: 'Cefepime', mic: '32 µg/mL', result: 'Resistant' },
      { antibiotic: 'Ciprofloxacin', mic: '>= 4 µg/mL', result: 'Resistant' }
    ]
  },
  pansusceptible: {
    name: 'Wild-Type Pan-Susceptible E. coli',
    organism: 'Escherichia coli',
    phenotype: 'Pan-Susceptible Wild-Type',
    gramStain: 'Gram-negative bacilli',
    sensitivities: [
      { antibiotic: 'Ceftriaxone', mic: '<= 0.5 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Ampicillin-Sulbactam', mic: '2/1 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Ciprofloxacin', mic: '<= 0.25 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Meropenem', mic: '<= 0.12 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Gentamicin', mic: '<= 1 µg/mL', result: 'Susceptible' }
    ]
  },
  cre: {
    name: 'Carbapenem-Resistant Enterobacterales (CRE)',
    organism: 'Klebsiella pneumoniae (KPC+)',
    phenotype: 'Carbapenem-Resistant (CRE / KPC)',
    gramStain: 'Gram-negative bacilli',
    sensitivities: [
      { antibiotic: 'Ceftazidime-Avibactam', mic: '2/4 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Colistin', mic: '0.5 µg/mL', result: 'Susceptible' },
      { antibiotic: 'Meropenem', mic: '>= 32 µg/mL', result: 'Resistant' },
      { antibiotic: 'Ertapenem', mic: '>= 16 µg/mL', result: 'Resistant' },
      { antibiotic: 'Piperacillin-Tazobactam', mic: '>= 128/4 µg/mL', result: 'Resistant' },
      { antibiotic: 'Cefepime', mic: '>= 64 µg/mL', result: 'Resistant' }
    ]
  }
};

export const AddCultureReportModal = ({ isOpen, onClose, patient }) => {
  const { addCultureResult } = usePatients();

  const [specimen, setSpecimen] = useState('Blood Culture (Aerobic + Anaerobic)');
  const [organism, setOrganism] = useState('Klebsiella pneumoniae');
  const [resistancePhenotype, setResistancePhenotype] = useState('ESBL Producer (blaCTX-M confirmed)');
  const [gramStain, setGramStain] = useState('Gram-negative bacilli');
  const [incubationHours, setIncubationHours] = useState(48);
  const [labTechnician, setLabTechnician] = useState('Dr. Elena Rostova, Lead Microbiologist');
  const [sensitivities, setSensitivities] = useState([
    { antibiotic: 'Meropenem', mic: '<= 0.25 µg/mL', result: 'Susceptible' },
    { antibiotic: 'Ertapenem', mic: '<= 0.5 µg/mL', result: 'Susceptible' },
    { antibiotic: 'Amikacin', mic: '4 µg/mL', result: 'Susceptible' },
    { antibiotic: 'Ceftriaxone', mic: '>= 64 µg/mL', result: 'Resistant' },
    { antibiotic: 'Cefepime', mic: '32 µg/mL', result: 'Resistant' },
    { antibiotic: 'Ciprofloxacin', mic: '>= 4 µg/mL', result: 'Resistant' },
    { antibiotic: 'Piperacillin-Tazobactam', mic: '16/4 µg/mL', result: 'Intermediate' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(null);

  if (!isOpen || !patient) return null;

  const loadPreset = (presetKey) => {
    const p = PRESET_PANELS[presetKey];
    if (!p) return;
    setOrganism(p.organism);
    setResistancePhenotype(p.phenotype);
    setGramStain(p.gramStain);
    setSensitivities([...p.sensitivities]);
  };

  const handleSensitivityChange = (index, field, value) => {
    setSensitivities(prev => prev.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
  };

  const addSensitivityRow = () => {
    setSensitivities(prev => [
      ...prev,
      { antibiotic: 'Ceftazidime', mic: '<= 1 µg/mL', result: 'Susceptible' }
    ]);
  };

  const removeSensitivityRow = (index) => {
    setSensitivities(prev => prev.filter((_, idx) => idx !== index));
  };

  // Preview Live Concordance
  const isResistant = resistancePhenotype.toLowerCase().includes('esbl') ||
    resistancePhenotype.toLowerCase().includes('mrsa') ||
    resistancePhenotype.toLowerCase().includes('cre') ||
    resistancePhenotype.toLowerCase().includes('mdr') ||
    sensitivities.filter(s => s.result === 'Resistant').length >= 2;

  const aiPredictedHigh = (patient.amrRiskScore || 0) >= 50 || (patient.amrRiskLevel || '').toLowerCase() === 'high';
  const isConcordant = (aiPredictedHigh && isResistant) || (!aiPredictedHigh && !isResistant);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const matchText = isConcordant
      ? (isResistant ? 'Concordant True Positive (ESBL/MDRO Confirmed)' : 'Concordant True Negative (Pan-Susceptible Confirmed)')
      : (aiPredictedHigh ? 'False Positive (AI Over-predicted, Culture is Pan-Susceptible)' : 'False Negative (Culture Confirmed Resistant Organism)');

    const resultPayload = {
      reportId: `CULT-${Date.now().toString().slice(-6)}`,
      status: 'Verified & Released',
      specimen,
      organism,
      resistancePhenotype,
      gramStain,
      incubationHours,
      resultDate: new Date().toLocaleString(),
      aiPredictionMatch: matchText,
      concordanceStatus: isConcordant ? (isResistant ? 'CONCORDANT' : 'TRUE_NEGATIVE') : (aiPredictedHigh ? 'FALSE_POSITIVE' : 'FALSE_NEGATIVE'),
      prescribedRegimenEffective: sensitivities.some(s => s.result === 'Susceptible' && (s.antibiotic.toLowerCase().includes('meropenem') || s.antibiotic.toLowerCase().includes('carbapenem'))),
      prescribedRegimenCoverageStatus: isResistant ? 'Susceptible to Prescribed Meropenem (Optimal Empiric Alignment)' : 'Pan-Susceptible (De-escalation Recommended)',
      advisory: isResistant
        ? `Confirmed ${organism} (${resistancePhenotype}). Empiric coverage was effective. Complete course.`
        : `Culture yielded pan-susceptible ${organism}. De-escalate to narrow-spectrum targeted agent.`,
      labTechnician,
      sensitivities
    };

    const apiResponse = await addCultureResult(patient.id, resultPayload);
    setIsSubmitting(false);
    setValidationSuccess(apiResponse || {
      concordance_status: resultPayload.concordanceStatus,
      ai_prediction_concordance: matchText,
      clinical_action_advisory: resultPayload.advisory
    });

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ededf1] max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#111124] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Add Microbiology Culture & Sensitivity Report</h2>
              <p className="text-xs text-indigo-200">
                Patient: <strong className="text-white">{patient.name} ({patient.id})</strong> • Initial AI Risk: <strong className="text-rose-300">{patient.amrRiskLevel} ({patient.amrRiskScore}%)</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {validationSuccess && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <strong>Ground-Truth Validation Ingested & Active Learning Loop Closed!</strong>
              <p className="mt-0.5 font-medium">{validationSuccess.ai_prediction_concordance}</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">{validationSuccess.clinical_action_advisory}</p>
            </div>
          </div>
        )}

        {/* Modal Scroll Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#111124] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quick-Fill Microbiology Antibiogram Presets (One-Click Testing)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadPreset('esbl')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold transition-colors text-[11px]"
              >
                🔬 ESBL Klebsiella (High Risk Match)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('mrsa')}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 font-bold transition-colors text-[11px]"
              >
                🧫 MRSA (mecA+)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('pseudomonas')}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold transition-colors text-[11px]"
              >
                🦠 MDR Pseudomonas
              </button>
              <button
                type="button"
                onClick={() => loadPreset('pansusceptible')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold transition-colors text-[11px]"
              >
                🌿 Pan-Susceptible E. coli (De-escalation)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('cre')}
                className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold transition-colors text-[11px]"
              >
                ⚡ Carbapenem-Resistant (CRE)
              </button>
            </div>
          </div>

          {/* Primary Microbiology Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#f9f9fd] p-4 rounded-xl border border-[#ededf1]">
            <div>
              <label className="block text-[11px] font-bold text-[#111124] mb-1">Specimen Source *</label>
              <select
                value={specimen}
                onChange={e => setSpecimen(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="Blood Culture (Aerobic + Anaerobic)">Blood Culture (Aerobic + Anaerobic)</option>
                <option value="Clean Catch Midstream Urine">Clean Catch Midstream Urine</option>
                <option value="Endotracheal Tube Aspirate (ETA)">Endotracheal Tube Aspirate (ETA)</option>
                <option value="Bronchoalveolar Lavage (BAL)">Bronchoalveolar Lavage (BAL)</option>
                <option value="Deep Surgical Tissue Biopsy">Deep Surgical Tissue Biopsy</option>
                <option value="Peritoneal Fluid / Intra-abdominal">Peritoneal Fluid / Intra-abdominal</option>
                <option value="Cerebrospinal Fluid (CSF)">Cerebrospinal Fluid (CSF)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#111124] mb-1">Identified Pathogen Species *</label>
              <input
                type="text"
                required
                value={organism}
                onChange={e => setOrganism(e.target.value)}
                placeholder="e.g. Klebsiella pneumoniae"
                className="w-full px-2.5 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-bold text-indigo-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#111124] mb-1">Resistance Phenotype / Genotype *</label>
              <input
                type="text"
                required
                value={resistancePhenotype}
                onChange={e => setResistancePhenotype(e.target.value)}
                placeholder="e.g. ESBL Producer (blaCTX-M)"
                className="w-full px-2.5 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-bold text-[#ba1a1a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#111124] mb-1">Gram Stain Morphology</label>
              <select
                value={gramStain}
                onChange={e => setGramStain(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-medium focus:outline-none"
              >
                <option value="Gram-negative bacilli">Gram-negative bacilli</option>
                <option value="Gram-positive cocci in clusters">Gram-positive cocci in clusters</option>
                <option value="Gram-positive cocci in pairs/chains">Gram-positive cocci in pairs/chains</option>
                <option value="Gram-negative coccobacilli">Gram-negative coccobacilli</option>
                <option value="No organisms seen on smear">No organisms seen on smear</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#111124] mb-1">Incubation Time (Hours)</label>
              <input
                type="number"
                value={incubationHours}
                onChange={e => setIncubationHours(parseInt(e.target.value))}
                className="w-full px-2.5 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#111124] mb-1">Verifying Microbiologist</label>
              <input
                type="text"
                value={labTechnician}
                onChange={e => setLabTechnician(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-[#ededf1] rounded-lg text-xs font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Antibiogram Matrix Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#111124] uppercase tracking-wider flex items-center gap-1.5">
                <span>Antibiogram Susceptibility Matrix Panel ({sensitivities.length} Tested Drugs)</span>
              </h3>
              <button
                type="button"
                onClick={addSensitivityRow}
                className="px-2.5 py-1 rounded bg-[#111124] hover:bg-[#26263a] text-white text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Antimicrobial Row</span>
              </button>
            </div>

            <div className="border border-[#ededf1] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f3f3f7] border-b border-[#ededf1] text-[#5a5b82] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Antimicrobial Agent</th>
                    <th className="px-3 py-2.5">MIC Value</th>
                    <th className="px-3 py-2.5">Susceptibility Interpretation</th>
                    <th className="px-2 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededf1]">
                  {sensitivities.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.antibiotic}
                          onChange={e => handleSensitivityChange(idx, 'antibiotic', e.target.value)}
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-[#ededf1] focus:border-indigo-400 rounded font-bold text-[#111124] text-xs focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.mic}
                          onChange={e => handleSensitivityChange(idx, 'mic', e.target.value)}
                          className="w-full px-2 py-1 font-mono text-[#47464c] bg-transparent border border-transparent hover:border-[#ededf1] focus:border-indigo-400 rounded text-xs focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.result}
                          onChange={e => handleSensitivityChange(idx, 'result', e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-bold border focus:outline-none ${
                            row.result === 'Susceptible'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : row.result === 'Resistant'
                              ? 'bg-rose-50 text-rose-900 border-rose-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          <option value="Susceptible">Susceptible</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Resistant">Resistant</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeSensitivityRow(idx)}
                          className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Learning Closed-Loop Preview Card */}
          <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Closed-Loop Ground-Truth Machine Learning Validation Impact:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                <strong className="text-gray-900 block">Ground Truth Concordance:</strong>
                <span className={isConcordant ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {isConcordant ? '✅ True Concordance Match (Validated Ground Truth)' : '⚠️ Calibration Variance (Supervised loss logged)'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                <strong className="text-gray-900 block">Model Calibration Signal:</strong>
                <span className="text-indigo-800 font-medium">
                  {isConcordant ? 'Supervised accuracy reward (+1.0) logged to active learning retraining buffer.' : 'Brier score loss logged. Downweights false alarm sensitivity.'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ededf1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>{isSubmitting ? 'Verifying & Closing Learning Loop...' : 'Verify Report & Complete Learning Loop'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
