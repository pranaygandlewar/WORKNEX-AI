import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  FileCheck2,
  Bot,
  ShieldAlert,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();

  const navigation = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Boxes },
    { name: 'Sales Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Procurement', href: '/procurement', icon: FileCheck2 },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Bot, highlight: true },
    { name: 'Audit Center', href: '/audit', icon: ShieldAlert },
    ...(hasRole(['Administrator'])
      ? [{ name: 'User Management', href: '/users', icon: Users }]
      : []),
    { name: 'System Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-800 bg-[#0d121f]">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-800/80 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 shadow-md shadow-blue-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-wider text-white">WORKNEX</span>
          <span className="ml-1.5 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
            AI
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Enterprise Operations
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
              }`
            }
          >
            <item.icon
              className={`h-5 w-5 transition-colors ${
                item.highlight ? 'text-indigo-400 group-hover:text-indigo-300' : ''
              }`}
            />
            <span>{item.name}</span>
            {item.highlight && (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info Footer */}
      <div className="border-t border-gray-800/80 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-gray-900/60 p-2.5 border border-gray-800/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-sm font-semibold text-blue-400">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : 'WN'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-white">{user?.full_name || user?.username}</p>
            <p className="truncate text-[11px] text-gray-400">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

