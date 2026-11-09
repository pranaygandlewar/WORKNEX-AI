import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { SalesOrder } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const Orders: React.FC = () => {
  const { hasRole } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    order_id: '',
    customer_name: '',
    status: 'open',
    total_value: 5000.0,
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.orders.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.orders.create({
        ...createForm,
        status: createForm.status as any,
      });
      setIsCreateOpen(false);
      setCreateForm({
        order_id: '',
        customer_name: '',
        status: 'open',
        total_value: 5000.0,
      });
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create sales order');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.orders.update(orderId, { status: newStatus as any });
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update order status');
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st.toLowerCase()) {
      case 'open':
        return <Badge variant="info">● Open</Badge>;
      case 'processing':
        return <Badge variant="warning">⏳ Processing</Badge>;
      case 'completed':
      case 'closed':
        return <Badge variant="success">✓ Closed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">✕ Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{st}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Sales & Order Management</h2>
          <p className="text-xs text-gray-400">
            Real-time fulfillment tracking, customer order accounts, and status management.
          </p>
        </div>

        {hasRole(['Administrator', 'Manager']) && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Create Sales Order</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-800 bg-[#111827]/80 p-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search order ID or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-gray-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          {['all', 'open', 'processing', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
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

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111827]/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-800 bg-gray-900/60 text-gray-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Order ID</th>
                <th className="px-5 py-3 font-semibold">Customer Account</th>
                <th className="px-5 py-3 font-semibold">Order Date</th>
                <th className="px-5 py-3 font-semibold">Order Value</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                {hasRole(['Administrator', 'Manager']) && (
                  <th className="px-5 py-3 font-semibold text-right">Update Status</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Loading sales orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No sales orders found matching your search.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.order_id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-blue-400">
                      {o.order_id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-white">{o.customer_name}</td>
                    <td className="px-5 py-3.5 text-gray-400">{o.order_date}</td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      ${Number(o.total_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(o.status)}</td>
                    {hasRole(['Administrator', 'Manager']) && (
                      <td className="px-5 py-3.5 text-right">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                          className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="open">Open</option>
                          <option value="processing">Processing</option>
                          <option value="closed">Closed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Order */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Sales Order"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300">Order ID (optional, auto-generated)</label>
            <input
              type="text"
              placeholder="e.g. SO-1006"
              value={createForm.order_id}
              onChange={(e) => setCreateForm({ ...createForm, order_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300">Customer Name / Enterprise</label>
            <input
              type="text"
              required
              placeholder="e.g. Cyberdyne Systems"
              value={createForm.customer_name}
              onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300">Total Order Value ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={createForm.total_value}
              onChange={(e) =>
                setCreateForm({ ...createForm, total_value: Number(e.target.value) })
              }
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
              Record Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
