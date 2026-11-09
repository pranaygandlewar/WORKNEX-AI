import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Lock,
  Terminal,
  Eye,
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogEntry } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export const AuditCenter: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [activeEntry, setActiveEntry] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.audit.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit log', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Compliance & Audit Center</h2>
          <p className="text-xs text-gray-400">
            Immutable, append-only ledger tracking all human actions, MCP tool executions, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
          <Lock className="h-3.5 w-3.5" />
          <span>Sensitive Credentials Auto-Redacted</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-800 bg-[#111827]/80 p-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tool name, actor, or arguments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-gray-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          {['all', 'SUCCESS', 'FAILURE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'border-blue-500/40 bg-blue-500/20 text-blue-300'
                  : 'border-gray-800 bg-gray-900/80 text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111827]/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-800 bg-gray-900/60 text-gray-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Event ID</th>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Actor</th>
                <th className="px-5 py-3 font-semibold">Tool / Operation</th>
                <th className="px-5 py-3 font-semibold">Arguments</th>
                <th className="px-5 py-3 font-semibold">Outcome / Result</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading compliance audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-gray-400">#{e.id}</td>
                    <td className="px-5 py-3.5 text-gray-400">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-blue-400">{e.actor}</td>
                    <td className="px-5 py-3.5 font-semibold text-white">
                      <span className="font-mono text-indigo-400">{e.tool_name}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-gray-400 max-w-[200px] truncate">
                      {e.arguments}
                    </td>
                    <td className="px-5 py-3.5 text-gray-300 max-w-[240px] truncate">{e.result}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={e.status === 'SUCCESS' ? 'success' : 'danger'}>
                        {e.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setActiveEntry(e)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Event Modal */}
      <Modal
        isOpen={!!activeEntry}
        onClose={() => setActiveEntry(null)}
        title={`Audit Event Trace #${activeEntry?.id}`}
        maxWidth="lg"
      >
        {activeEntry && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-900/60 p-4 border border-gray-800">
              <div>
                <span className="text-gray-500">Operation / Tool:</span>
                <p className="font-mono font-bold text-white mt-0.5">{activeEntry.tool_name}</p>
              </div>
              <div>
                <span className="text-gray-500">Actor Identity:</span>
                <p className="font-medium text-blue-400 mt-0.5">{activeEntry.actor}</p>
              </div>
              <div>
                <span className="text-gray-500">Timestamp:</span>
                <p className="text-gray-300 mt-0.5">
                  {new Date(activeEntry.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <div className="mt-0.5">
                  <Badge variant={activeEntry.status === 'SUCCESS' ? 'success' : 'danger'}>
                    {activeEntry.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <span className="text-gray-400 font-semibold block mb-1">
                Serialized Invocation Arguments (Redacted):
              </span>
              <pre className="rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                {JSON.stringify(JSON.parse(activeEntry.arguments || '{}'), null, 2)}
              </pre>
            </div>

            <div>
              <span className="text-gray-400 font-semibold block mb-1">System Result:</span>
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-gray-300 whitespace-pre-wrap">
                {activeEntry.result}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

