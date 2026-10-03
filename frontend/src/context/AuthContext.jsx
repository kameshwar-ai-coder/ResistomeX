import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null); // 'doctor' | 'nurse' | 'admin' | null
  const [user, setUser] = useState(null); // Profile object
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Persist session to local storage for fast reload
  const persistLocalSession = (userObj, userRole, sessionObj) => {
    localStorage.setItem('resistomex_session', JSON.stringify({ userObj, userRole, sessionObj }));
  };

  // Direct Preset Login for Demo & Rapid Role Switching
  const directLogin = (selectedRole = 'doctor', inputEmail = '', extraMeta = {}) => {
    const roleTitles = {
      doctor: 'Attending Physician · Infectious Diseases',
      nurse: 'Charge Nurse · ICU Unit',
      admin: 'Antimicrobial Stewardship Director'
    };

    const roleNames = {
      doctor: 'Dr. Marcus Vance',
      nurse: 'RN Sarah Jenkins',
      admin: 'Dr. Elena Rostova'
    };

    const roleAvatars = {
      doctor: 'MV',
      nurse: 'SJ',
      admin: 'ER'
    };

    let finalRole = selectedRole || 'doctor';
    if (inputEmail) {
      const lower = inputEmail.toLowerCase();
      if (lower.includes('nurse')) finalRole = 'nurse';
      else if (lower.includes('admin') || lower.includes('stewardship')) finalRole = 'admin';
      else if (lower.includes('doctor') || lower.includes('dr')) finalRole = 'doctor';
    }

    const emailToUse = inputEmail || `${finalRole}@hospital.org`;
    const displayName = extraMeta.fullName || roleNames[finalRole] || 'Clinical Staff';
    const initials = roleAvatars[finalRole] || 'RX';

    const userProfile = {
      id: 'usr-' + finalRole,
      email: emailToUse,
      name: displayName,
      title: extraMeta.title || roleTitles[finalRole],
      facility: extraMeta.facility || 'Central Academic Medical Center',
      department: extraMeta.department || 'Inpatient Ward',
      role: finalRole,
      avatar: initials
    };

    const activeSession = {
      user: { id: userProfile.id, email: userProfile.email },
      access_token: 'resistomex-session-active'
    };

    setUser(userProfile);
    setRole(finalRole);
    setSession(activeSession);
    persistLocalSession(userProfile, finalRole, activeSession);

    return { role: finalRole, user: userProfile };
  };

  // Fetch real profile & role from Supabase DB
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!error && profile) {
        setRole(profile.role || 'doctor');
        const userObj = {
          id: authUser.id,
          email: authUser.email,
          name: profile.full_name || authUser.email,
          title: profile.title || (profile.role === 'nurse' ? 'Charge Nurse · ICU' : profile.role === 'admin' ? 'Stewardship Director' : 'Attending Physician'),
          facility: profile.facility || 'Central Academic Medical Center',
          department: profile.department || 'Inpatient Ward',
          role: profile.role || 'doctor',
          avatar: profile.avatar_initials || 'RX'
        };
        setUser(userObj);
        persistLocalSession(userObj, profile.role || 'doctor', { user: { id: authUser.id, email: authUser.email } });
      }
    } catch (err) {
      console.warn('[AuthContext] Profile fetch note:', err.message);
    }
  }, []);

  // Restore session on mount & subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // Check stored local session first
      const saved = localStorage.getItem('resistomex_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.userObj && parsed?.userRole) {
            setUser(parsed.userObj);
            setRole(parsed.userRole);
            setSession(parsed.sessionObj);
          }
        } catch (e) {
          console.warn('[AuthContext] Saved session parse note:', e.message);
        }
      }

      if (isSupabaseConfigured) {
        try {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          if (mounted && initialSession?.user) {
            setSession(initialSession);
            await fetchProfile(initialSession.user);
          }
        } catch (err) {
          console.warn('[AuthContext] Supabase session check note:', err.message);
        }
      }

      if (mounted) setLoading(false);
    }

    initAuth();

    // Subscribe to Supabase auth changes
    let subscription = null;
    if (isSupabaseConfigured) {
      const authSub = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;
        if (currentSession?.user) {
          setSession(currentSession);
          await fetchProfile(currentSession.user);
        }
        setLoading(false);
      });
      subscription = authSub.data?.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Standard Supabase login method with explicit error handling
  const login = async (email, password) => {
    setAuthError('');
    if (!isSupabaseConfigured) {
      const msg = 'Supabase authentication service is unconfigured.';
      setAuthError(msg);
      return { error: { message: msg } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        return { error };
      }
      if (data?.user) {
        await fetchProfile(data.user);
        return data;
      }
    } catch (e) {
      setAuthError(e.message);
      return { error: e };
    }
  };

  // Sign up new medical staff into Supabase
  const signUp = async (email, password, profileData) => {
    setAuthError('');
    if (!isSupabaseConfigured) {
      const msg = 'Supabase authentication service is unconfigured.';
      setAuthError(msg);
      return { error: { message: msg } };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profileData.fullName,
            role: profileData.role || 'doctor',
            title: profileData.title,
            facility: profileData.facility,
            department: profileData.department,
            avatar_initials: profileData.initials
          }
        }
      });
      if (error) {
        setAuthError(error.message);
        return { error };
      }
      return data;
    } catch (e) {
      setAuthError(e.message);
      return { error: e };
    }
  };

  // Sign out
  const logout = async () => {
    setAuthError('');
    localStorage.removeItem('resistomex_session');
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[AuthContext] SignOut note:', err.message);
    } finally {
      setSession(null);
      setUser(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      role,
      loading,
      authError,
      setAuthError,
      login,
      directLogin,
      signUp,
      logout,
      isAuthenticated: Boolean(session?.user || user)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
