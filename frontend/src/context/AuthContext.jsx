import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, setAuthToken } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await auth.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const data = await auth.login({ email, password });
    if (data?.token) setAuthToken(data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (name, email, password, role = 'buyer') => {
    const data = await auth.signup({ name, email, password, role });
    if (data?.token) setAuthToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await auth.logout();
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
