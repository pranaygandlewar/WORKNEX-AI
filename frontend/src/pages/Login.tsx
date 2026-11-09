import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, Lock, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('Pranay');
  const [password, setPassword] = useState('Pranay1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      navigate('/');
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot reach backend on http://localhost:8000. Ensure the backend is running with "uv run python main.py server".');
      } else {
        setError(err.response?.data?.detail || 'Invalid credentials. Please verify username and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
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
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
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

        {/* Quick Credentials Switcher */}
        <div className="rounded-xl border border-gray-800/80 bg-gray-900/40 p-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Instant Login Presets
          </p>
          <button
            type="button"
            onClick={() => setPreset('Pranay', 'Pranay1234')}
            className="w-full flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <span>Pranay (Administrator)</span>
            <span className="font-mono text-[11px] text-gray-400">Pranay1234</span>
          </button>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setPreset('manager', 'Manager@Worknex2026!')}
              className="rounded-lg border border-gray-800 bg-gray-900/80 px-2.5 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => setPreset('employee', 'Employee@Worknex2026!')}
              className="rounded-lg border border-gray-800 bg-gray-900/80 px-2.5 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white"
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
