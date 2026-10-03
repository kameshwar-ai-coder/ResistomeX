import React from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { PatientHeader } from '../components/PatientHeader';

export const ExplainabilitySHAPPage = () => {
  const { id } = useParams();
  const { getPatientById, loading, dbError } = usePatients();
  const patient = getPatientById(id);

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <PatientHeader />
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading clinical feature impact attribution...</p>
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
          <p className="text-sm font-bold">Unable to load feature attribution from database.</p>
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

  const shapList = patient.shapFeatures || [];
  const maxImpact = shapList.length > 0 ? Math.max(...shapList.map(f => Math.abs(f.impact))) : 1.0;

  return (
    <div className="flex flex-col w-full space-y-6">
      <PatientHeader />

      {/* Main Container */}
      <section className="bg-white rounded-xl shadow-xs p-6 border border-[#ededf1] space-y-6">
        <div className="border-b border-[#ededf1] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
                <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111124]">Explainable AI — SHAP Feature Attribution</h2>
                <p className="text-xs text-[#5a5b82]">Understanding why the system predicted {patient.amrRiskLevel} AMR Risk ({patient.amrRiskScore}%)</p>
              </div>
            </div>
          </div>

          <span className="px-3 py-1 bg-[#e8e8ec] text-[#111124] text-xs font-bold rounded flex items-center gap-1.5 self-start sm:self-auto">
            <span className="material-symbols-outlined text-[16px]">bar_chart</span>
            <span>SHAP (SHapley Additive exPlanations)</span>
          </span>
        </div>

        {/* Narrative Clinical Summary */}
        <div className="p-4 bg-[#f3f3f7] border border-[#ededf1] rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-[#111124] font-bold text-xs">
            <span className="material-symbols-outlined text-[16px] text-indigo-600">info</span>
            <span>AI Narrative Explanation for Attending Physician:</span>
          </div>
          <p className="text-xs text-[#47464c] leading-relaxed">
            The predicted <strong>{patient.amrRiskLevel} AMR Risk score of {patient.amrRiskScore}%</strong> for {patient.name} is primarily driven by{' '}
            <span className="font-semibold text-[#111124] underline">{patient.shapFeatures[0]?.feature}</span> (+{patient.shapFeatures[0]?.impact}) and{' '}
            <span className="font-semibold text-[#111124] underline">{patient.shapFeatures[1]?.feature}</span> (+{patient.shapFeatures[1]?.impact}).
            These factors increase the likelihood of ESBL / MDRO colonization, requiring targeted empiric coverage.
          </p>
        </div>

        {/* SHAP Waterfall / Attribution Visual Chart */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[#5a5b82] uppercase tracking-wider">
            Feature Attribution Waterfall (Risk Increments vs Reductions)
          </h3>

          <div className="space-y-3">
            {patient.shapFeatures.map((feat, idx) => {
              const isPositive = feat.impact > 0;
              const barWidth = Math.min(100, Math.round((Math.abs(feat.impact) / (maxImpact || 0.4)) * 100));

              return (
                <div key={idx} className="p-3.5 bg-[#f3f3f7] border border-[#ededf1] rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111124]">{feat.feature}</span>
                    <span className={`font-mono font-bold text-xs ${isPositive ? 'text-[#ba1a1a]' : 'text-emerald-700'}`}>
                      {isPositive ? `+${feat.impact} (Risk Increase)` : `${feat.impact} (Risk Decrease)`}
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-[#ba1a1a]' : 'bg-emerald-600'}`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-[#5a5b82]">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Bar */}
        <div className="pt-4 border-t border-[#ededf1] flex justify-end">
          <NavLink
            to={`/doctor/patient/${patient.id}/treatment-support`}
            className="px-5 py-2.5 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">medication</span>
            <span>Proceed to Treatment Decision Support</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </NavLink>
        </div>
      </section>
    </div>
  );
};
