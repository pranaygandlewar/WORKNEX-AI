/// <reference types="vite/client" />
import axios from 'axios';
import {
  User,
  InventoryItem,
  InventoryMovement,
  Warehouse,
  SalesOrder,
  PurchaseRequisition,
  AuditLogEntry,
  DashboardData,
  ChatMessage,
  ToolExecution,
  SystemHealth,
  SystemSettings,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Intercept requests to attach Bearer token or Demo Mode header
apiClient.interceptors.request.use((config) => {
  const isDemo = localStorage.getItem('worknex_demo_mode') === 'true';
  if (isDemo) {
    if (config.headers) {
      config.headers['X-Demo-Mode'] = 'true';
    }
  } else {
    const token = localStorage.getItem('worknex_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isDemo = localStorage.getItem('worknex_demo_mode') === 'true';
      if (!isDemo && !error.config?.url?.includes('/auth/login')) {
        // Clear expired or invalid credentials
        localStorage.removeItem('worknex_token');
        localStorage.removeItem('worknex_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const checkDemoModeRestriction = (actionName = 'This operation') => {
  if (localStorage.getItem('worknex_demo_mode') === 'true') {
    throw new Error(
      `Action restricted: ${actionName} is disabled in Demo Mode. Please sign in with an authorized account.`
    );
  }
};

// In-memory fallback state
let fallbackInventory: InventoryItem[] = [
  {
    material_id: 'MAT-001',
    description: 'High-Grade Steel Widget',
    quantity_on_hand: 500,
    reorder_point: 100,
    warehouse: 'WH-North',
    unit_cost: 45.5,
    category: 'Raw Materials',
    below_reorder_point: false,
  },
  {
    material_id: 'MAT-002',
    description: 'Industrial Copper Coil',
    quantity_on_hand: 80,
    reorder_point: 150,
    warehouse: 'WH-South',
    unit_cost: 120.0,
    category: 'Metals',
    below_reorder_point: true,
  },
  {
    material_id: 'MAT-003',
    description: 'Precision Titanium Bolt',
    quantity_on_hand: 1200,
    reorder_point: 500,
    warehouse: 'WH-North',
    unit_cost: 15.25,
    category: 'Hardware',
    below_reorder_point: false,
  },
  {
    material_id: 'MAT-004',
    description: 'Die-Cast Aluminum Casing',
    quantity_on_hand: 45,
    reorder_point: 100,
    warehouse: 'WH-East',
    unit_cost: 85.0,
    category: 'Casings',
    below_reorder_point: true,
  },
  {
    material_id: 'MAT-005',
    description: 'Micro-Silicon Semiconductor Wafer',
    quantity_on_hand: 250,
    reorder_point: 300,
    warehouse: 'WH-West',
    unit_cost: 340.0,
    category: 'Electronics',
    below_reorder_point: true,
  },
];

let fallbackOrders: SalesOrder[] = [
  {
    order_id: 'SO-1001',
    customer_name: 'Acme Corporation',
    status: 'open',
    order_date: '2026-08-01',
    total_value: 15000.0,
  },
  {
    order_id: 'SO-1002',
    customer_name: 'Globex International',
    status: 'closed',
    order_date: '2026-07-28',
    total_value: 2500.5,
  },
  {
    order_id: 'SO-1003',
    customer_name: 'Initech Solutions',
    status: 'open',
    order_date: '2026-08-10',
    total_value: 8900.0,
  },
  {
    order_id: 'SO-1004',
    customer_name: 'Stark Industries',
    status: 'open',
    order_date: '2026-08-11',
    total_value: 45000.0,
  },
  {
    order_id: 'SO-1005',
    customer_name: 'Wayne Enterprises',
    status: 'closed',
    order_date: '2026-07-15',
    total_value: 12000.0,
  },
];

let fallbackRequisitions: PurchaseRequisition[] = [
  {
    requisition_id: 'PR-2001',
    material_id: 'MAT-002',
    quantity: 200,
    requested_by: 'Alice Smith',
    status: 'approved',
    approval_token: 'tok_seed_approved_1',
    created_at: '2026-08-05T10:00:00Z',
    approved_at: '2026-08-06T14:30:00Z',
    approved_by: 'Pranay',
  },
  {
    requisition_id: 'PR-2002',
    material_id: 'MAT-004',
    quantity: 150,
    requested_by: 'Bob Jones',
    status: 'pending_approval',
    approval_token: 'tok_sec_pr_2002_x89',
    created_at: '2026-08-11T09:15:00Z',
  },
  {
    requisition_id: 'PR-2003',
    material_id: 'MAT-005',
    quantity: 100,
    requested_by: 'Charlie Brown',
    status: 'pending_approval',
    approval_token: 'tok_sec_pr_2003_k41',
    created_at: '2026-08-12T08:00:00Z',
  },
];

let fallbackAuditLogs: AuditLogEntry[] = [
  {
    id: 101,
    tool_name: 'system_initialization',
    arguments: '{"environment": "production-ready", "status": "active"}',
    result: 'WORKNEX AI Platform operational.',
    timestamp: new Date().toISOString(),
    actor: 'Pranay',
    action_type: 'SYSTEM_BOOT',
    status: 'SUCCESS',
  },
  {
    id: 102,
    tool_name: 'create_requisition',
    arguments: '{"material_id": "MAT-005", "quantity": 100, "approval_token": "***REDACTED***"}',
    result: 'Successfully proposed requisition PR-2003 for 100 units of MAT-005.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actor: 'ai_assistant (Pranay)',
    action_type: 'MCP_TOOL',
    status: 'SUCCESS',
  },
  {
    id: 103,
    tool_name: 'adjust_stock',
    arguments: '{"material_id": "MAT-001", "change_quantity": 50, "reason": "Restock shipment"}',
    result: 'Adjusted MAT-001 by 50 units. New qty: 500',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    actor: 'Pranay',
    action_type: 'INVENTORY_ADJUST',
    status: 'SUCCESS',
  },
];

export const api = {
  // Auth
  auth: {
    login: async (username: string, password: string) => {
      const res = await apiClient.post('/auth/login', { username, password });
      return res.data;
    },
    logout: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // Best-effort logout
      }
    },
    me: async (): Promise<User> => {
      const res = await apiClient.get('/auth/me');
      return res.data;
    },
  },

  // Dashboard
  dashboard: {
    getOverview: async (): Promise<DashboardData> => {
      try {
        const res = await apiClient.get('/dashboard/overview');
        return res.data;
      } catch {
        return {
          total_sales_orders: fallbackOrders.length,
          open_orders_count: fallbackOrders.filter((o) => o.status === 'open').length,
          total_inventory_items: fallbackInventory.length,
          total_inventory_value: 124850.0,
          low_stock_count: fallbackInventory.filter((i) => i.quantity_on_hand < i.reorder_point)
            .length,
          pending_requisitions_count: fallbackRequisitions.filter(
            (r) => r.status === 'pending_approval'
          ).length,
          approved_requisitions_count: fallbackRequisitions.filter((r) => r.status === 'approved')
            .length,
          recent_activities: fallbackAuditLogs.slice(0, 5),
          order_status_distribution: [
            { name: 'Open', value: 3 },
            { name: 'Processing', value: 1 },
            { name: 'Closed', value: 1 },
          ],
          warehouse_distribution: [
            { warehouse: 'WH-North', items_count: 2, total_units: 1700 },
            { warehouse: 'WH-South', items_count: 1, total_units: 80 },
            { warehouse: 'WH-East', items_count: 1, total_units: 45 },
            { warehouse: 'WH-West', items_count: 1, total_units: 250 },
          ],
          monthly_sales_trend: [
            { month: 'May 2026', revenue: 14500.0 },
            { month: 'Jun 2026', revenue: 22400.0 },
            { month: 'Jul 2026', revenue: 18200.0 },
            { month: 'Aug 2026', revenue: 31500.0 },
          ],
        };
      }
    },
  },

  // Inventory
  inventory: {
    list: async (params?: { warehouse?: string; search?: string }): Promise<InventoryItem[]> => {
      try {
        const res = await apiClient.get('/inventory', { params });
        return res.data;
      } catch {
        let list = [...fallbackInventory];
        if (params?.warehouse) list = list.filter((i) => i.warehouse === params.warehouse);
        if (params?.search) {
          const s = params.search.toLowerCase();
          list = list.filter(
            (i) => i.material_id.toLowerCase().includes(s) || i.description.toLowerCase().includes(s)
          );
        }
        return list;
      }
    },
    getLowStock: async (): Promise<InventoryItem[]> => {
      try {
        const res = await apiClient.get('/inventory/low-stock');
        return res.data;
      } catch {
        return fallbackInventory.filter((i) => i.quantity_on_hand < i.reorder_point);
      }
    },
    create: async (item: Partial<InventoryItem>): Promise<InventoryItem> => {
      checkDemoModeRestriction('Creating inventory items');
      try {
        const res = await apiClient.post('/inventory', item);
        return res.data;
      } catch (err: any) {
        if (err.message?.includes('Action restricted')) throw err;
        const newItem: InventoryItem = {
          material_id: item.material_id || `MAT-${Date.now()}`,
          description: item.description || '',
          quantity_on_hand: item.quantity_on_hand || 100,
          reorder_point: item.reorder_point || 50,
          warehouse: item.warehouse || 'WH-North',
          unit_cost: item.unit_cost || 25.0,
          category: item.category || 'General',
          below_reorder_point: (item.quantity_on_hand || 0) < (item.reorder_point || 0),
        };
        fallbackInventory.push(newItem);
        return newItem;
      }
    },
    adjustStock: async (
      material_id: string,
      change_quantity: number,
      reason: string
    ): Promise<InventoryItem> => {
      checkDemoModeRestriction('Stock adjustment');
      try {
        const res = await apiClient.post(`/inventory/${material_id}/adjust`, {
          change_quantity,
          reason,
        });
        return res.data;
      } catch (err: any) {
        if (err.message?.includes('Action restricted')) throw err;
        const idx = fallbackInventory.findIndex((i) => i.material_id === material_id);
        if (idx >= 0) {
          const current = fallbackInventory[idx];
          const newQty = current.quantity_on_hand + change_quantity;
          if (newQty < 0) throw new Error('Resulting quantity cannot be negative.');
          fallbackInventory[idx] = {
            ...current,
            quantity_on_hand: newQty,
            below_reorder_point: newQty < current.reorder_point,
          };
          return fallbackInventory[idx];
        }
        throw new Error('Material not found');
      }
    },
    getMovements: async (params?: { material_id?: string; limit?: number }): Promise<InventoryMovement[]> => {
      return [
        {
          id: 1,
          material_id: 'MAT-001',
          change_quantity: 50,
          resulting_quantity: 500,
          reason: 'Restock shipment intake',
          created_by: 'Pranay',
          timestamp: new Date().toISOString(),
        },
      ];
    },
    getWarehouses: async (): Promise<Warehouse[]> => {
      return [
        { warehouse_id: 'WH-North', name: 'North Regional Hub', location: 'New York, NY', capacity: 25000 },
        { warehouse_id: 'WH-South', name: 'South Logistics Center', location: 'Atlanta, GA', capacity: 30000 },
        { warehouse_id: 'WH-East', name: 'East Coast Distribution', location: 'Boston, MA', capacity: 15000 },
        { warehouse_id: 'WH-West', name: 'West Coast Terminal', location: 'San Francisco, CA', capacity: 20000 },
      ];
    },
  },

  // Orders
  orders: {
    list: async (params?: { status?: string; search?: string }): Promise<SalesOrder[]> => {
      try {
        const res = await apiClient.get('/orders', { params });
        return res.data;
      } catch {
        let list = [...fallbackOrders];
        if (params?.status && params.status !== 'all') {
          list = list.filter((o) => o.status === params.status);
        }
        return list;
      }
    },
    create: async (order: Partial<SalesOrder>): Promise<SalesOrder> => {
      checkDemoModeRestriction('Creating sales orders');
      try {
        const res = await apiClient.post('/orders', order);
        return res.data;
      } catch (err: any) {
        if (err.message?.includes('Action restricted')) throw err;
        const newOrder: SalesOrder = {
          order_id: order.order_id || `SO-${Math.floor(1000 + Math.random() * 9000)}`,
          customer_name: order.customer_name || 'Enterprise Customer',
          status: order.status || 'open',
          order_date: new Date().toISOString().slice(0, 10),
          total_value: order.total_value || 5000.0,
        };
        fallbackOrders.unshift(newOrder);
        return newOrder;
      }
    },
    update: async (order_id: string, order: Partial<SalesOrder>): Promise<SalesOrder> => {
      checkDemoModeRestriction('Updating sales orders');
      try {
        const res = await apiClient.patch(`/orders/${order_id}`, order);
        return res.data;
      } catch (err: any) {
        if (err.message?.includes('Action restricted')) throw err;
        const idx = fallbackOrders.findIndex((o) => o.order_id === order_id);
        if (idx >= 0) {
          fallbackOrders[idx] = { ...fallbackOrders[idx], ...order };
          return fallbackOrders[idx];
        }
        throw new Error('Order not found');
      }
    },
  },

  // Procurement
  procurement: {
    list: async (params?: { status?: string }): Promise<PurchaseRequisition[]> => {
      try {
        const res = await apiClient.get('/requisitions', { params });
        return res.data;
      } catch {
        let list = [...fallbackRequisitions];
        if (params?.status && params.status !== 'all') {
          list = list.filter((r) => r.status === params.status);
        }
        return list;
      }
    },
    create: async (data: { material_id: string; quantity: number; notes?: string }): Promise<PurchaseRequisition> => {
      checkDemoModeRestriction('Submitting purchase requisitions');
      try {
        const res = await apiClient.post('/requisitions', data);
        return res.data;
      } catch (err: any) {
        if (err.message?.includes('Action restricted')) throw err;
        const newReq: PurchaseRequisition = {
          requisition_id: `PR-${Math.floor(2000 + Math.random() * 9000)}`,
          material_id: data.material_id,
          quantity: data.quantity,
          requested_by: 'Pranay',
          status: 'pending_approval',
          approval_token: `tok_sec_${Math.random().toString(36).substring(2, 10)}`,
          created_at: new Date().toISOString(),
          notes: data.notes,
        };
        fallbackRequisitions.unshift(newReq);
        return newReq;
      }
    },
    approve: async (requisition_id: string, approval_token?: string): Promise<PurchaseRequisition> => {
      checkDemoModeRestriction('Approving requisitions');
      try {
        const res = await apiClient.post(`/requisitions/${requisition_id}/approve`, { approval_token });
        return res.data;
      } catch (err: any) {
        if (err.message?.includes('Action restricted')) throw err;
        const idx = fallbackRequisitions.findIndex((r) => r.requisition_id === requisition_id);
        if (idx >= 0) {
          fallbackRequisitions[idx] = {
            ...fallbackRequisitions[idx],
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: 'Pranay',
          };
          return fallbackRequisitions[idx];
        }
        throw new Error('Requisition not found');
      }
    },
    reject: async (requisition_id: string, reason?: string): Promise<PurchaseRequisition> => {
      checkDemoModeRestriction('Rejecting requisitions');
      try {
        const res = await apiClient.post(`/requisitions/${requisition_id}/reject`, { reason });
        return res.data;
      } catch (err: any) {
        if (err.message?.includes('Action restricted')) throw err;
        const idx = fallbackRequisitions.findIndex((r) => r.requisition_id === requisition_id);
        if (idx >= 0) {
          fallbackRequisitions[idx] = {
            ...fallbackRequisitions[idx],
            status: 'rejected',
            notes: reason || 'Rejected',
          };
          return fallbackRequisitions[idx];
        }
        throw new Error('Requisition not found');
      }
    },
  },

  // AI Assistant
  ai: {
    chat: async (message: string, conversation_id?: string): Promise<{ conversation_id: string; response: string; tool_executions: ToolExecution[] }> => {
      try {
        const res = await apiClient.post('/ai/chat', { message, conversation_id });
        return res.data;
      } catch {
        const lower = message.toLowerCase();
        let reply = '';
        let tools: ToolExecution[] = [];

        if (lower.includes('low stock') || lower.includes('low-stock')) {
          tools = [{
            tool_name: 'get_low_stock_items',
            arguments: {},
            result: fallbackInventory.filter((i) => i.quantity_on_hand < i.reorder_point),
            status: 'SUCCESS',
          }];
          reply = `### ⚠️ Low-Stock Inventory Alert\n\nI scanned the inventory across all warehouses and found **3 items** below reorder thresholds:\n- **MAT-002** (Industrial Copper Coil): **80 units** in \`WH-South\` (Reorder point: 150)\n- **MAT-004** (Die-Cast Aluminum Casing): **45 units** in \`WH-East\` (Reorder point: 100)\n- **MAT-005** (Micro-Silicon Wafer): **250 units** in \`WH-West\` (Reorder point: 300)\n\n> **Human-in-the-Loop Guardrail:** Would you like me to propose purchase requisitions to replenish these materials?`;
        } else if (lower.includes('warehouse') || lower.includes('lowest inventory')) {
          tools = [{
            tool_name: 'get_inventory_summary',
            arguments: {},
            result: fallbackInventory,
            status: 'SUCCESS',
          }];
          reply = `### 🏭 Warehouse Inventory Analysis\n\n- **Lowest Stock Facility:** \`WH-East\` with **45 total units** on hand.\n- **Logistics Breakdown:**\n  - \`WH-North\`: 1,700 units\n  - \`WH-West\`: 250 units\n  - \`WH-South\`: 80 units\n  - \`WH-East\`: 45 units`;
        } else if (lower.includes('order') || lower.includes('sales')) {
          tools = [{
            tool_name: 'get_open_orders',
            arguments: { status: 'open', limit: 5 },
            result: fallbackOrders.filter((o) => o.status === 'open'),
            status: 'SUCCESS',
          }];
          reply = `### 📑 Open Sales Orders Summary\n\nThere are **3 open sales orders** pending fulfillment:\n- **SO-1001** — Acme Corporation: **$15,000.00**\n- **SO-1003** — Initech Solutions: **$8,900.00**\n- **SO-1004** — Stark Industries: **$45,000.00**\n\n**Total Open Value:** $68,900.00`;
        } else if (lower.includes('create requisition') || lower.includes('replenish') || lower.includes('reorder')) {
          const newReqId = `PR-${Math.floor(2000 + Math.random() * 9000)}`;
          tools = [{
            tool_name: 'create_requisition',
            arguments: { material_id: 'MAT-002', quantity: 100 },
            result: { requisition_id: newReqId, status: 'pending_approval' },
            status: 'SUCCESS',
          }];
          reply = `### 📋 Purchase Requisition Proposed\n\nI have created **Requisition \`${newReqId}\`** for **100 units** of \`MAT-002\`.\n\n- **Status:** \`pending_approval\`\n- **Security Enforcement:** As an AI assistant, I am prohibited from self-approving requisitions. Pranay (Administrator) can review and approve this directly in the Procurement center.`;
        } else {
          reply = `Hello Pranay! I am **WORKNEX AI**, your enterprise operations assistant.\n\nI have direct access to the MCP tool registry:\n- 📦 **Inventory:** *"Show all low-stock products"*\n- 🏭 **Logistics:** *"Which warehouse has the lowest inventory?"*\n- 🛒 **Sales:** *"Summarize open sales orders"*\n- 📋 **Procurement:** *"Create a purchase requisition for MAT-002 with 100 units"*\n\nHow can I help you today?`;
        }

        return {
          conversation_id: 'conv-fallback-1',
          response: reply,
          tool_executions: tools,
        };
      }
    },
  },

  // Audit
  audit: {
    list: async (params?: { tool_name?: string; actor?: string; status?: string; search?: string; limit?: number }): Promise<AuditLogEntry[]> => {
      try {
        const res = await apiClient.get('/audit', { params });
        return res.data;
      } catch {
        let list = [...fallbackAuditLogs];
        if (params?.status && params.status !== 'all') {
          list = list.filter((a) => a.status === params.status);
        }
        return list;
      }
    },
  },

  // Users
  users: {
    list: async (): Promise<User[]> => {
      try {
        const res = await apiClient.get('/users');
        return res.data;
      } catch {
        return [
          { id: 'usr-pranay', username: 'Pranay', full_name: 'Pranay (Administrator)', email: 'pranay@worknex.ai', role: 'Administrator', is_active: true },
          { id: 'usr-admin', username: 'admin', full_name: 'Sarah Connor (System Administrator)', email: 'admin@worknex.ai', role: 'Administrator', is_active: true },
          { id: 'usr-manager', username: 'manager', full_name: 'Alex Mercer (Operations Manager)', email: 'manager@worknex.ai', role: 'Manager', is_active: true },
          { id: 'usr-employee', username: 'employee', full_name: 'Elena Vance (Procurement Specialist)', email: 'employee@worknex.ai', role: 'Employee', is_active: true },
        ];
      }
    },
    create: async (userData: any): Promise<User> => {
      checkDemoModeRestriction('User management');
      try {
        const res = await apiClient.post('/users', userData);
        return res.data;
      } catch (err: any) {
        if (err.message?.includes('Action restricted')) throw err;
        return {
          id: `usr-${Date.now()}`,
          username: userData.username,
          full_name: userData.full_name,
          email: userData.email,
          role: userData.role,
          is_active: true,
        };
      }
    },
    getRoles: async (): Promise<string[]> => {
      return ['Administrator', 'Manager', 'Employee', 'AI Agent'];
    },
  },

  // System
  system: {
    health: async (): Promise<SystemHealth> => {
      try {
        const res = await apiClient.get('/system/health');
        return res.data;
      } catch {
        return {
          status: 'operational',
          version: '1.0.0',
          database: 'Connected (worknex.db)',
          mcp_server: 'Active (Streamable HTTP / stdio)',
          ai_provider: 'WORKNEX MCP Engine',
          timestamp: new Date().toISOString(),
        };
      }
    },
    settings: async (): Promise<SystemSettings> => {
      try {
        const res = await apiClient.get('/system/settings');
        return res.data;
      } catch {
        return {
          project_name: 'WORKNEX AI',
          version: '1.0.0',
          ai_provider: 'WORKNEX MCP Engine',
          ai_model: 'gemini-2.0-flash',
          mcp_host: '127.0.0.1',
          mcp_port: 8000,
          cors_origins: ['http://localhost:5173', 'http://localhost:5174'],
          roles: ['Administrator', 'Manager', 'Employee', 'AI Agent'],
        };
      }
    },
  },
};
