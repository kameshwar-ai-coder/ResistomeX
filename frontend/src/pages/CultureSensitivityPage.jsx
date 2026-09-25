import React from 'react';
import { useParams } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { PatientHeader } from '../components/PatientHeader';

export const CultureSensitivityPage = () => {
  const { id } = useParams();
  const { getPatientById } = usePatients();
  const patient = getPatientById(id || 'P-72309');
  const cult = patient.cultureResult;

  return (
    <div className="flex flex-col w-full space-y-6">
      <PatientHeader />

      {/* Main Culture Screen */}
      <section className="bg-white rounded-xl shadow-xs p-6 border border-[#ededf1] space-y-6">
        <div className="border-b border-[#ededf1] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
              <span className="material-symbols-outlined text-[20px]">science</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111124]">Microbiology Culture & Antibiogram Sensitivity Panel</h2>
              <p className="text-xs text-[#5a5b82]">Comparing initial AI empiric prediction with lab verified microbiology results</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-[#e8e8ec] text-[#111124] text-xs font-bold rounded">
            Status: {cult.status}
          </span>
        </div>

        {/* AI Prediction Match Callout Banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-[24px]">task_alt</span>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">AI Empiric Model Validation Match</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                The initial AI prediction of High AMR Risk (ESBL Gram-negative bacilli) correctly identified resistance pattern!
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-white border border-emerald-300 rounded text-xs font-bold text-emerald-900 shadow-xs self-start sm:self-auto">
            {cult.aiPredictionMatch}
          </div>
        </div>

        {/* Specimen & Pathogen Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#f3f3f7] p-4 rounded-xl border border-[#ededf1] text-xs">
          <div>
            <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Specimen Source</span>
            <p className="font-bold text-[#111124] mt-0.5">{cult.specimen}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Identified Pathogen</span>
            <p className="font-bold text-indigo-700 mt-0.5">{cult.organism}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#5a5b82] uppercase">Lab Release Time</span>
            <p className="font-mono font-bold text-[#111124] mt-0.5">{cult.resultDate}</p>
          </div>
        </div>

        {/* Antibiogram Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#5a5b82] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            Antibiogram Susceptibility Matrix
          </h3>

          {cult.sensitivities && cult.sensitivities.length > 0 ? (
            <div className="border border-[#ededf1] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f3f3f7] border-b border-[#ededf1] text-[#5a5b82] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Antimicrobial Agent</th>
                    <th className="px-4 py-3">MIC Value</th>
                    <th className="px-4 py-3">Susceptibility Interpretation</th>
                    <th className="px-4 py-3">Empiric Alignment</th>
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
                        {s.result === 'Susceptible' ? 'Matches prescribed Meropenem' : 'Predicted resistance avoided'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 bg-[#f3f3f7] border border-[#ededf1] rounded-xl text-center space-y-1">
              <span className="material-symbols-outlined text-[24px] text-[#5a5b82]">hourglass_top</span>
              <p className="text-xs font-bold text-[#111124]">Culture Incubating in Microbiology Lab</p>
              <p className="text-[11px] text-[#5a5b82]">Final susceptibility panel estimated to release in 6 hours.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
