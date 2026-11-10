import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Orders } from './pages/Orders';
import { Procurement } from './pages/Procurement';
import { AIAssistant } from './pages/AIAssistant';
import { AuditCenter } from './pages/AuditCenter';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const DemoRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isDemoMode, enterDemoMode } = useAuth();
  useEffect(() => {
    if (!isDemoMode) {
      enterDemoMode();
    }
  }, [isDemoMode, enterDemoMode]);
  return children;
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isDemoMode } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  if (isDemoMode) {
    return <Navigate to="/demo" replace />;
  }
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Landing Page */}
          <Route path="/login" element={<Login />} />

          {/* Root Redirection */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authenticated Workspace */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/procurement" element={<Procurement />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/audit" element={<AuditCenter />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Public Read-Only Demo Workspace */}
          <Route
            path="/demo"
            element={
              <DemoRoute>
                <Layout />
              </DemoRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<Orders />} />
            <Route path="procurement" element={<Procurement />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="audit" element={<AuditCenter />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
