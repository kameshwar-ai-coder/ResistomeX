import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Roles: 'doctor' | 'nurse' | 'admin'
  const [role, setRole] = useState('doctor');
  const [user, setUser] = useState({
    name: 'Dr. Marcus Vance, MD',
    title: 'Attending Physician · Infectious Diseases',
    facility: 'Central Academic Medical Center',
    department: 'ICU / Ward 22',
    avatar: 'MV'
  });

  const switchRole = (newRole) => {
    setRole(newRole);
    if (newRole === 'doctor') {
      setUser({
        name: 'Dr. Marcus Vance, MD',
        title: 'Attending Physician · Infectious Diseases',
        facility: 'Central Academic Medical Center',
        department: 'ICU / Ward 22',
        avatar: 'MV'
      });
    } else if (newRole === 'nurse') {
      setUser({
        name: 'RN Sarah Jenkins',
        title: 'Charge Nurse · ICU Unit',
        facility: 'Central Academic Medical Center',
        department: 'ICU Ward 22',
        avatar: 'SJ'
      });
    } else if (newRole === 'admin') {
      setUser({
        name: 'Dr. Elena Rostova',
        title: 'Antimicrobial Stewardship Director',
        facility: 'Central Academic Medical Center',
        department: 'AMR Surveillance & Admin',
        avatar: 'ER'
      });
    }
  };

  return (
    <AuthContext.Provider value={{ role, user, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
