import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({
  width = 256,
  isCollapsed = false,
  onToggleCollapse,
  onWidthChange
}) => {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isResizing, setIsResizing] = useState(false);

  // Doctor top-level sidebar items
  const doctorNav = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: 'dashboard' },
    { name: 'Bedside Patients', path: '/doctor/patients', icon: 'personal_injury' },
    { name: 'Microbiology & Cultures', path: '/doctor/patient/PX-100000/culture', icon: 'biotech' }
  ];

  // Nurse top-level sidebar items
  const nurseNav = [
    { name: 'Nurse Dashboard', path: '/nurse/dashboard', icon: 'medical_services' },
    { name: 'Patient Directory', path: '/doctor/patients', icon: 'personal_injury' },
    { name: 'Culture Lab Reports', path: '/doctor/patient/PX-100000/culture', icon: 'biotech' }
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

  // Drag-to-resize mouse handler
  const startResizing = (e) => {
    e.preventDefault();
    if (!onWidthChange) return;

    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent) => {
      const clientX = moveEvent.clientX;
      if (clientX < 110) {
        onWidthChange(64);
      } else {
        const clamped = Math.max(180, Math.min(440, clientX));
        onWidthChange(clamped);
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`fixed left-0 top-0 h-screen bg-[#f3f3f7] z-50 flex flex-col justify-between border-r border-[#ededf1] select-none ${
        isResizing ? '' : 'transition-[width] duration-150'
      }`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Brand Header: Fixed clean layout for collapsed view */}
        {isCollapsed ? (
          <div className="h-16 flex items-center justify-center border-b border-[#ededf1] bg-[#f9f9fd]">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded-xl bg-[#111124] text-white flex items-center justify-center shadow-xs hover:bg-indigo-600 transition-all group relative"
              title="Click to expand sidebar"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:hidden transition-all">biotech</span>
              <span className="material-symbols-outlined text-[20px] hidden group-hover:block text-amber-300 transition-all">keyboard_double_arrow_right</span>
            </button>
          </div>
        ) : (
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#ededf1] bg-[#f9f9fd]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#111124] flex items-center justify-center text-white shadow-xs shrink-0" title="ResistomeX Surveillance">
                <span className="material-symbols-outlined text-[20px]">biotech</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-bold text-[17px] text-[#111124] tracking-tight leading-none truncate">ResistomeX</span>
                <span className="text-[10px] text-[#5a5b82] uppercase tracking-widest mt-0.5 truncate">Surveillance</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-[#ededf1] text-[#5a5b82] hover:text-[#111124] transition-colors shrink-0"
              title="Collapse sidebar"
            >
              <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
            </button>
          </div>
        )}

        {/* Workspace Indicator */}
        {!isCollapsed ? (
          <div className="px-4 py-2 bg-[#e8e8ec]/50 border-b border-[#ededf1] flex items-center justify-between text-xs">
            <span className="text-[#5a5b82] font-medium text-[11px] truncate">Database Role</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#111124] text-white shrink-0">
              {currentRole}
            </span>
          </div>
        ) : (
          <div className="py-2 flex justify-center border-b border-[#ededf1]" title={`Role: ${currentRole}`}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase bg-[#111124] text-white">
              {currentRole.charAt(0)}
            </span>
          </div>
        )}

        {/* Navigation Section */}
        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-2'} py-3 space-y-1`}>
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
                title={item.name}
                className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2.5'} rounded-lg font-medium text-xs transition-colors ${
                  isActive
                    ? 'bg-[#111124] text-white shadow-xs'
                    : 'text-[#47464c] hover:bg-[#ededf1] hover:text-[#1a1c1f]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-[#ededf1] bg-[#f9f9fd]">
        <button
          onClick={handleSignOut}
          title="Sign Out / Logout"
          className={`w-full flex items-center justify-center ${isCollapsed ? 'p-2' : 'gap-1.5 py-1.5 px-3'} rounded-lg bg-white hover:bg-[#ededf1] border border-[#ededf1] text-[#ba1a1a] text-xs font-bold transition-colors`}
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          {!isCollapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>

      {/* Drag-to-Resize Right Edge Handle */}
      <div
        onMouseDown={startResizing}
        className={`absolute top-0 right-0 w-2 h-full cursor-col-resize z-50 transition-colors group flex items-center justify-center ${
          isResizing ? 'bg-indigo-600/40' : 'hover:bg-indigo-400/40 bg-transparent'
        }`}
        title="Drag edge to resize sidebar (64px - 440px)"
      >
        <div className="w-0.5 h-8 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500/80 transition-colors" />
      </div>
    </aside>
  );
};
