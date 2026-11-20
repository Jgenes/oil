import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/apiClient';

const AuthContext = createContext(null);

export const ROLES = [
  { role: 'transport_officer', email: 'transport@mocu.ac.tz', name: 'Capt. Michael Shirima', title: 'Head Transport Officer', label: 'Transport Officer' },
  { role: 'admin', email: 'admin@mocu.ac.tz', name: 'Eng. Godfrey Tarimo', title: 'System Administrator', label: 'System Administrator' },
  { role: 'hod', email: 'hod.estate@mocu.ac.tz', name: 'Dr. Prosper Mrosso', title: 'HOD Estates & Works', label: 'Head of Department (HOD)' },
  { role: 'approving_officer', email: 'hpmu@mocu.ac.tz', name: 'Ms. Beatrice Swai', title: 'Head of PMU (HPMU)', label: 'Approving Officer (HPMU)' },
  { role: 'finance_officer', email: 'finance@mocu.ac.tz', name: 'CPA Daniel Kimaro', title: 'Principal Accountant', label: 'Finance Officer' },
  { role: 'driver', email: 'driver@mocu.ac.tz', name: 'Juma Shabani Mushi', title: 'Senior University Chauffeur', label: 'Driver' },
  { role: 'internal_auditor', email: 'auditor@mocu.ac.tz', name: 'CPA Frank Moshi', title: 'Chief Internal Auditor', label: 'Internal Auditor' },
  { role: 'management', email: 'vc@mocu.ac.tz', name: 'Prof. Alfred S. Sife', title: 'Vice Chancellor', label: 'University Management' }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    setLoading(true);
    const savedToken = localStorage.getItem('mocu_token');
    if (savedToken) {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          setPermissions(res.data.permissions || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Saved token expired or invalid, re-authenticating default demo user');
      }
    }

    // Default to Transport Officer for comprehensive immediate testing
    try {
      const res = await api.post('/auth/login', {
        email: 'transport@mocu.ac.tz',
        password: 'mocu@2026'
      });
      if (res.data.success) {
        localStorage.setItem('mocu_token', res.data.token);
        setUser(res.data.user);
        setPermissions(res.data.permissions || []);
      }
    } catch (err) {
      console.error('Initial auth error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('mocu_token', res.data.token);
        setUser(res.data.user);
        setPermissions(res.data.permissions || []);
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  }

  async function switchRole(email) {
    try {
      const res = await api.post('/auth/switch-role', { email });
      if (res.data.success) {
        localStorage.setItem('mocu_token', res.data.token);
        setUser(res.data.user);
        setPermissions(res.data.permissions || []);
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Role switch failed' };
    }
  }

  function logout() {
    localStorage.removeItem('mocu_token');
    setUser(null);
    setPermissions([]);
  }

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, switchRole, logout, ROLES }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
