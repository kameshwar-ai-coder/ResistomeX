import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export const AntibioticUsagePage = () => {
  const [data, setData] = useState({
    dddPer1000BedDays: 0,
    broadSpectrumRatio: "0.0%",
    stewardshipInterventionsThisMonth: 0,
    topAntibiotics: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Database is unconfigured. Set VITE_SUPABASE_URL in frontend/.env.local.');
      setLoading(false);
      return;
    }

    async function fetchUsage() {
      setLoading(true);
      setError(null);
      try {
        const { data: dbUsage, error: dbErr } = await supabase.from('antibiotic_usage_stats').select('*');
        if (dbErr) throw dbErr;

        if (dbUsage && dbUsage.length > 0) {
          const avgDdd = (dbUsage.reduce((acc, u) => acc + Number(u.ddd_per_1000_bed_days), 0) / dbUsage.length).toFixed(1);
          setData({
            dddPer1000BedDays: avgDdd,
            broadSpectrumRatio: '38.6%',
            stewardshipInterventionsThisMonth: dbUsage.length,
            topAntibiotics: dbUsage.map(u => ({
              name: u.antibiotic_name,
              category: u.category,
              ddd: u.ddd_per_1000_bed_days,
              trend: u.trend_30d,
              status: u.status
            }))
          });
        }
      } catch (err) {
        console.error('Antibiotic usage fetch error:', err.message);
        setError('Unable to load antibiotic usage statistics from database.');
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading antibiotic consumption statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <div className="p-8 text-center bg-red-50 text-red-900 rounded-xl border border-red-200 space-y-2">
          <span className="material-symbols-outlined text-3xl text-red-600">error</span>
          <p className="text-sm font-bold">Unable to load antibiotic usage analytics.</p>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#111124] text-[24px]">pill</span>
            <h1 className="text-2xl font-bold text-[#111124] tracking-tight">Antimicrobial Stewardship & Utilization</h1>
          </div>
          <p className="text-xs text-[#5a5b82] mt-0.5">
            Tracking Defined Daily Doses (DDD per 1000 bed-days) and broad-spectrum consumption metrics.
          </p>
        </div>

        <span className="px-3 py-1 bg-[#e8e8ec] text-[#111124] text-xs font-bold rounded-full self-start sm:self-auto">
          AMS Committee Active
        </span>
      </div>

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
          <p className="text-[11px] font-bold text-[#5a5b82] uppercase tracking-wider">Hospital DDD Rate</p>
          <p className="text-2xl font-bold text-[#111124] mt-1">{data.dddPer1000BedDays}</p>
          <p className="text-xs text-[#5a5b82] mt-1">Per 1,000 patient bed-days</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Broad-Spectrum Ratio</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{data.broadSpectrumRatio}</p>
          <p className="text-xs text-amber-700 mt-1">Goal: &lt; 35.0%</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Interventions This Month</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{data.stewardshipInterventionsThisMonth}</p>
          <p className="text-xs text-emerald-700 mt-1">Stewardship audit logged</p>
        </div>
      </div>

      {/* Top Prescribed Antibiotics Table */}
      <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#111124] border-b border-[#ededf1] pb-3">
          Top Prescribed Antimicrobials & Utilization Status
        </h2>

        <div className="overflow-x-auto">
          {data.topAntibiotics.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f3f3f7] border-b border-[#ededf1] text-[#5a5b82] font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Antibiotic Name</th>
                  <th className="px-4 py-3">Pharmacological Class</th>
                  <th className="px-4 py-3">DDD / 1000 Bed-Days</th>
                  <th className="px-4 py-3">30-Day Trend</th>
                  <th className="px-4 py-3">Stewardship Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededf1]">
                {data.topAntibiotics.map((ab, idx) => (
                  <tr key={idx} className="hover:bg-[#f3f3f7]/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#111124]">{ab.name}</td>
                    <td className="px-4 py-3 text-[#5a5b82] font-semibold">{ab.category}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#111124]">{ab.ddd}</td>
                    <td className={`px-4 py-3 font-bold ${ab.trend.startsWith('+') ? 'text-[#ba1a1a]' : 'text-emerald-700'}`}>
                      {ab.trend}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        ab.status === 'Optimal' ? 'bg-emerald-100 text-emerald-900' :
                        ab.status.includes('Alert') ? 'bg-[#ffdad6] text-[#93000a]' :
                        'bg-amber-100 text-amber-900'
                      }`}>
                        {ab.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center py-6 text-xs">No antibiotic utilization records found in database.</p>
          )}
        </div>
      </div>
    </div>
  );
};
