import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';

export const UserManagementPage = () => {
  const { users, toggleUserStatus, addUser } = usePatients();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Doctor', department: 'Infectious Diseases' });

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    addUser(newUser);
    setNewUser({ name: '', email: '', role: 'Doctor', department: 'Infectious Diseases' });
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#111124] text-[24px]">manage_accounts</span>
            <h1 className="text-2xl font-bold text-[#111124] tracking-tight">Staff User Management</h1>
          </div>
          <p className="text-xs text-[#5a5b82] mt-0.5">
            Manage hospital staff accounts, clinical roles (Doctor, Nurse, Admin), permissions, and active status.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#111124] hover:bg-[#26263a] text-white text-xs font-bold rounded transition-colors shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Add New Staff Account</span>
        </button>
      </div>

      {/* Search & Users Table */}
      <div className="bg-white rounded-xl border border-[#ededf1] shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-2 text-[#78767d] text-[18px]">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff by name, email, or role..."
              className="w-full pl-9 pr-4 py-1.5 bg-[#f3f3f7] border border-[#ededf1] rounded text-xs focus:outline-none"
            />
          </div>

          <span className="text-xs text-[#5a5b82] font-semibold">{filtered.length} total staff accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f3f3f7] border-b border-[#ededf1] text-[#5a5b82] font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ededf1]">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-[#f3f3f7]/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-[#111124]">{user.name}</td>
                  <td className="px-4 py-3 text-[#5a5b82] font-mono">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      user.role === 'Doctor' ? 'bg-[#e2e0fb] text-[#111124]' :
                      user.role === 'Nurse' ? 'bg-emerald-100 text-emerald-900' :
                      'bg-[#e8e8ec] text-[#111124]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#47464c]">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                      user.status === 'Active' ? 'text-emerald-800' : 'text-[#ba1a1a]'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-[#ba1a1a]'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        user.status === 'Active'
                          ? 'bg-[#ffdad6] text-[#93000a] hover:bg-red-200'
                          : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                      }`}
                    >
                      {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#ededf1] shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#ededf1] pb-3">
              <h3 className="text-base font-bold text-[#111124]">Add New Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#111124] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Dr. Jonathan Reyes"
                  className="w-full px-3 py-1.5 bg-[#f3f3f7] border border-[#ededf1] rounded text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111124] mb-1">Hospital Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. j.reyes@hospital.org"
                  className="w-full px-3 py-1.5 bg-[#f3f3f7] border border-[#ededf1] rounded text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111124] mb-1">Clinical Role *</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#f3f3f7] border border-[#ededf1] rounded text-xs focus:outline-none"
                >
                  <option value="Doctor">Doctor</option>
                  <option value="Nurse">Nurse</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#111124] mb-1">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="e.g. ICU Ward 22"
                  className="w-full px-3 py-1.5 bg-[#f3f3f7] border border-[#ededf1] rounded text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#ededf1]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-[#f3f3f7] text-[#111124] font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#111124] text-white font-bold rounded shadow-xs"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
