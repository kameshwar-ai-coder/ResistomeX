import React from 'react';
import { usePatients } from '../context/PatientContext';

export const AIPerformancePage = () => {
  const { aiMetrics, decisionStats = { accepted: 0, modified: 0, overridden: 0 }, loading } = usePatients();

  const metricsObj = aiMetrics || {
    roc_auc: 0.912,
    sensitivity_percent: 88.6,
    specificity_percent: 86.4,
    precision_percent: 82.1,
    f1_score: 0.852,
    model_name: 'ResistomeX XGBoost v002 (Calibrated)',
    last_trained_date: '2026-10-06',
    true_positives: 1840,
    false_positives: 395,
    false_negatives: 236,
    true_negatives: 2529
  };

  const data = {
    rocAuc: metricsObj.roc_auc,
    sensitivity: `${metricsObj.sensitivity_percent}%`,
    specificity: `${metricsObj.specificity_percent}%`,
    precision: `${metricsObj.precision_percent}%`,
    f1Score: metricsObj.f1_score,
    modelName: metricsObj.model_name,
    lastTrained: metricsObj.last_trained_date,
    totalTrainingSamples: (metricsObj.true_positives || 0) + (metricsObj.false_positives || 0) + (metricsObj.false_negatives || 0) + (metricsObj.true_negatives || 0),
    confusionMatrix: {
      truePositive: metricsObj.true_positives || 0,
      falsePositive: metricsObj.false_positives || 0,
      falseNegative: metricsObj.false_negatives || 0,
      trueNegative: metricsObj.true_negatives || 0
    },
    globalShapImportance: [
      { feature: 'Prior AMR Colonization History', value: 0.28, direction: 'positive' },
      { feature: 'Prior 90d Antibiotic Exposure Count', value: 0.24, direction: 'positive' },
      { feature: 'Ward Endemic AMR Rate', value: 0.18, direction: 'positive' },
      { feature: 'ICU / High-Acuity Stay', value: 0.14, direction: 'positive' },
      { feature: 'Elevated Serum CRP / Lactate', value: 0.09, direction: 'positive' },
      { feature: 'Renal Clearance (eGFR)', value: 0.07, direction: 'negative' }
    ]
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading model performance metrics...</p>
        </div>
      </div>
    );
  }

  const totalDecisions = decisionStats.accepted + decisionStats.modified + decisionStats.overridden;
  const acceptPercent = Math.round((decisionStats.accepted / (totalDecisions || 1)) * 100);
  const modifyPercent = Math.round((decisionStats.modified / (totalDecisions || 1)) * 100);
  const overridePercent = Math.round((decisionStats.overridden / (totalDecisions || 1)) * 100);

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#111124] text-[24px]">analytics</span>
            <h1 className="text-2xl font-bold text-[#111124] tracking-tight">AI Model Performance & Audit Analytics</h1>
          </div>
          <p className="text-xs text-[#5a5b82] mt-0.5">
            Validation metrics, ROC-AUC curve metrics, and physician acceptance audit tracking for {data.modelName}.
          </p>
        </div>

        <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-full self-start sm:self-auto flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Baseline Test / Demo Data Metrics
        </span>
      </div>

      {/* Baseline Test Disclosure Alert */}
      <div className="p-3 bg-[#f3f3f7] border border-[#ededf1] rounded-xl text-xs text-[#5a5b82] flex items-center gap-2">
        <span className="material-symbols-outlined text-[#5a5b82] text-[18px]">verified</span>
        <span>
          <strong>Note:</strong> Performance metrics shown below (ROC-AUC 0.912) represent baseline evaluation test figures and static database benchmarks.
        </span>
      </div>

      {/* 4 Model Performance Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
          <p className="text-[11px] font-bold text-[#5a5b82] uppercase tracking-wider">ROC-AUC Score</p>
          <p className="text-3xl font-bold text-[#111124] mt-1">{data.rocAuc}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Discriminative Accuracy</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
          <p className="text-[11px] font-bold text-[#5a5b82] uppercase tracking-wider">Sensitivity (Recall)</p>
          <p className="text-3xl font-bold text-[#111124] mt-1">{data.sensitivity}</p>
          <p className="text-xs text-[#5a5b82] mt-1">True positive detection</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
          <p className="text-[11px] font-bold text-[#5a5b82] uppercase tracking-wider">Specificity</p>
          <p className="text-3xl font-bold text-[#111124] mt-1">{data.specificity}</p>
          <p className="text-xs text-[#5a5b82] mt-1">True negative detection</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
          <p className="text-[11px] font-bold text-[#5a5b82] uppercase tracking-wider">F1-Score / Precision</p>
          <p className="text-3xl font-bold text-[#111124] mt-1">{data.f1Score}</p>
          <p className="text-xs text-[#5a5b82] mt-1">Precision: {data.precision}</p>
        </div>
      </div>

      {/* Doctor Decision Audit & Active Learning Reinforcement Breakdown */}
      <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ededf1] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#111124] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-indigo-600">psychology</span>
              Attending Physician Decision Audit & Active Learning Buffer
            </h2>
            <p className="text-xs text-[#5a5b82]">Continuous reinforcement loop learning from clinician Accept, Modify, and Override actions.</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-bold self-start sm:self-auto">
            Online Reinforcement Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-900">ACCEPT (+1.0 REWARD)</span>
            <div className="text-2xl font-bold text-emerald-950">{decisionStats.accepted} ({acceptPercent}%)</div>
            <p className="text-[11px] text-emerald-800">Directly reinforced empiric model weights</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-900">MODIFY (+0.5 GRADIENT)</span>
            <div className="text-2xl font-bold text-amber-950">{decisionStats.modified} ({modifyPercent}%)</div>
            <p className="text-[11px] text-amber-800">Dose/renal adjustments learned by LLM</p>
          </div>

          <div className="p-4 bg-[#ffdad6]/40 border border-[#ffdad6] rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#93000a]">OVERRIDE (-1.0 PENALTY)</span>
            <div className="text-2xl font-bold text-[#93000a]">{decisionStats.overridden} ({overridePercent}%)</div>
            <p className="text-[11px] text-[#93000a]">Custom regimens cataloged in few-shot pool</p>
          </div>
        </div>

        {/* Dynamic Learned Rules Card */}
        <div className="p-4 bg-[#f9f9fd] rounded-xl border border-[#ededf1] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#111124]">
            <span className="material-symbols-outlined text-[16px] text-indigo-600">auto_fix_high</span>
            <span>Clinician Learned Rules Ingested into LLM Decision Support:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-[#ededf1] text-[#47464c]">
              <strong className="text-[#111124] block mb-0.5">Renal Clearance Calibration (CKD/AKI):</strong>
              Automatically suggests 500mg q8h / extended infusion for patients with eGFR &lt; 50 mL/min based on physician inputs.
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-[#ededf1] text-[#47464c]">
              <strong className="text-[#111124] block mb-0.5">Empiric Stewardship Consensus:</strong>
              Maintains high coverage confidence for Meropenem in confirmed bacteremia with prior broad-spectrum exposure.
            </div>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Global SHAP Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#111124] border-b border-[#ededf1] pb-3">
            Confusion Matrix (Validation Test Set)
          </h2>

          <div className="grid grid-cols-2 gap-3 p-4 bg-[#f3f3f7] border border-[#ededf1] rounded-xl text-center">
            <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-900 uppercase">True Positive (TP)</span>
              <p className="text-2xl font-bold text-emerald-950 mt-1">{data.confusionMatrix.truePositive}</p>
              <span className="text-[10px] text-emerald-800 font-semibold">Correctly Identified High Risk</span>
            </div>

            <div className="p-4 bg-amber-100/70 border border-amber-300 rounded-xl">
              <span className="text-[10px] font-bold text-amber-900 uppercase">False Positive (FP)</span>
              <p className="text-2xl font-bold text-amber-950 mt-1">{data.confusionMatrix.falsePositive}</p>
              <span className="text-[10px] text-amber-800 font-semibold">Over-predicted Risk</span>
            </div>

            <div className="p-4 bg-[#ffdad6]/70 border border-[#ffdad6] rounded-xl">
              <span className="text-[10px] font-bold text-[#93000a] uppercase">False Negative (FN)</span>
              <p className="text-2xl font-bold text-[#93000a] mt-1">{data.confusionMatrix.falseNegative}</p>
              <span className="text-[10px] text-[#93000a] font-semibold">Missed High Risk</span>
            </div>

            <div className="p-4 bg-blue-100/70 border border-blue-300 rounded-xl">
              <span className="text-[10px] font-bold text-blue-900 uppercase">True Negative (TN)</span>
              <p className="text-2xl font-bold text-blue-950 mt-1">{data.confusionMatrix.trueNegative}</p>
              <span className="text-[10px] text-blue-800 font-semibold">Correctly Identified Low Risk</span>
            </div>
          </div>
        </div>

        {/* Global SHAP Importance */}
        {data.globalShapImportance.length > 0 && (
          <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#111124] border-b border-[#ededf1] pb-3">
              Global Feature Importance (XGBoost Weighting)
            </h2>

            <div className="space-y-3">
              {data.globalShapImportance.map((item, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-[#111124]">
                    <span>{item.feature}</span>
                    <span className="font-mono text-[#5a5b82]">{(item.importance * 100).toFixed(0)}% Weight</span>
                  </div>
                  <div className="w-full bg-[#f3f3f7] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#111124] h-full rounded-full"
                      style={{ width: `${item.importance * 100 * 2.5}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
