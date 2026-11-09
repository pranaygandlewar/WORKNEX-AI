import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User;
  token: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const defaultAdminUser: User = {
  id: 'usr-pranay',
  username: 'Pranay',
  full_name: 'Pranay (Administrator)',
  email: 'pranay@worknex.ai',
  role: 'Administrator',
  is_active: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('worknex_user');
    return saved ? JSON.parse(saved) : defaultAdminUser;
  });
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('worknex_token') || 'worknex-admin-token-pranay';
  });

  const login = async () => {
    setUser(defaultAdminUser);
    setToken('worknex-admin-token-pranay');
  };

  const logout = () => {
    // Reset to default admin user
    setUser(defaultAdminUser);
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return true;
    if (user.role === 'Administrator') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
        login,
        logout,
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
