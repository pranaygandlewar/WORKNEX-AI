import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export const DEMO_USER: User = {
  id: 'usr-demo-visitor',
  username: 'demo_visitor',
  full_name: 'Demo Visitor (Read-Only)',
  email: 'visitor@worknex.ai',
  role: 'Demo Visitor',
  is_active: true,
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('worknex_token');
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('worknex_demo_mode') === 'true';
  });

  const [user, setUser] = useState<User | null>(() => {
    if (localStorage.getItem('worknex_demo_mode') === 'true') {
      return DEMO_USER;
    }
    const saved = localStorage.getItem('worknex_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Authenticated state is strictly true only when real user token exists and not in demo mode
  const isAuthenticated = Boolean(token && user && !isDemoMode);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.auth.login(username, password);
      const accessToken = data.access_token;
      
      localStorage.setItem('worknex_token', accessToken);
      localStorage.removeItem('worknex_demo_mode');
      setToken(accessToken);
      setIsDemoMode(false);

      // Retrieve full authenticated user profile from backend
      try {
        const profile = await api.auth.me();
        setUser(profile);
        localStorage.setItem('worknex_user', JSON.stringify(profile));
      } catch {
        // Fallback to data returned from login endpoint
        const fallbackUser: User = {
          id: data.id || `usr-${data.username.toLowerCase()}`,
          username: data.username,
          full_name: data.full_name || data.username,
          email: `${data.username.toLowerCase()}@worknex.ai`,
          role: data.role || 'Employee',
          is_active: true,
        };
        setUser(fallbackUser);
        localStorage.setItem('worknex_user', JSON.stringify(fallbackUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    localStorage.removeItem('worknex_token');
    localStorage.removeItem('worknex_user');
    localStorage.removeItem('worknex_demo_mode');
    setToken(null);
    setUser(null);
    setIsDemoMode(false);
  };

  const enterDemoMode = () => {
    localStorage.removeItem('worknex_token');
    localStorage.removeItem('worknex_user');
    localStorage.setItem('worknex_demo_mode', 'true');
    setToken(null);
    setUser(DEMO_USER);
    setIsDemoMode(true);
  };

  const exitDemoMode = () => {
    localStorage.removeItem('worknex_demo_mode');
    setIsDemoMode(false);
    setUser(null);
    setToken(null);
  };

  const hasRole = (roles: string[]): boolean => {
    if (isDemoMode) {
      return roles.includes('Demo Visitor');
    }
    if (!user) return false;
    if (user.role === 'Administrator') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isDemoMode,
        login,
        logout,
        enterDemoMode,
        exitDemoMode,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
