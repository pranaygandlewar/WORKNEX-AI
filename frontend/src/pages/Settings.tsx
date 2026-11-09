import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Cpu,
  Shield,
  Activity,
  CheckCircle2,
  Database,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { SystemHealth, SystemSettings } from '../types';
import { Badge } from '../components/Badge';

export const Settings: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const [h, s] = await Promise.all([api.system.health(), api.system.settings()]);
        setHealth(h);
        setSettings(s);
      } catch (err) {
        console.error('Failed to fetch system info', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSystemInfo();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">System & AI Settings</h2>
        <p className="text-xs text-gray-400">
          Environment configuration, Model Context Protocol parameters, and operational health telemetry.
        </p>
      </div>

      {/* System Health Telemetry */}
      <div className="rounded-xl border border-gray-800 bg-[#111827]/80 p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Platform Health Status</h3>
            <p className="text-xs text-gray-400">Real-time infrastructure connectivity checks</p>
          </div>
          <div className="ml-auto">
            <Badge variant={health?.status === 'operational' ? 'success' : 'warning'}>
              {health?.status ? health.status.toUpperCase() : 'CHECKING'}
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-lg bg-gray-900/60 p-3.5 border border-gray-800/80">
            <span className="text-gray-500">PostgreSQL Database:</span>
            <div className="mt-1 flex items-center gap-1.5 font-semibold text-white">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>{health?.database || 'Connected'}</span>
            </div>
          </div>
          <div className="rounded-lg bg-gray-900/60 p-3.5 border border-gray-800/80">
            <span className="text-gray-500">MCP Server Transport:</span>
            <div className="mt-1 flex items-center gap-1.5 font-semibold text-white">
              <Layers className="h-4 w-4 text-blue-400" />
              <span>Streamable HTTP & stdio</span>
            </div>
          </div>
          <div className="rounded-lg bg-gray-900/60 p-3.5 border border-gray-800/80">
            <span className="text-gray-500">Active AI Engine:</span>
            <div className="mt-1 flex items-center gap-1.5 font-semibold text-white">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <span className="capitalize">{health?.ai_provider || 'MCP Agent Engine'}</span>
            </div>
          </div>
          <div className="rounded-lg bg-gray-900/60 p-3.5 border border-gray-800/80">
            <span className="text-gray-500">Platform Build:</span>
            <div className="mt-1 flex items-center gap-1.5 font-mono font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>v{health?.version || '1.0.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & MCP Configuration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-[#111827]/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">AI Assistant Configuration</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-400">Target AI Engine:</span>
              <p className="mt-0.5 font-mono text-white font-medium">
                {settings?.ai_provider === 'gemini' ? 'Google Gemini 2.0' : 'WORKNEX Heuristic MCP Assistant'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Default Model Designation:</span>
              <p className="mt-0.5 font-mono text-blue-400">{settings?.ai_model || 'gemini-2.0-flash'}</p>
            </div>
            <div>
              <span className="text-gray-400">Tool Registry Surface:</span>
              <p className="mt-0.5 text-gray-300">
                get_open_orders, check_inventory, get_low_stock_items, create_requisition,
                approve_pending_requisition
              </p>
            </div>
            <div>
              <span className="text-gray-400">Safety & Approval Guardrails:</span>
              <p className="mt-0.5 text-emerald-400">
                ✓ Human-in-the-Loop active: AI agent self-approvals strictly rejected.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-[#111827]/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Server className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Model Context Protocol (MCP) Server</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-400">Streamable HTTP Binding:</span>
              <p className="mt-0.5 font-mono text-white">
                http://{settings?.mcp_host || '127.0.0.1'}:{settings?.mcp_port || 8000}/mcp
              </p>
            </div>
            <div>
              <span className="text-gray-400">Transport Authentication:</span>
              <p className="mt-0.5 text-emerald-400">
                Protected via ASGI Middleware (Authorization: Bearer MCP_API_KEY)
              </p>
            </div>
            <div>
              <span className="text-gray-400">Stdio Desktop Support:</span>
              <p className="mt-0.5 text-gray-300">
                Compatible with Claude Desktop via standard OS stdio pipe.
              </p>
            </div>
            <div>
              <span className="text-gray-400">Security Redaction Policy:</span>
              <p className="mt-0.5 text-amber-400">
                Sensitive arguments (approval_token, password, api_key) automatically masked in
                audit logs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

