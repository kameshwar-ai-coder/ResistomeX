import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PatientProvider } from './context/PatientContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
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

// Public Route Guard (Redirects authenticated users to their dashboard)
const PublicAuthRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-gray-500">Checking Session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const currentRole = role || 'doctor';
    if (currentRole === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (currentRole === 'nurse') return <Navigate to="/nurse/dashboard" replace />;
    if (currentRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Protected Role-Based Route Guard (Enforces DB role authorization)
const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#26263A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-[#26263A]">Verifying Clinical Credentials & RBAC Access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = role || 'doctor';
  if (!allowedRoles.includes(currentRole)) {
    // Redirect unauthorized user to their own role's home dashboard
    if (currentRole === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (currentRole === 'nurse') return <Navigate to="/nurse/dashboard" replace />;
    if (currentRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
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
              {/* Public Auth Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<PublicAuthRoute><LoginPage /></PublicAuthRoute>} />
              <Route path="/signup" element={<PublicAuthRoute><SignUpPage /></PublicAuthRoute>} />

              {/* Doctor Protected Routes (Doctor & Admin access) */}
              <Route path="/doctor/dashboard" element={<RoleProtectedRoute allowedRoles={['doctor', 'admin']}><DoctorDashboardPage /></RoleProtectedRoute>} />
              <Route path="/doctor/patients" element={<RoleProtectedRoute allowedRoles={['doctor', 'nurse', 'admin']}><PatientsListPage /></RoleProtectedRoute>} />
              <Route path="/doctor/patient/:id/clinical" element={<RoleProtectedRoute allowedRoles={['doctor', 'admin']}><PatientClinicalInfoPage /></RoleProtectedRoute>} />
              <Route path="/doctor/patient/:id/amr-risk" element={<RoleProtectedRoute allowedRoles={['doctor', 'admin']}><AMRRiskAssessmentPage /></RoleProtectedRoute>} />
              <Route path="/doctor/patient/:id/explainability" element={<RoleProtectedRoute allowedRoles={['doctor', 'admin']}><ExplainabilitySHAPPage /></RoleProtectedRoute>} />
              <Route path="/doctor/patient/:id/treatment-support" element={<RoleProtectedRoute allowedRoles={['doctor', 'admin']}><TreatmentSupportPage /></RoleProtectedRoute>} />
              <Route path="/doctor/patient/:id/decision" element={<RoleProtectedRoute allowedRoles={['doctor', 'admin']}><DoctorDecisionPage /></RoleProtectedRoute>} />
              <Route path="/doctor/patient/:id/monitoring" element={<RoleProtectedRoute allowedRoles={['doctor', 'nurse', 'admin']}><PatientMonitoringPage /></RoleProtectedRoute>} />
              <Route path="/doctor/patient/:id/culture" element={<RoleProtectedRoute allowedRoles={['doctor', 'admin']}><CultureSensitivityPage /></RoleProtectedRoute>} />

              {/* Nurse Protected Routes (Nurse & Admin & Doctor view access) */}
              <Route path="/nurse/dashboard" element={<RoleProtectedRoute allowedRoles={['nurse', 'admin', 'doctor']}><NurseDashboardPage /></RoleProtectedRoute>} />
              <Route path="/nurse/patient/:id" element={<RoleProtectedRoute allowedRoles={['nurse', 'admin', 'doctor']}><NursePatientDetailPage /></RoleProtectedRoute>} />

              {/* Admin Protected Routes (Strictly Admin only) */}
              <Route path="/admin/dashboard" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></RoleProtectedRoute>} />
              <Route path="/admin/antibiotics" element={<RoleProtectedRoute allowedRoles={['admin']}><AntibioticUsagePage /></RoleProtectedRoute>} />
              <Route path="/admin/ai-performance" element={<RoleProtectedRoute allowedRoles={['admin']}><AIPerformancePage /></RoleProtectedRoute>} />
              <Route path="/admin/users" element={<RoleProtectedRoute allowedRoles={['admin']}><UserManagementPage /></RoleProtectedRoute>} />

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </PatientProvider>
    </AuthProvider>
  );
}

export default App;
