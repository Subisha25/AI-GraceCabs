import React, { createContext, useContext, useState, ReactNode } from 'react';
import axiosInstance from '../utils/axiosInstance';

type AuthContextType = {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    // 1. Clear local storage immediately
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('companyId');
    localStorage.removeItem('user');

    // 2. Set authentication status
    setIsAuthenticated(false);

    // 3. Backend logout cleanup
    axiosInstance.post('/auth/logout').catch((err) => {
      console.error('Backend session cleanup failed:', err);
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};