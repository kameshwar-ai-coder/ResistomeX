import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PatientProvider } from './context/PatientContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { PatientsListPage } from './pages/PatientsListPage';
import { PatientClinicalInfoPage } from './pages/PatientClinicalInfoPage';
import { AMRRiskAssessmentPage } from './pages/AMRRiskAssessmentPage';
import { ExplainabilitySHAPPage } from './pages/ExplainabilitySHAPPage';
import { TreatmentSupportPage } from './pages/TreatmentSupportPage';
import { DoctorDecisionPage } from './pages/DoctorDecisionPage';
import { PatientMonitoringPage } from './pages/PatientMonitoringPage';
import { CultureSensitivityPage } from './pages/CultureSensitivityPage';
import { NurseDashboardPage } from './pages/NurseDashboardPage';
import { NursePatientDetailPage } from './pages/NursePatientDetailPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AntibioticUsagePage } from './pages/AntibioticUsagePage';
import { AIPerformancePage } from './pages/AIPerformancePage';
import { UserManagementPage } from './pages/UserManagementPage';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <Sidebar />
      <Navbar />
      <main className="pl-64 pt-16 min-h-screen p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PatientProvider>
        <Router>
          <AppLayout>
            <Routes>
              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
              <Route path="/doctor/patients" element={<PatientsListPage />} />
              <Route path="/doctor/patient/:id/clinical" element={<PatientClinicalInfoPage />} />
              <Route path="/doctor/patient/:id/amr-risk" element={<AMRRiskAssessmentPage />} />
              <Route path="/doctor/patient/:id/explainability" element={<ExplainabilitySHAPPage />} />
              <Route path="/doctor/patient/:id/treatment-support" element={<TreatmentSupportPage />} />
              <Route path="/doctor/patient/:id/decision" element={<DoctorDecisionPage />} />
              <Route path="/doctor/patient/:id/monitoring" element={<PatientMonitoringPage />} />
              <Route path="/doctor/patient/:id/culture" element={<CultureSensitivityPage />} />

              {/* Nurse Routes */}
              <Route path="/nurse/dashboard" element={<NurseDashboardPage />} />
              <Route path="/nurse/patient/:id" element={<NursePatientDetailPage />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/antibiotics" element={<AntibioticUsagePage />} />
              <Route path="/admin/ai-performance" element={<AIPerformancePage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </PatientProvider>
    </AuthProvider>
  );
}

export default App;
