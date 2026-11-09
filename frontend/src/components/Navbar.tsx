import React from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Activity, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
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

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-800 bg-[#0d121f]/80 px-8 backdrop-blur-md">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-400">WORKNEX</span>
        <span className="text-gray-400">/</span>
        <h1 className="text-sm font-semibold text-white">{getPageTitle(location.pathname)}</h1>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Real-time MCP Server Status Pill */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          <span>MCP Protocol Active</span>
        </div>

        {/* User Role Pill */}
        <Badge variant={user?.role === 'Administrator' ? 'brand' : user?.role === 'Manager' ? 'info' : 'neutral'}>
          {user?.role || 'Employee'}
        </Badge>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-700 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

