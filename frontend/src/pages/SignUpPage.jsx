import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Dna, 
  UserPlus, 
  Stethoscope, 
  HeartPulse, 
  ShieldAlert, 
  ArrowRight,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SignUpPage = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('doctor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('Attending Physician · Infectious Diseases');
  const [department, setDepartment] = useState('ICU Ward 22');
  const [facility, setFacility] = useState('Central Academic Medical Center');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRoleChange = (roleName) => {
    setSelectedRole(roleName);
    if (roleName === 'doctor') {
      setTitle('Attending Physician · Infectious Diseases');
      setDepartment('ICU Ward 22');
    } else if (roleName === 'nurse') {
      setTitle('Charge Nurse · ICU Unit');
      setDepartment('ICU Ward 22');
    } else {
      setTitle('Antimicrobial Stewardship Director');
      setDepartment('AMR Surveillance & Admin');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const initials = fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'RX';

    try {
      await signUp(email, password, {
        fullName,
        role: selectedRole,
        title,
        facility,
        department,
        initials
      });

      setSuccessMsg('Staff account registered successfully in Supabase! Redirecting to Sign In...');
      setLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 1800);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Account registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FB] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-[#26263A] text-white rounded-2xl shadow-xl">
            <Dna className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#26263A] tracking-tight">Create Staff Account</h1>
            <p className="text-xs font-semibold text-[#7A7AA3] mt-1">
              ResistomeX Antimicrobial Resistance Clinical CDS Portal
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#dcdcec] p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#dcdcec]">
            <div>
              <h2 className="text-base font-bold text-[#26263A]">Clinical Registration</h2>
              <p className="text-xs text-[#7A7AA3]">Provision new medical staff credentials</p>
            </div>
            <UserPlus className="w-4 h-4 text-[#7A7AA3]" />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Role Pills */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#7A7AA3]">Assigned Medical Role</label>
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#F7F7FB] border border-[#dcdcec]">
              <button
                type="button"
                onClick={() => handleRoleChange('doctor')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all ${
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
                onClick={() => handleRoleChange('nurse')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all ${
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
                onClick={() => handleRoleChange('admin')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all ${
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

          <form onSubmit={handleSignUp} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Marcus Vance"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Hospital Email *</label>
              <input
                type="email"
                required
                placeholder="doctor@resistomex.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Professional Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Facility Name</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#26263A] hover:bg-[#1c1c2b] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Creating Staff Account...' : 'Register Staff Account'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="pt-3 border-t border-[#dcdcec] text-center">
            <span className="text-xs text-gray-600">Already registered? </span>
            <Link to="/login" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
              Sign In to Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
