import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Plus,
  Check,
  X,
  Key,
  ShieldAlert,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../services/api';
import { PurchaseRequisition, InventoryItem } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const Procurement: React.FC = () => {
  const { hasRole, user } = useAuth();
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [materials, setMaterials] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Reveal tokens toggle
  const [showTokens, setShowTokens] = useState(false);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    material_id: '',
    quantity: 100,
    notes: 'Restock inventory',
  });

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const data = await api.procurement.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setRequisitions(data);
    } catch (err) {
      console.error('Failed to fetch requisitions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [statusFilter]);

  useEffect(() => {
    const fetchMat = async () => {
      try {
        const mats = await api.inventory.list();
        setMaterials(mats);
        if (mats.length > 0) {
          setCreateForm((f) => ({ ...f, material_id: mats[0].material_id }));
        }
      } catch (err) {
        console.error('Failed to fetch materials', err);
      }
    };
    fetchMat();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.procurement.create(createForm);
      setIsCreateOpen(false);
      setCreateForm({ material_id: materials[0]?.material_id || '', quantity: 100, notes: '' });
      fetchRequisitions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit requisition');
    }
  };

  const handleApprove = async (req: PurchaseRequisition) => {
    try {
      // Pass the approval_token if present to demonstrate constant-time token verification
      await api.procurement.approve(req.requisition_id, req.approval_token);
      fetchRequisitions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Approval failed');
    }
  };

  const handleReject = async (req: PurchaseRequisition) => {
    const reason = prompt('Please provide reason for rejection:', 'Budget limit exceeded');
    if (!reason) return;
    try {
      await api.procurement.reject(req.requisition_id, reason);
      fetchRequisitions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Rejection failed');
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'approved':
        return <Badge variant="success">✓ Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">✕ Rejected</Badge>;
      case 'pending_approval':
      default:
        return <Badge variant="warning">⏳ Pending Approval</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Procurement & Approvals</h2>
          <p className="text-xs text-gray-400">
            Human-in-the-loop verification for purchase requisitions created by humans or AI agents.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Human-in-the-Loop Policy Callout */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300">
            <span className="font-semibold text-white">Human-in-the-Loop Security Architecture:</span>{' '}
            Autonomous AI agents and non-privileged employees are strictly prohibited from approving
            requisitions. A secure cryptographic approval token is generated at creation time and
            surfaced exclusively to verified Managers and Administrators to finalize the transaction.
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-800 bg-[#111827]/80 p-4">
        <div className="flex items-center gap-2">
          {['all', 'pending_approval', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'border-blue-500/40 bg-blue-500/20 text-blue-300'
                  : 'border-gray-800 bg-gray-900/80 text-gray-400 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {hasRole(['Administrator', 'Manager']) && (
          <button
            type="button"
            onClick={() => setShowTokens(!showTokens)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-400 hover:text-white"
          >
            {showTokens ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{showTokens ? 'Hide Security Tokens' : 'Reveal Security Tokens'}</span>
          </button>
        )}
      </div>

      {/* Requisitions Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111827]/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-800 bg-gray-900/60 text-gray-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Requisition ID</th>
                <th className="px-5 py-3 font-semibold">Material Code</th>
                <th className="px-5 py-3 font-semibold">Requested Qty</th>
                <th className="px-5 py-3 font-semibold">Applicant / Agent</th>
                <th className="px-5 py-3 font-semibold">Date Created</th>
                <th className="px-5 py-3 font-semibold">Approval Token</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                {hasRole(['Administrator', 'Manager']) && (
                  <th className="px-5 py-3 font-semibold text-right">Human Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading procurement requisitions...
                  </td>
                </tr>
              ) : requisitions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No purchase requisitions found in this view.
                  </td>
                </tr>
              ) : (
                requisitions.map((r) => (
                  <tr key={r.requisition_id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-blue-400">
                      {r.requisition_id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-white">{r.material_id}</td>
                    <td className="px-5 py-3.5 font-bold text-white">{r.quantity} units</td>
                    <td className="px-5 py-3.5 text-gray-400">{r.requested_by}</td>
                    <td className="px-5 py-3.5 text-gray-400">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.approval_token ? (
                        showTokens ? (
                          <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {r.approval_token}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-gray-500">••••••••••••••••</span>
                        )
                      ) : (
                        <span className="text-[11px] text-gray-500 italic">Redacted (Restricted)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(r.status)}</td>
                    {hasRole(['Administrator', 'Manager']) && (
                      <td className="px-5 py-3.5 text-right">
                        {r.status === 'pending_approval' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(r)}
                              title="Approve Requisition"
                              className="flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 font-medium text-emerald-400 hover:bg-emerald-600/30"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(r)}
                              title="Reject Requisition"
                              className="flex items-center gap-1 rounded-lg bg-rose-600/20 border border-rose-500/30 px-2.5 py-1 font-medium text-rose-400 hover:bg-rose-600/30"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500">
                            {r.approved_by ? `By ${r.approved_by}` : 'Completed'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Propose Requisition */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Propose Purchase Requisition"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300">Material Item to Replenish</label>
            <select
              value={createForm.material_id}
              onChange={(e) => setCreateForm({ ...createForm, material_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            >
              {materials.map((m) => (
                <option key={m.material_id} value={m.material_id}>
                  {m.material_id} — {m.description} ({m.quantity_on_hand} on hand)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-300">Requested Quantity</label>
            <input
              type="number"
              min="1"
              required
              value={createForm.quantity}
              onChange={(e) =>
                setCreateForm({ ...createForm, quantity: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300">Notes / Replenishment Purpose</label>
            <textarea
              rows={2}
              placeholder="e.g. Critical stock depletion for upcoming manufacturing batch"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-lg border border-gray-800 px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
            >
              Submit for Human Approval
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

