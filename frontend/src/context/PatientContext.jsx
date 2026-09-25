import React, { createContext, useContext, useState } from 'react';
import { INITIAL_PATIENTS, MOCK_USERS, MOCK_ADMIN_SURVEILLANCE, MOCK_ANTIBIOTIC_USAGE, MOCK_AI_PERFORMANCE } from '../data/mockData';

const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('All');

  // Doctor Decision Stats Tracking for Admin AI Performance
  const [decisionStats, setDecisionStats] = useState({
    accepted: 28,
    modified: 6,
    overridden: 2
  });

  const getPatientById = (id) => {
    return patients.find(p => p.id === id || p.mrn === id) || patients[0];
  };

  const recordDoctorDecision = (patientId, optionName, rationale, decisionType = 'accept') => {
    // Update decision counts
    setDecisionStats(prev => ({
      ...prev,
      [decisionType]: prev[decisionType] + 1
    }));

    setPatients(prev => prev.map(p => {
      if (p.id === patientId || p.mrn === patientId) {
        return {
          ...p,
          status: 'Reviewed & Prescribed',
          decisionLog: {
            status: decisionType.toUpperCase(),
            chosenOption: optionName,
            rationale: rationale,
            decidedBy: 'Dr. Marcus Vance, MD',
            decidedAt: new Date().toLocaleString()
          }
        };
      }
      return p;
    }));
  };

  // Evaluate clinical status based on vitals threshold rules
  const evaluateVitalStatus = (vitals) => {
    const tempNum = parseFloat(vitals.temp) || 37.0;
    const spo2Num = parseFloat(vitals.spo2) || 98;
    const hrNum = parseFloat(vitals.hr) || 80;

    if (tempNum >= 38.8 || spo2Num < 93 || hrNum > 110) {
      return { status: 'Needs Attention', color: 'red', alert: 'Critical Vitals Alert' };
    }
    if (tempNum >= 37.8 || spo2Num < 96) {
      return { status: 'Needs Review', color: 'amber', alert: 'Guarded Vitals' };
    }
    return { status: 'Stable', color: 'emerald', alert: null };
  };

  const updateVitals = (patientId, newVitals) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId || p.mrn === patientId) {
        const mergedVitals = { ...p.vitals, ...newVitals, updatedAt: 'Just now' };
        const statusEval = evaluateVitalStatus(mergedVitals);

        const newTimelineEntry = {
          time: `Today ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          temp: parseFloat(mergedVitals.temp) || 37.2,
          hr: parseFloat(mergedVitals.hr) || 80,
          bp: mergedVitals.bp || '120/80',
          crp: parseFloat(mergedVitals.crp) || 35,
          status: statusEval.status
        };

        return {
          ...p,
          status: statusEval.status,
          vitals: mergedVitals,
          monitoringTimeline: [newTimelineEntry, ...p.monitoringTimeline]
        };
      }
      return p;
    }));
  };

  const addNewPatient = (patientData) => {
    const newId = `P-${Math.floor(10000 + Math.random() * 90000)}`;
    const newMrn = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const hasPriorAntibiotics = patientData.priorAntibiotics && patientData.priorAntibiotics.length > 0;
    const isICU = patientData.ward === 'ICU Ward 22';
    let riskScore = 25;
    if (hasPriorAntibiotics) riskScore += 35;
    if (isICU) riskScore += 25;

    let riskLevel = 'Low';
    if (riskScore >= 75) riskLevel = 'High';
    else if (riskScore >= 45) riskLevel = 'Medium';

    const newPatient = {
      id: newId,
      mrn: newMrn,
      name: patientData.name,
      age: parseInt(patientData.age),
      gender: patientData.gender,
      bed: patientData.bed || 'Ward Bed 01',
      ward: patientData.ward || 'General Medical Ward',
      admissionDate: new Date().toISOString().split('T')[0],
      primaryDiagnosis: patientData.primaryDiagnosis,
      infectionSource: patientData.infectionSource || 'Bloodstream / Sepsis',
      suspectedPathogen: patientData.suspectedPathogen || 'ESBL-producing Gram-negative Bacilli',
      attendingDoctor: 'Dr. Marcus Vance, MD',
      assignedNurse: 'RN Sarah Jenkins',
      amrRiskLevel: riskLevel,
      amrRiskScore: riskScore,
      status: 'Needs Review',
      vitals: {
        temp: patientData.temp || '38.5 °C',
        hr: patientData.hr || '104 bpm',
        bp: patientData.bp || '110/70 mmHg',
        spo2: patientData.spo2 || '95%',
        wbc: '14.2 x10³/µL',
        crp: '95 mg/L',
        lactate: '2.1 mmol/L',
        updatedAt: 'Just now'
      },
      history: {
        comorbidities: patientData.comorbidities ? patientData.comorbidities.split(',') : ['Hypertension'],
        priorAntibiotics90Days: hasPriorAntibiotics ? [{ name: patientData.priorAntibiotics, duration: '7 days', timing: 'Recent', reason: 'Prior Infection' }] : [],
        priorCultures12Months: [],
        allergies: patientData.allergies ? [{ allergen: patientData.allergies, reaction: 'Anaphylaxis', severity: 'High' }] : [],
        unitResistanceRate: '34.2% Ward Resistance Rate'
      },
      shapFeatures: [
        { feature: 'Prior 30d Broad-Spectrum Antibiotic Exposure', impact: hasPriorAntibiotics ? 0.32 : -0.15, description: 'Direct selective pressure factor' },
        { feature: 'Ward 22 Endemic AMR Rate', impact: isICU ? 0.22 : 0.05, description: 'Nosocomial exposure risk' },
        { feature: 'Age & Baseline Vulnerability', impact: 0.08, description: 'Physiological age factor' }
      ],
      treatmentSupport: {
        empiricOptions: [
          {
            id: 'opt-1',
            name: riskLevel === 'High' ? 'Meropenem monotherapy' : 'Ceftriaxone + Azithromycin',
            dose: riskLevel === 'High' ? '1g IV q8h' : '1g IV q24h',
            coverageScore: riskLevel === 'High' ? 96 : 94,
            rationale: `First-line empiric recommendation for ${riskLevel} AMR Risk profile.`,
            isFirstLine: true,
            warnings: ['Monitor renal function']
          },
          {
            id: 'opt-2',
            name: 'Ceftazidime / Avibactam',
            dose: '2.5g IV q8h',
            coverageScore: 91,
            rationale: 'Alternative reserve agent for MDR Gram-negative strains.',
            isFirstLine: false,
            warnings: ['Requires Stewardship signoff']
          }
        ]
      },
      decisionLog: { status: 'Pending Review', chosenOption: '', rationale: '', decidedBy: '', decidedAt: '' },
      cultureResult: {
        status: 'In Progress (Lab Processing)',
        specimen: 'Blood Culture x2',
        collectedDate: new Date().toLocaleString(),
        resultDate: 'Pending (Est. 12 hours)',
        organism: 'Gram-negative bacilli growing',
        aiPredictionMatch: 'Pending Verification',
        sensitivities: []
      },
      monitoringTimeline: [
        { time: 'Day 1 Intake', temp: parseFloat(patientData.temp || 38.5), hr: 104, bp: '110/70', crp: 95, status: 'Needs Review' }
      ]
    };

    setPatients(prev => [newPatient, ...prev]);
    return newPatient;
  };

  // User Management Handlers
  const toggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return u;
    }));
  };

  const addUser = (userData) => {
    const newUser = {
      id: `u-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department || 'Inpatient Ward',
      status: 'Active'
    };
    setUsers(prev => [...prev, newUser]);
  };

  return (
    <PatientContext.Provider value={{
      patients,
      users,
      getPatientById,
      recordDoctorDecision,
      updateVitals,
      addNewPatient,
      toggleUserStatus,
      addUser,
      decisionStats,
      searchQuery,
      setSearchQuery,
      selectedRiskFilter,
      setSelectedRiskFilter
    }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => useContext(PatientContext);
