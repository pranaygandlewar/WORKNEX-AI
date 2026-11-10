import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, Shield, UserCheck, Key, Lock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const Users: React.FC = () => {
  const { hasRole, isDemoMode } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'Employee',
  });

  const fetchUsers = async () => {
    if (isDemoMode || !hasRole(['Administrator'])) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (!isDemoMode && hasRole(['Administrator'])) {
      api.users.getRoles().then(setRoles).catch(console.error);
    }
  }, [isDemoMode]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.users.create(createForm);
      setIsCreateOpen(false);
      setCreateForm({ username: '', email: '', full_name: '', password: '', role: 'Employee' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register user');
    }
  };

  if (isDemoMode || !hasRole(['Administrator'])) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-800 bg-[#111827]/80 p-12 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Shield className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-white">Access Restricted — Administrator Clearance Required</h3>
        <p className="text-xs text-gray-400 max-w-md leading-relaxed">
          User identity management, role provisioning, and password updates are guarded by strict role-based access control (RBAC). In public Demo Mode, user management is disabled to protect system credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">User & Access Management (RBAC)</h2>
          <p className="text-xs text-gray-400">
            Enterprise identity management, permission enforcement, and Argon2 password hashing.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>Add System User</span>
        </button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            role: 'Administrator',
            desc: 'Unrestricted system configuration, RBAC, approval, and audit visibility.',
            count: users.filter((u) => u.role === 'Administrator').length,
            color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
          },
          {
            role: 'Manager',
            desc: 'Operational management, stock adjustments, and requisition approvals.',
            count: users.filter((u) => u.role === 'Manager').length,
            color: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
          },
          {
            role: 'Employee',
            desc: 'Inventory catalog visibility and purchase requisition submission.',
            count: users.filter((u) => u.role === 'Employee').length,
            color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
          },
          {
            role: 'AI Agent',
            desc: 'Authorized MCP tool invocation without self-approval permissions.',
            count: users.filter((u) => u.role === 'AI Agent').length,
            color: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
          },
        ].map((r) => (
          <div
            key={r.role}
            className="rounded-xl border border-gray-800 bg-[#111827]/80 p-4 transition-all hover:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs">{r.role}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.color}`}>
                {r.count} users
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111827]/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-800 bg-gray-900/60 text-gray-400">
              <tr>
                <th className="px-5 py-3 font-semibold">User ID</th>
                <th className="px-5 py-3 font-semibold">Username</th>
                <th className="px-5 py-3 font-semibold">Full Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Assigned Role</th>
                <th className="px-5 py-3 font-semibold">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Loading users directory...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-gray-500">{u.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-white">{u.username}</td>
                    <td className="px-5 py-3.5 text-gray-200">{u.full_name}</td>
                    <td className="px-5 py-3.5 text-gray-400">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          u.role === 'Administrator'
                            ? 'brand'
                            : u.role === 'Manager'
                            ? 'info'
                            : u.role === 'AI Agent'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Enterprise User"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. jsmith"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Smith"
              value={createForm.full_name}
              onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300">Corporate Email</label>
            <input
              type="email"
              required
              placeholder="e.g. jsmith@worknex.ai"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300">Initial Password (Argon2 Hashed)</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300">Role & Security Privileges</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
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
              Save Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

