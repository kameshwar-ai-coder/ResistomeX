import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Dna, 
  Lock, 
  Stethoscope, 
  HeartPulse, 
  ShieldAlert, 
  ArrowRight,
  Building2
} from 'lucide-react';

export const LoginPage = () => {
  const { directLogin } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('doctor');
  const [email, setEmail] = useState('doctor@resistomex.org');
  const [password, setPassword] = useState('DoctorSecret@123');
  const [facility, setFacility] = useState('Central Academic Medical Center');

  const rolePresets = {
    doctor: { email: 'doctor@resistomex.org', pass: 'DoctorSecret@123' },
    nurse: { email: 'nurse@resistomex.org', pass: 'NurseSecret@123' },
    admin: { email: 'admin@resistomex.org', pass: 'AdminSecret@123' }
  };

  const handleRoleSelect = (roleName) => {
    setSelectedRole(roleName);
    if (rolePresets[roleName]) {
      setEmail(rolePresets[roleName].email);
      setPassword(rolePresets[roleName].pass);
    }
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    const lower = val.toLowerCase();
    if (lower.includes('nurse')) setSelectedRole('nurse');
    else if (lower.includes('admin') || lower.includes('stewardship')) setSelectedRole('admin');
    else if (lower.includes('doctor') || lower.includes('dr')) setSelectedRole('doctor');
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();

    // Infer role from email or selected tab
    let targetRole = selectedRole;
    const lowerEmail = email.toLowerCase();
    if (lowerEmail.includes('nurse')) targetRole = 'nurse';
    else if (lowerEmail.includes('admin') || lowerEmail.includes('stewardship')) targetRole = 'admin';
    else if (lowerEmail.includes('doctor') || lowerEmail.includes('dr')) targetRole = 'doctor';

    const { role: authenticatedRole } = directLogin(targetRole, email, { facility, password });

    // Navigate to the respective dashboard
    if (authenticatedRole === 'doctor') navigate('/doctor/dashboard');
    else if (authenticatedRole === 'nurse') navigate('/nurse/dashboard');
    else navigate('/admin/dashboard');
  };

  const handleQuickLogin = (roleName) => {
    handleRoleSelect(roleName);
    const presetEmail = rolePresets[roleName]?.email || `${roleName}@resistomex.org`;
    const presetPass = rolePresets[roleName]?.pass || 'Password123!';
    
    const { role: authenticatedRole } = directLogin(roleName, presetEmail, { facility, password: presetPass });

    if (authenticatedRole === 'doctor') navigate('/doctor/dashboard');
    else if (authenticatedRole === 'nurse') navigate('/nurse/dashboard');
    else navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F7F7FB] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-[#26263A] text-white rounded-2xl shadow-xl">
            <Dna className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#26263A] tracking-tight">ResistomeX Portal</h1>
            <p className="text-xs font-semibold text-[#7A7AA3] mt-1">
              AI-Powered Antimicrobial Resistance Clinical Decision Support Engine
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#dcdcec] text-[11px] text-[#26263A] font-medium shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Hospital Clinical CDS System • One-Click Authentication Enabled</span>
          </div>
        </div>

        {/* Clinical Authentication Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#dcdcec] p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#dcdcec]">
            <div>
              <h2 className="text-base font-bold text-[#26263A]">Clinical Staff Sign-In</h2>
              <p className="text-xs text-[#7A7AA3]">Click any role below to launch dashboard instantly</p>
            </div>
            <Lock className="w-4 h-4 text-[#7A7AA3]" />
          </div>

          {/* One-Click Role Selector Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#7A7AA3]">Instant Launch Role</label>
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#F7F7FB] border border-[#dcdcec]">
              <button
                type="button"
                onClick={() => handleQuickLogin('doctor')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all cursor-pointer ${
                  selectedRole === 'doctor'
                    ? 'bg-[#26263A] text-white shadow-sm font-semibold'
                    : 'text-[#7A7AA3] hover:text-[#26263A] hover:bg-gray-100'
                }`}
              >
                <Stethoscope className="w-4 h-4 mb-0.5" />
                <span className="text-xs font-bold">Doctor</span>
                <span className="text-[9px] opacity-75">Attending</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('nurse')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all cursor-pointer ${
                  selectedRole === 'nurse'
                    ? 'bg-[#26263A] text-white shadow-sm font-semibold'
                    : 'text-[#7A7AA3] hover:text-[#26263A] hover:bg-gray-100'
                }`}
              >
                <HeartPulse className="w-4 h-4 mb-0.5" />
                <span className="text-xs font-bold">Nurse</span>
                <span className="text-[9px] opacity-75">ICU / Ward</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-[#26263A] text-white shadow-sm font-semibold'
                    : 'text-[#7A7AA3] hover:text-[#26263A] hover:bg-gray-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4 mb-0.5" />
                <span className="text-xs font-bold">Admin</span>
                <span className="text-[9px] opacity-75">Stewardship</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Facility ID</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={facility}
                  onChange={e => setFacility(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital Email / Staff ID</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => handleEmailChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-indigo-900 bg-indigo-50/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#26263A] hover:bg-[#1c1c2b] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Launch {selectedRole.toUpperCase()} Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="pt-3 border-t border-[#dcdcec] text-center">
            <span className="text-xs text-gray-600">Need a new staff account? </span>
            <Link to="/signup" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
              Create Staff Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
