import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@Worknex2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-800 bg-[#111827]/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 shadow-lg shadow-blue-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">WORKNEX AI</h2>
          <p className="mt-1 text-xs text-gray-400">
            Enterprise Workflow & Resource Management Platform
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300">Username</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <UserIcon className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-lg border border-gray-800 bg-gray-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300">Password</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-800 bg-gray-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-indigo-500 focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign in to WORKNEX AI'}
          </button>
        </form>

        {/* Demo Credentials Quick Switcher */}
        <div className="rounded-xl border border-gray-800/80 bg-gray-900/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Quick Demonstration Credentials
          </p>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPreset('admin', 'Admin@Worknex2026!')}
              className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setPreset('manager', 'Manager@Worknex2026!')}
              className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => setPreset('employee', 'Employee@Worknex2026!')}
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
            >
              Employee
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>Protected with Argon2 Password Hashing & RBAC Enforcement</span>
        </div>
      </div>
    </div>
  );
};

