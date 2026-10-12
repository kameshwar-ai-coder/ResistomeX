import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PatientProvider } from './context/PatientContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Route Code-Splitting: Lazy-loaded pages for minimal initial bundle
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const DoctorDashboardPage = lazy(() => import('./pages/DoctorDashboardPage').then(m => ({ default: m.DoctorDashboardPage })));
const PatientsListPage = lazy(() => import('./pages/PatientsListPage').then(m => ({ default: m.PatientsListPage })));
const PatientClinicalInfoPage = lazy(() => import('./pages/PatientClinicalInfoPage').then(m => ({ default: m.PatientClinicalInfoPage })));
const AMRRiskAssessmentPage = lazy(() => import('./pages/AMRRiskAssessmentPage').then(m => ({ default: m.AMRRiskAssessmentPage })));
const ExplainabilitySHAPPage = lazy(() => import('./pages/ExplainabilitySHAPPage').then(m => ({ default: m.ExplainabilitySHAPPage })));
const TreatmentSupportPage = lazy(() => import('./pages/TreatmentSupportPage').then(m => ({ default: m.TreatmentSupportPage })));
const DoctorDecisionPage = lazy(() => import('./pages/DoctorDecisionPage').then(m => ({ default: m.DoctorDecisionPage })));
const PatientMonitoringPage = lazy(() => import('./pages/PatientMonitoringPage').then(m => ({ default: m.PatientMonitoringPage })));
const CultureSensitivityPage = lazy(() => import('./pages/CultureSensitivityPage').then(m => ({ default: m.CultureSensitivityPage })));
const NurseDashboardPage = lazy(() => import('./pages/NurseDashboardPage').then(m => ({ default: m.NurseDashboardPage })));
const NursePatientDetailPage = lazy(() => import('./pages/NursePatientDetailPage').then(m => ({ default: m.NursePatientDetailPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AntibioticUsagePage = lazy(() => import('./pages/AntibioticUsagePage').then(m => ({ default: m.AntibioticUsagePage })));
const AIPerformancePage = lazy(() => import('./pages/AIPerformancePage').then(m => ({ default: m.AIPerformancePage })));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })));

const PageLoadingSpinner = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-xs font-semibold text-gray-500">Loading clinical workspace...</p>
  </div>
);

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
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('resistomex_sidebar_width');
    const parsed = saved ? parseInt(saved, 10) : 256;
    return isNaN(parsed) || parsed < 64 || parsed > 440 ? 256 : parsed;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  const effectiveWidth = isSidebarCollapsed ? 64 : sidebarWidth;

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const handleWidthChange = (newWidth) => {
    setSidebarWidth(newWidth);
    localStorage.setItem('resistomex_sidebar_width', newWidth.toString());
    if (newWidth <= 72) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <Sidebar
        width={effectiveWidth}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onWidthChange={handleWidthChange}
      />
      <Navbar
        sidebarWidth={effectiveWidth}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleCollapse}
      />
      <main
        style={{ paddingLeft: `${effectiveWidth}px` }}
        className="pt-16 min-h-screen p-6 max-w-7xl mx-auto transition-[padding] duration-150"
      >
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
            <Suspense fallback={<PageLoadingSpinner />}>
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
            </Suspense>
          </AppLayout>
        </Router>
      </PatientProvider>
    </AuthProvider>
  );
}

export default App;
