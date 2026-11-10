import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  Lock,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('Pranay');
  const [password, setPassword] = useState('Pranay1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, enterDemoMode, isAuthenticated, isDemoMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(err.response?.data?.detail || 'Incorrect username or password. Please verify your credentials.');
      } else if (err.response?.status === 403) {
        setError(err.response?.data?.detail || 'This account has been deactivated.');
      } else if (!err.response) {
        setError('Cannot connect to the WORKNEX backend API. Please verify the backend service is running.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExploreDemo = () => {
    enterDemoMode();
    navigate('/demo');
  };

  const setPreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] px-4 py-8">
      <div className="w-full max-w-4xl space-y-6 rounded-2xl border border-gray-800 bg-[#111827]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 shadow-xl shadow-blue-500/25">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">WORKNEX AI</h2>
          <p className="mt-1 text-xs font-medium text-gray-400">
            AI-Powered Enterprise Workflow & Resource Management Platform
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Two Vertical Columns Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Column 1: Option A - Enterprise Sign In */}
          <div className="flex flex-col justify-between rounded-xl border border-gray-800/80 bg-gray-900/50 p-5 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800/60 pb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Option A: Enterprise Sign In
                </span>
                <span className="text-[10px] rounded bg-blue-500/10 px-2 py-0.5 text-blue-400 border border-blue-500/20 font-mono">
                  Argon2id + JWT
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-300">Username or ID</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full rounded-lg border border-gray-800 bg-gray-900 py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter username"
                      autoComplete="username"
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
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-gray-800 bg-gray-900 py-2 pl-9 pr-9 text-xs text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-violet-500 focus:outline-none disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to WORKNEX AI</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Credentials Presets (Vertical List) */}
            <div className="pt-3 border-t border-gray-800/60 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Instant Login Presets
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreset('Pranay', 'Pranay1234')}
                  className="w-full flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  <span>Pranay (Administrator)</span>
                  <span className="font-mono text-[10px] text-gray-400">Pranay1234</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('manager', 'Manager@Worknex2026!')}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white transition-colors"
                >
                  <span>Alex Mercer (Manager)</span>
                  <span className="font-mono text-[10px] text-gray-500">Manager@Worknex2026!</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('employee', 'Employee@Worknex2026!')}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white transition-colors"
                >
                  <span>Elena Vance (Employee)</span>
                  <span className="font-mono text-[10px] text-gray-500">Employee@Worknex2026!</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Option B - Explore Demo Mode */}
          <div className="flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-5 space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Option B: Public Exploration
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  NO ACCOUNT REQUIRED
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Experience WORKNEX AI in public read-only mode with immediate access to enterprise ERP operations and autonomous AI agent workflows.
              </p>

              {/* Feature Checklist */}
              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Executive KPI Dashboards & Real-time Charts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Multi-Warehouse Inventory & Threshold Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Sales Order Fulfillment & Lifecycle Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Procurement & Cryptographic Approval Audits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>AI Business Assistant (Public Read MCP Tools)</span>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-emerald-900/20 p-2.5 text-[11px] text-emerald-300/90 border border-emerald-500/20">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                <span>
                  <strong>Read-Only Guardrails:</strong> Stock adjustments, requisition approvals, and administrative actions are strictly disabled in Demo Mode.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExploreDemo}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-teal-500 focus:outline-none"
            >
              <span>DEMO MODE — READ ONLY</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-1">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>Protected with Argon2id Password Hashing & Cryptographic Token Guardrails</span>
        </div>
      </div>
    </div>
  );
};
