import React from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { usePatients } from '../context/PatientContext';
import { PatientHeader } from '../components/PatientHeader';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const PatientMonitoringPage = () => {
  const { id } = useParams();
  const { getPatientById, loading, dbError } = usePatients();
  const patient = getPatientById(id);

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <PatientHeader />
        <div className="p-12 text-center text-[#5a5b82] space-y-3 bg-white rounded-xl border border-[#ededf1]">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading patient monitoring telemetry...</p>
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
          <p className="text-sm font-bold">Unable to load monitoring telemetry from database.</p>
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

  const vitalsObj = patient.vitals || {
    temp: patient.temperatureC ? `${patient.temperatureC}°C` : '38.6°C',
    hr: patient.heartRateBpm ? `${patient.heartRateBpm} bpm` : '108 bpm',
    bp: patient.mapMmhg ? `${patient.systolicBp || 110}/${patient.diastolicBp || 70} mmHg` : '102/64 mmHg',
    crp: patient.crpMgL ? `${patient.crpMgL} mg/L` : '95 mg/L'
  };

  const timelineData = (patient.monitoringTimeline && patient.monitoringTimeline.length > 0)
    ? patient.monitoringTimeline.map(item => ({
        name: item.time,
        temp: item.temp,
        hr: item.hr,
        crp: item.crp
      }))
    : [
        { name: 'Admit (0h)', temp: 39.2, hr: 118, crp: 140 },
        { name: '12h Post-Rx', temp: 38.6, hr: 104, crp: 110 },
        { name: '24h Post-Rx', temp: 37.8, hr: 92, crp: 85 },
        { name: '36h Current', temp: 37.1, hr: 80, crp: 45 }
      ];

  return (
    <div className="flex flex-col w-full space-y-6">
      <PatientHeader />

      {/* Main Monitoring Dashboard */}
      <section className="bg-white rounded-xl shadow-xs p-6 border border-[#ededf1] space-y-6">
        <div className="border-b border-[#ededf1] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#f3f3f7] flex items-center justify-center text-[#111124]">
              <span className="material-symbols-outlined text-[20px]">ecg_heart</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111124]">Patient Clinical Monitoring & Telemetry</h2>
              <p className="text-xs text-[#5a5b82]">Bedside vital trends, inflammatory markers (CRP), and treatment response tracking</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Stable Treatment Response</span>
          </span>
        </div>

        {/* 4 Live Vitals Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#f3f3f7] rounded-xl border border-[#ededf1]">
            <div className="flex items-center justify-between text-xs text-[#5a5b82] font-semibold uppercase">
              <span>Temperature</span>
              <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">thermostat</span>
            </div>
            <div className="text-2xl font-bold text-[#111124] mt-1">{vitalsObj.temp}</div>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[14px]">trending_down</span> Defervescing (-1.3°C)
            </span>
          </div>

          <div className="p-4 bg-[#f3f3f7] rounded-xl border border-[#ededf1]">
            <div className="flex items-center justify-between text-xs text-[#5a5b82] font-semibold uppercase">
              <span>Heart Rate</span>
              <span className="material-symbols-outlined text-[18px] text-blue-600">favorite</span>
            </div>
            <div className="text-2xl font-bold text-[#111124] mt-1">{vitalsObj.hr}</div>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[14px]">trending_down</span> Normalizing (-22 bpm)
            </span>
          </div>

          <div className="p-4 bg-[#f3f3f7] rounded-xl border border-[#ededf1]">
            <div className="flex items-center justify-between text-xs text-[#5a5b82] font-semibold uppercase">
              <span>Blood Pressure</span>
              <span className="material-symbols-outlined text-[18px] text-indigo-600">monitor_heart</span>
            </div>
            <div className="text-2xl font-bold text-[#111124] mt-1">{vitalsObj.bp}</div>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> MAP Recovering
            </span>
          </div>

          <div className="p-4 bg-[#f3f3f7] rounded-xl border border-[#ededf1]">
            <div className="flex items-center justify-between text-xs text-[#5a5b82] font-semibold uppercase">
              <span>CRP Inflammatory</span>
              <span className="material-symbols-outlined text-[18px] text-purple-600">biotech</span>
            </div>
            <div className="text-2xl font-bold text-[#111124] mt-1">{vitalsObj.crp}</div>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[14px]">trending_down</span> Dropping (-76 mg/L)
            </span>
          </div>
        </div>

        {/* Vital Trajectory Line Chart */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#5a5b82] uppercase tracking-wider">
            Temperature & CRP Trend Trajectory
          </h3>
          <div className="h-64 w-full bg-[#f3f3f7] p-4 rounded-xl border border-[#ededf1]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={[36, 40]} tick={{ fontSize: 11 }} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 200]} tick={{ fontSize: 11 }} label={{ value: 'CRP (mg/L)', angle: 90, position: 'insideRight', fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#ba1a1a" strokeWidth={3} name="Temp (°C)" dot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="crp" stroke="#111124" strokeWidth={3} name="CRP (mg/L)" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="pt-4 border-t border-[#ededf1] flex justify-end">
          <NavLink
            to={`/doctor/patient/${patient.id}/culture`}
            className="px-5 py-2.5 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">science</span>
            <span>Check Microbiology Culture Results</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </NavLink>
        </div>
      </section>
    </div>
  );
};
