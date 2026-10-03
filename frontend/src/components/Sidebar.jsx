import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Doctor top-level sidebar items
  const doctorNav = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: 'dashboard' },
    { name: 'Patients', path: '/doctor/patients', icon: 'personal_injury' },
    { name: 'Patient History', path: '/doctor/patients?tab=history', icon: 'history_edu' }
  ];

  // Nurse top-level sidebar items
  const nurseNav = [
    { name: 'Nurse Dashboard', path: '/nurse/dashboard', icon: 'medical_services' },
    { name: 'Patient Directory', path: '/doctor/patients', icon: 'personal_injury' },
    { name: 'Patient History', path: '/doctor/patients?tab=history', icon: 'history_edu' }
  ];

  // Admin top-level sidebar items
  const adminNav = [
    { name: 'Hospital Overview', path: '/admin/dashboard', icon: 'local_hospital' },
    { name: 'Antibiotic Usage', path: '/admin/antibiotics', icon: 'pill' },
    { name: 'AI Performance', path: '/admin/ai-performance', icon: 'analytics' },
    { name: 'User Management', path: '/admin/users', icon: 'manage_accounts' }
  ];

  const currentRole = role || 'doctor';
  const navItems = currentRole === 'doctor' ? doctorNav : currentRole === 'nurse' ? nurseNav : adminNav;

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#f3f3f7] z-50 flex flex-col justify-between border-r border-[#ededf1]">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center gap-2 border-b border-[#ededf1] bg-[#f9f9fd]">
          <div className="w-8 h-8 rounded bg-[#111124] flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[20px]">biotech</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[17px] text-[#111124] tracking-tight leading-none">ResistomeX</span>
            <span className="text-[10px] text-[#5a5b82] uppercase tracking-widest mt-0.5">Surveillance</span>
          </div>
        </div>

        {/* Workspace Indicator */}
        <div className="px-4 py-2 bg-[#e8e8ec]/50 border-b border-[#ededf1] flex items-center justify-between text-xs">
          <span className="text-[#5a5b82] font-medium text-[11px]">Database Role</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#111124] text-white">
            {currentRole}
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const currentFull = location.pathname + location.search;
            const isExactHistory = item.path.includes('tab=history') && currentFull.includes('tab=history');
            const isExactPatients = !item.path.includes('tab=history') && location.pathname === item.path && !location.search.includes('tab=history');
            const isOtherActive = item.path !== '/doctor/patients' && location.pathname === item.path;

            const isActive = isExactHistory || isExactPatients || isOtherActive;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2.5 rounded font-medium text-xs transition-colors ${
                  isActive
                    ? 'bg-[#111124] text-white shadow-xs'
                    : 'text-[#47464c] hover:bg-[#ededf1] hover:text-[#1a1c1f]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#ededf1] bg-[#f9f9fd] space-y-2">
        <div className="flex items-center gap-2 text-[#47464c] text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px]">LIS Bi-Directional Live</span>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-white hover:bg-[#ededf1] border border-[#ededf1] text-[#ba1a1a] text-xs font-bold transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Sign Out / Logout</span>
        </button>
      </div>
    </aside>
  );
};
