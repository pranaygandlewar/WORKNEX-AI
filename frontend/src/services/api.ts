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
  SystemSettings
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('worknex_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle 401 (unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('worknex_token');
      localStorage.removeItem('worknex_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
      } finally {
        localStorage.removeItem('worknex_token');
        localStorage.removeItem('worknex_user');
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
      const res = await apiClient.get('/dashboard/overview');
      return res.data;
    },
    getAnalytics: async () => {
      const res = await apiClient.get('/dashboard/analytics');
      return res.data;
    },
    getActivity: async () => {
      const res = await apiClient.get('/dashboard/activity');
      return res.data;
    },
  },

  // Inventory
  inventory: {
    list: async (params?: { warehouse?: string; search?: string; category?: string }): Promise<InventoryItem[]> => {
      const res = await apiClient.get('/inventory', { params });
      return res.data;
    },
    getLowStock: async (): Promise<InventoryItem[]> => {
      const res = await apiClient.get('/inventory/low-stock');
      return res.data;
    },
    getById: async (material_id: string): Promise<InventoryItem> => {
      const res = await apiClient.get(`/inventory/${material_id}`);
      return res.data;
    },
    create: async (item: Partial<InventoryItem>): Promise<InventoryItem> => {
      const res = await apiClient.post('/inventory', item);
      return res.data;
    },
    update: async (material_id: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
      const res = await apiClient.patch(`/inventory/${material_id}`, item);
      return res.data;
    },
    adjustStock: async (material_id: string, change_quantity: number, reason: string): Promise<InventoryItem> => {
      const res = await apiClient.post(`/inventory/${material_id}/adjust`, { change_quantity, reason });
      return res.data;
    },
    getMovements: async (params?: { material_id?: string; limit?: number }): Promise<InventoryMovement[]> => {
      const res = await apiClient.get('/inventory/movements', { params });
      return res.data;
    },
    getWarehouses: async (): Promise<Warehouse[]> => {
      const res = await apiClient.get('/inventory/warehouses');
      return res.data;
    },
  },

  // Orders
  orders: {
    list: async (params?: { status?: string; search?: string; limit?: number }): Promise<SalesOrder[]> => {
      const res = await apiClient.get('/orders', { params });
      return res.data;
    },
    getById: async (order_id: string): Promise<SalesOrder> => {
      const res = await apiClient.get(`/orders/${order_id}`);
      return res.data;
    },
    create: async (order: Partial<SalesOrder>): Promise<SalesOrder> => {
      const res = await apiClient.post('/orders', order);
      return res.data;
    },
    update: async (order_id: string, order: Partial<SalesOrder>): Promise<SalesOrder> => {
      const res = await apiClient.patch(`/orders/${order_id}`, order);
      return res.data;
    },
  },

  // Procurement
  procurement: {
    list: async (params?: { status?: string }): Promise<PurchaseRequisition[]> => {
      const res = await apiClient.get('/requisitions', { params });
      return res.data;
    },
    getById: async (requisition_id: string): Promise<PurchaseRequisition> => {
      const res = await apiClient.get(`/requisitions/${requisition_id}`);
      return res.data;
    },
    create: async (data: { material_id: string; quantity: number; notes?: string }): Promise<PurchaseRequisition> => {
      const res = await apiClient.post('/requisitions', data);
      return res.data;
    },
    approve: async (requisition_id: string, approval_token?: string): Promise<PurchaseRequisition> => {
      const res = await apiClient.post(`/requisitions/${requisition_id}/approve`, { approval_token });
      return res.data;
    },
    reject: async (requisition_id: string, reason?: string): Promise<PurchaseRequisition> => {
      const res = await apiClient.post(`/requisitions/${requisition_id}/reject`, { reason });
      return res.data;
    },
  },

  // AI Assistant
  ai: {
    chat: async (message: string, conversation_id?: string): Promise<{ conversation_id: string; response: string; tool_executions: ToolExecution[] }> => {
      const res = await apiClient.post('/ai/chat', { message, conversation_id });
      return res.data;
    },
    getConversations: async () => {
      const res = await apiClient.get('/ai/conversations');
      return res.data;
    },
    getConversation: async (conversation_id: string) => {
      const res = await apiClient.get(`/ai/conversations/${conversation_id}`);
      return res.data;
    },
  },

  // Audit
  audit: {
    list: async (params?: { tool_name?: string; actor?: string; status?: string; search?: string; limit?: number }): Promise<AuditLogEntry[]> => {
      const res = await apiClient.get('/audit', { params });
      return res.data;
    },
    getById: async (event_id: number): Promise<AuditLogEntry> => {
      const res = await apiClient.get(`/audit/${event_id}`);
      return res.data;
    },
  },

  // Users
  users: {
    list: async (): Promise<User[]> => {
      const res = await apiClient.get('/users');
      return res.data;
    },
    create: async (userData: any): Promise<User> => {
      const res = await apiClient.post('/users', userData);
      return res.data;
    },
    update: async (user_id: string, userData: any): Promise<User> => {
      const res = await apiClient.patch(`/users/${user_id}`, userData);
      return res.data;
    },
    getRoles: async (): Promise<string[]> => {
      const res = await apiClient.get('/users/roles');
      return res.data;
    },
  },

  // System
  system: {
    health: async (): Promise<SystemHealth> => {
      const res = await apiClient.get('/system/health');
      return res.data;
    },
    settings: async (): Promise<SystemSettings> => {
      const res = await apiClient.get('/system/settings');
      return res.data;
    },
  },
};
