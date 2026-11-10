import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Activity, Eye, ShieldAlert, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const { user, isDemoMode, logout, exitDemoMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = (path: string) => {
    const cleanPath = path.replace(/^\/demo/, '') || '/';
    switch (cleanPath) {
      case '/':
      case '/dashboard':
        return 'Executive Overview';
      case '/inventory':
        return 'Inventory Management';
      case '/orders':
        return 'Sales & Order Management';
      case '/procurement':
        return 'Procurement & Approval Center';
      case '/ai-assistant':
        return 'AI Business Assistant (MCP Integrated)';
      case '/audit':
        return 'Compliance & Audit Trail';
      case '/users':
        return 'User & Access Management';
      case '/settings':
        return 'System & AI Settings';
      default:
        return 'Enterprise Dashboard';
    }
  };

  const handleAuthAction = () => {
    if (isDemoMode) {
      exitDemoMode();
      navigate('/login');
    } else {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-800 bg-[#0d121f]/90 px-8 backdrop-blur-md">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-400">WORKNEX</span>
        <span className="text-gray-400">/</span>
        <h1 className="text-sm font-semibold text-white">{getPageTitle(location.pathname)}</h1>
        {isDemoMode && (
          <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-amber-400 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            DEMO MODE — READ ONLY
          </span>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Real-time MCP Server Status Pill */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          <span>MCP Protocol Active</span>
        </div>

        {/* User Identity Display */}
        {isDemoMode ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300">
            <Eye className="h-3.5 w-3.5" />
            <span>Demo Visitor (Read-Only)</span>
          </div>
        ) : (
          <Badge variant="brand">
            {user?.full_name || `${user?.username || 'User'} (${user?.role || 'Authenticated'})`}
          </Badge>
        )}

        {/* Action Button: Sign Out or Exit Demo */}
        <button
          onClick={handleAuthAction}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            isDemoMode
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-white'
              : 'border-gray-800 bg-gray-900/80 text-gray-300 hover:border-gray-700 hover:text-white'
          }`}
          title={isDemoMode ? 'Exit Demo Mode and return to sign in' : 'Sign out of current account'}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{isDemoMode ? 'Exit Demo' : 'Sign Out'}</span>
        </button>
      </div>
    </header>
  );
};

