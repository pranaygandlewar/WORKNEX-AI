import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export const Layout: React.FC = () => {
  const { isDemoMode, exitDemoMode } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-64">
        {/* Persistent Demo Mode Banner */}
        {isDemoMode && (
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-amber-500/30 bg-amber-950/70 px-8 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-xs font-medium text-amber-300">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                <strong>DEMO MODE — READ ONLY:</strong> Public Demonstration Workspace. Database modifications, stock adjustments, and requisition approvals are restricted.
              </span>
            </div>
            <button
              onClick={() => {
                exitDemoMode();
                navigate('/login');
              }}
              className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors"
            >
              <span>Exit Demo Mode</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <Navbar />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

