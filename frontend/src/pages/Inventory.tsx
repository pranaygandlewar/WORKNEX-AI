import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  Sliders,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { api } from '../services/api';
import { InventoryItem, InventoryMovement, Warehouse } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const Inventory: React.FC = () => {
  const { hasRole, user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  // Form states
  const [createForm, setCreateForm] = useState({
    material_id: '',
    description: '',
    quantity_on_hand: 100,
    reorder_point: 50,
    warehouse: 'WH-North',
    unit_cost: 25.0,
    category: 'General',
  });

  const [adjustForm, setAdjustForm] = useState({
    change_quantity: 0,
    reason: 'Routine stock reconciliation',
  });
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = onlyLowStock
        ? await api.inventory.getLowStock()
        : await api.inventory.list({
            warehouse: selectedWarehouse || undefined,
            search: search || undefined,
          });
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedWarehouse, onlyLowStock]);

  useEffect(() => {
    const fetchAux = async () => {
      try {
        const whs = await api.inventory.getWarehouses();
        setWarehouses(whs);
      } catch (err) {
        console.error('Failed to fetch warehouses', err);
      }
    };
    fetchAux();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.inventory.create(createForm);
      setIsCreateOpen(false);
      setCreateForm({
        material_id: '',
        description: '',
        quantity_on_hand: 100,
        reorder_point: 50,
        warehouse: 'WH-North',
        unit_cost: 25.0,
        category: 'General',
      });
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create inventory item');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setAdjustError(null);
    try {
      await api.inventory.adjustStock(
        activeItem.material_id,
        Number(adjustForm.change_quantity),
        adjustForm.reason
      );
      setIsAdjustOpen(false);
      fetchInventory();
    } catch (err: any) {
      setAdjustError(err.response?.data?.detail || 'Adjustment rejected');
    }
  };

  const openHistory = async (item: InventoryItem) => {
    setActiveItem(item);
    try {
      const hist = await api.inventory.getMovements({ material_id: item.material_id });
      setMovements(hist);
      setIsHistoryOpen(true);
    } catch (err) {
      console.error('Failed to fetch movements', err);
    }
  };

  const openAdjust = (item: InventoryItem) => {
    setActiveItem(item);
    setAdjustForm({ change_quantity: 0, reason: 'Physical cycle count update' });
    setAdjustError(null);
    setIsAdjustOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Inventory Management</h2>
          <p className="text-xs text-gray-400">
            Real-time multi-warehouse catalog, threshold alerts, and verified stock adjustments.
          </p>
        </div>

        {hasRole(['Administrator', 'Manager']) && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Add Material</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-800 bg-[#111827]/80 p-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search material ID or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-gray-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Warehouse Dropdown */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.warehouse_id} value={w.warehouse_id}>
                {w.name} ({w.warehouse_id})
              </option>
            ))}
          </select>

          {/* Low Stock Toggle Button */}
          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              onlyLowStock
                ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                : 'border-gray-800 bg-gray-900/80 text-gray-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low-Stock Only</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111827]/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-800 bg-gray-900/60 text-gray-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Material ID</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">Warehouse</th>
                <th className="px-5 py-3 font-semibold">On Hand</th>
                <th className="px-5 py-3 font-semibold">Reorder Point</th>
                <th className="px-5 py-3 font-semibold">Unit Cost</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No inventory records found matching your filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.material_id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-white">
                      <span className="font-mono text-blue-400">{item.material_id}</span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-white">{item.description}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-gray-800 px-2 py-0.5 text-[11px] text-gray-300">
                        {item.warehouse}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold">
                      <span
                        className={
                          item.quantity_on_hand < item.reorder_point
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }
                      >
                        {item.quantity_on_hand}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">{item.reorder_point}</td>
                    <td className="px-5 py-3.5 text-gray-300">
                      ${Number(item.unit_cost || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.quantity_on_hand < item.reorder_point ? (
                        <Badge variant="warning">⚠️ Low Stock</Badge>
                      ) : (
                        <Badge variant="success">✓ In Stock</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openHistory(item)}
                          title="Movement History"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        {hasRole(['Administrator', 'Manager']) && (
                          <button
                            onClick={() => openAdjust(item)}
                            title="Stock Adjustment"
                            className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                          >
                            <Sliders className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Item */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Inventory Material"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300">Material ID (e.g. MAT-006)</label>
            <input
              type="text"
              required
              placeholder="MAT-006"
              value={createForm.material_id}
              onChange={(e) => setCreateForm({ ...createForm, material_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300">Description</label>
            <input
              type="text"
              required
              placeholder="High-Purity Silicon Ingot"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300">Initial Quantity</label>
              <input
                type="number"
                min="0"
                required
                value={createForm.quantity_on_hand}
                onChange={(e) =>
                  setCreateForm({ ...createForm, quantity_on_hand: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300">Reorder Threshold</label>
              <input
                type="number"
                min="0"
                required
                value={createForm.reorder_point}
                onChange={(e) =>
                  setCreateForm({ ...createForm, reorder_point: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300">Warehouse Facility</label>
              <select
                value={createForm.warehouse}
                onChange={(e) => setCreateForm({ ...createForm, warehouse: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.warehouse_id} value={w.warehouse_id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-300">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={createForm.unit_cost}
                onChange={(e) =>
                  setCreateForm({ ...createForm, unit_cost: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
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
              Register Material
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Stock */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title={`Adjust Stock — ${activeItem?.material_id}`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div className="rounded-lg bg-gray-900/60 p-3 border border-gray-800">
            <p className="text-gray-400">
              Current Stock on Hand:{' '}
              <span className="font-bold text-white">{activeItem?.quantity_on_hand}</span> units
            </p>
            <p className="text-gray-400">
              Warehouse Facility: <span className="text-blue-400">{activeItem?.warehouse}</span>
            </p>
          </div>

          {adjustError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400">
              {adjustError}
            </div>
          )}

          <div>
            <label className="block text-gray-300">
              Quantity Delta (use negative to decrement, positive to increment)
            </label>
            <input
              type="number"
              required
              value={adjustForm.change_quantity}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, change_quantity: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
            <span className="mt-1 block text-[11px] text-gray-500">
              New Projected Balance:{' '}
              {(activeItem?.quantity_on_hand || 0) + Number(adjustForm.change_quantity)} units
            </span>
          </div>

          <div>
            <label className="block text-gray-300">Business Justification / Reason</label>
            <input
              type="text"
              required
              placeholder="e.g. Broken packaging audit write-off"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="rounded-lg border border-gray-800 px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Movement History */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Movement Traceability — ${activeItem?.material_id}`}
        maxWidth="lg"
      >
        <div className="max-h-96 overflow-y-auto space-y-2 text-xs">
          {movements.length === 0 ? (
            <p className="py-6 text-center text-gray-400">
              No historical movements recorded for this item.
            </p>
          ) : (
            movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-gray-800/80 bg-gray-900/60 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        m.change_quantity >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {m.change_quantity >= 0 ? `+${m.change_quantity}` : m.change_quantity} units
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-300">{m.reason}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Recorded by <span className="text-blue-400">{m.created_by}</span> on{' '}
                    {new Date(m.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-gray-400">Resulting Stock:</span>
                  <p className="font-bold text-white">{m.resulting_quantity}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

