import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Boxes,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.dashboard.getOverview();
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard overview', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/20 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Operational Intelligence
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">
              Enterprise Dashboard & MCP Agent Hub
            </h2>
            <p className="mt-1 text-xs text-gray-300">
              Real-time monitoring across sales, multi-facility warehouse stock, and automated procurement approvals.
            </p>
          </div>
          <Link
            to="/ai-assistant"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500"
          >
            <span>Ask AI Assistant</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales Orders"
          value={data?.total_sales_orders || 0}
          subtitle={`${data?.open_orders_count || 0} currently open/processing`}
          icon={ShoppingCart}
          variant="blue"
        />
        <StatCard
          title="Total Inventory Value"
          value={`$${(data?.total_inventory_value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle={`${data?.total_inventory_items || 0} materials across warehouses`}
          icon={Boxes}
          variant="emerald"
        />
        <StatCard
          title="Low-Stock Alerts"
          value={data?.low_stock_count || 0}
          subtitle="Materials below reorder threshold"
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="Pending Approvals"
          value={data?.pending_requisitions_count || 0}
          subtitle={`${data?.approved_requisitions_count || 0} approved to date`}
          icon={FileCheck}
          variant="indigo"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Revenue Trend Chart */}
        <div className="rounded-xl border border-gray-800 bg-[#111827]/80 p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Sales Pipeline</h3>
              <p className="text-xs text-gray-400">Order revenue trends over time</p>
            </div>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_sales_trend || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown Chart */}
        <div className="rounded-xl border border-gray-800 bg-[#111827]/80 p-5">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Order Status Mix</h3>
              <p className="text-xs text-gray-400">Distribution of sales orders</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.order_status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data?.order_status_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {(data?.order_status_distribution || []).map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span>
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warehouse Logistics & Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Warehouse Units BarChart */}
        <div className="rounded-xl border border-gray-800 bg-[#111827]/80 p-5">
          <h3 className="text-sm font-semibold text-white">Warehouse Inventory Levels</h3>
          <p className="text-xs text-gray-400">Physical units per facility</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.warehouse_distribution || []}>
                <XAxis dataKey="warehouse" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total_units" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Audit Activity Log */}
        <div className="rounded-xl border border-gray-800 bg-[#111827]/80 p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Business Activities</h3>
              <p className="text-xs text-gray-400">Real-time append-only compliance trail</p>
            </div>
            <Link
              to="/audit"
              className="text-xs font-medium text-blue-400 hover:text-blue-300"
            >
              View Full Audit Trail →
            </Link>
          </div>

          <div className="divide-y divide-gray-800 overflow-hidden rounded-lg border border-gray-800/80">
            {data?.recent_activities && data.recent_activities.length > 0 ? (
              data.recent_activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-center justify-between p-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-gray-800 p-1.5 text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {act.tool_name} <span className="font-normal text-gray-400">by</span>{' '}
                        <span className="text-blue-400">{act.actor}</span>
                      </p>
                      <p className="text-[11px] text-gray-400">{act.result}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={act.status === 'SUCCESS' ? 'success' : 'danger'}>
                      {act.status}
                    </Badge>
                    <span className="text-[11px] text-gray-400">
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-gray-400">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

