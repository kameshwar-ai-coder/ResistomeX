import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePatients } from '../context/PatientContext';

export const Navbar = () => {
  const { role, user } = useAuth();
  const { searchQuery, setSearchQuery } = usePatients();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    setShowProfileMenu(false);
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-[#ededf1] z-40 px-6 flex items-center justify-between gap-4">
      {/* Search Input */}
      <div className="flex-1 max-w-lg">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3 text-[#78767d] text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient or MRN..."
            className="w-full bg-[#f3f3f7] text-[#1a1c1f] placeholder:text-[#78767d] pl-10 pr-4 py-2 rounded text-xs border border-transparent focus:border-[#78767d] focus:bg-white focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            aria-label="Notifications"
            className="relative p-2 text-[#47464c] hover:text-[#1a1c1f] rounded-full hover:bg-[#f3f3f7] transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ba1a1a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ba1a1a]"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#ededf1] rounded shadow-xl p-3 z-50 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#ededf1] pb-2 mb-2">
                <span className="font-bold text-xs text-[#111124]">Clinical Alerts</span>
                <span className="text-[10px] bg-red-100 text-[#ba1a1a] px-2 py-0.5 rounded font-bold">High Priority</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-red-50 border border-red-100 rounded">
                  <span className="font-bold text-[#ba1a1a]">David Sterling (ICU Bed 12)</span>
                  <p className="text-[11px] text-gray-700 mt-0.5">High AMR Risk (88%). ESBL suspicion requires empiric review.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[#ededf1]"></div>

        {/* User Profile Info Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowRoleMenu(false); }}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#f3f3f7] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#26263a] text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {user.avatar}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-[#1a1c1f] leading-none flex items-center gap-1">
                {user.name}
                <span className="material-symbols-outlined text-[14px] text-[#78767d]">expand_more</span>
              </span>
              <span className="text-[11px] text-[#5a5b82] mt-0.5 leading-none">{user.title}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#ededf1] rounded-xl shadow-xl py-2 z-50 animate-in fade-in">
              <div className="px-4 py-2 border-b border-[#ededf1]">
                <p className="font-bold text-xs text-[#111124]">{user.name}</p>
                <p className="text-[11px] text-[#5a5b82] mt-0.5">{user.title}</p>
                <div className="mt-1.5 inline-block px-2 py-0.5 rounded bg-[#f3f3f7] text-[10px] font-bold text-[#111124] uppercase">
                  Role: {role}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { navigate('/doctor/patients'); setShowProfileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f3f3f7] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#5a5b82]">personal_injury</span>
                  <span>Inpatient Directory</span>
                </button>
                <button
                  onClick={() => { navigate('/login'); setShowProfileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f3f3f7] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#5a5b82]">lock</span>
                  <span>Switch Role / Re-authenticate</span>
                </button>
              </div>

              <div className="pt-1 border-t border-[#ededf1]">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[#ba1a1a] hover:bg-red-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">logout</span>
                  <span>Sign Out / Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
