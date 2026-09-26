import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('role') || 'Farmer');
  const [loading, setLoading] = useState(true);

  // Durable authentication verification against backend /api/auth/me
  const verifyAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setRole('Farmer');
      setLoading(false);
      return;
    }

    try {
      // Set header explicitly just in case
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      const response = await api.get('/auth/me');
      const userData = response.data;

      setUser(userData);
      setRole(userData.role || 'Farmer');
      setToken(savedToken);
      localStorage.setItem('role', userData.role || 'Farmer');
      localStorage.setItem('name', userData.name || '');
    } catch (err) {
      console.warn('Authentication token verification failed:', err);
      // Clear invalid credentials
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
      setRole('Farmer');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Login handler
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, role: userRole, name } = response.data;

    localStorage.setItem('token', access_token);
    localStorage.setItem('role', userRole);
    localStorage.setItem('name', name);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    setToken(access_token);
    setRole(userRole);

    // Fetch full user object
    try {
      const meRes = await api.get('/auth/me');
      setUser(meRes.data);
    } catch {
      setUser({ name, email, role: userRole });
    }

    return response.data;
  };

  // Register handler
  const register = async (name, email, password, userRole = 'Farmer') => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role: userRole,
    });
    return response.data;
  };

  // Logout handler - completely cleans up authentication state
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    setRole('Farmer');
  };

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    role,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshUser: verifyAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
