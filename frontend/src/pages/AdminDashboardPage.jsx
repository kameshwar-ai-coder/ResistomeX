import React from 'react';
import { MOCK_ADMIN_SURVEILLANCE } from '../data/mockData';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export const AdminDashboardPage = () => {
  const data = MOCK_ADMIN_SURVEILLANCE;
  const pieColors = ['#ba1a1a', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#111124] text-[24px]">local_hospital</span>
            <h1 className="text-2xl font-bold text-[#111124] tracking-tight">Hospital AMR Surveillance Overview</h1>
          </div>
          <p className="text-xs text-[#5a5b82] mt-0.5">
            Facility-wide antimicrobial resistance prevalence, stewardship metrics, and unit risk breakdowns.
          </p>
        </div>

        <span className="px-3 py-1 bg-[#e8e8ec] text-[#111124] text-xs font-bold rounded-full self-start sm:self-auto">
          Director: Dr. Elena Rostova
        </span>
      </div>

      {/* 4 Admin Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#5a5b82] uppercase tracking-wider">Total Inpatients</p>
            <p className="text-2xl font-bold text-[#111124] mt-1">{data.totalInpatients}</p>
            <p className="text-xs text-[#5a5b82] mt-1">Across 4 hospital wings</p>
          </div>
          <div className="w-10 h-10 rounded bg-[#f3f3f7] text-[#111124] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">group</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#ba1a1a] uppercase tracking-wider">Hospital AMR Rate</p>
            <p className="text-2xl font-bold text-[#ba1a1a] mt-1">{data.hospitalAmrRate}</p>
            <p className="text-xs text-[#ba1a1a] mt-1">+1.4% vs last month</p>
          </div>
          <div className="w-10 h-10 rounded bg-[#ffdad6]/40 text-[#ba1a1a] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Stewardship Compliance</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{data.stewardshipCompliance}</p>
            <p className="text-xs text-emerald-700 mt-1">Target: &gt; 90% achieved</p>
          </div>
          <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ededf1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#5a5b82] uppercase tracking-wider">High Risk Inpatients</p>
            <p className="text-2xl font-bold text-[#111124] mt-1">{data.highRiskPatientsCount}</p>
            <p className="text-xs text-[#5a5b82] mt-1">8 ICU · 4 Surgical</p>
          </div>
          <div className="w-10 h-10 rounded bg-[#f3f3f7] text-[#111124] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">domain</span>
          </div>
        </div>
      </div>

      {/* Ward Breakdown Table */}
      <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#111124] border-b border-[#ededf1] pb-3">
          Ward-by-Ward Resistance Surveillance Breakdown
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f3f3f7] border-b border-[#ededf1] text-[#5a5b82] font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Ward Name</th>
                <th className="px-4 py-3">Total Inpatients</th>
                <th className="px-4 py-3">High AMR Risk Cases</th>
                <th className="px-4 py-3">Ward Endemic AMR Rate</th>
                <th className="px-4 py-3">Stewardship Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ededf1]">
              {data.wardBreakdown.map((w, idx) => (
                <tr key={idx} className="hover:bg-[#f3f3f7]/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-[#111124]">{w.ward}</td>
                  <td className="px-4 py-3 font-semibold">{w.total}</td>
                  <td className="px-4 py-3 text-[#ba1a1a] font-bold">{w.highRisk}</td>
                  <td className="px-4 py-3 font-mono font-bold text-[#111124]">{w.amrRate}</td>
                  <td className="px-4 py-3 text-emerald-800 font-bold">{w.compliance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trends & Pathogen Prevalence Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-3">
          <h3 className="text-xs font-bold text-[#5a5b82] uppercase tracking-wider">
            Monthly Resistance Pathogen Trend
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyResistanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="esbl" fill="#ba1a1a" name="ESBL (%)" />
                <Bar dataKey="mrsa" fill="#f59e0b" name="MRSA (%)" />
                <Bar dataKey="cre" fill="#8b5cf6" name="CRE (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-3">
          <h3 className="text-xs font-bold text-[#5a5b82] uppercase tracking-wider">
            Pathogen Prevalence Breakdown
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.pathogenPrevalence} dataKey="percentage" nameKey="pathogen" cx="50%" cy="50%" outerRadius={80} label>
                  {data.pathogenPrevalence.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
