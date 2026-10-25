import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, fetchCsrfToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      await fetchCsrfToken();
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    const res = await api.login({ email, password });
    if (res.success && res.user) {
      setUser(res.user);
      return res.user;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    return await api.register({ name, email, password });
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    isLoggedIn: !!user,
    isVerified: user?.isVerified ?? false,
    login,
    register,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
