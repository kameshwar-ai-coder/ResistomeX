import React, { useState, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export const AIPerformancePage = () => {
  const [data, setData] = useState({
    rocAuc: 0,
    sensitivity: "0.0%",
    specificity: "0.0%",
    precision: "0.0%",
    f1Score: "0.000",
    modelName: "ResistomeX Baseline Benchmark",
    lastTrained: "-",
    totalTrainingSamples: 0,
    confusionMatrix: {
      truePositive: 0,
      falsePositive: 0,
      falseNegative: 0,
      trueNegative: 0
    },
    globalShapImportance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { decisionStats } = usePatients();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Database is unconfigured. Set VITE_SUPABASE_URL in frontend/.env.local.');
      setLoading(false);
      return;
    }

    async function fetchAIMetrics() {
      setLoading(true);
      setError(null);
      try {
        const { data: dbMetrics, error: dbErr } = await supabase.from('ai_model_metrics').select('*').limit(1).single();
        if (dbErr) throw dbErr;

        if (dbMetrics) {
          setData({
            rocAuc: dbMetrics.roc_auc,
            sensitivity: `${dbMetrics.sensitivity_percent}%`,
            specificity: `${dbMetrics.specificity_percent}%`,
            precision: `${dbMetrics.precision_percent}%`,
            f1Score: dbMetrics.f1_score,
            modelName: dbMetrics.model_name,
            lastTrained: dbMetrics.last_trained_date,
            totalTrainingSamples: dbMetrics.true_positives + dbMetrics.false_positives + dbMetrics.false_negatives + dbMetrics.true_negatives,
            confusionMatrix: {
              truePositive: dbMetrics.true_positives,
              falsePositive: dbMetrics.false_positives,
              falseNegative: dbMetrics.false_negatives,
              trueNegative: dbMetrics.true_negatives
            },
            globalShapImportance: []
          });
        }
      } catch (err) {
        console.error('AI performance metrics fetch error:', err.message);
        setError('Unable to load AI model metrics from database.');
      } finally {
        setLoading(false);
      }
    }

    fetchAIMetrics();
  }, []);

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

  if (error) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <div className="p-8 text-center bg-red-50 text-red-900 rounded-xl border border-red-200 space-y-2">
          <span className="material-symbols-outlined text-3xl text-red-600">error</span>
          <p className="text-sm font-bold">Unable to load AI performance data.</p>
          <p className="text-xs text-red-700">{error}</p>
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

      {/* Doctor Decision Audit Review Breakdown */}
      <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#111124] border-b border-[#ededf1] pb-3">
          Attending Physician Decision Audit Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-900">ACCEPT AI RECOMMENDATIONS</span>
            <div className="text-2xl font-bold text-emerald-950">{decisionStats.accepted} ({acceptPercent}%)</div>
            <p className="text-[11px] text-emerald-800">Empiric guidance adopted directly</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-900">MODIFY REGIMEN</span>
            <div className="text-2xl font-bold text-amber-950">{decisionStats.modified} ({modifyPercent}%)</div>
            <p className="text-[11px] text-amber-800">Dose/frequency adjusted by attending</p>
          </div>

          <div className="p-4 bg-[#ffdad6]/40 border border-[#ffdad6] rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#93000a]">OVERRIDE REGIMEN</span>
            <div className="text-2xl font-bold text-[#93000a]">{decisionStats.overridden} ({overridePercent}%)</div>
            <p className="text-[11px] text-[#93000a]">Custom regimen with logged rationale</p>
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
