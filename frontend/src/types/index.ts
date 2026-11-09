export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'Administrator' | 'Manager' | 'Employee' | 'AI Agent';
  is_active: boolean;
  created_at?: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface InventoryItem {
  material_id: string;
  description: string;
  quantity_on_hand: number;
  reorder_point: number;
  warehouse: string;
  unit_cost: number;
  category: string;
  below_reorder_point: boolean;
}

export interface InventoryMovement {
  id: number;
  material_id: string;
  change_quantity: number;
  resulting_quantity: number;
  reason: string;
  created_by: string;
  timestamp: string;
}

export interface Warehouse {
  warehouse_id: string;
  name: string;
  location: string;
  manager_name?: string;
  capacity: number;
}

export interface SalesOrder {
  order_id: string;
  customer_name: string;
  status: 'open' | 'processing' | 'completed' | 'closed' | 'cancelled';
  order_date: string;
  total_value: number;
  customer_id?: string;
}

export interface PurchaseRequisition {
  requisition_id: string;
  material_id: string;
  quantity: number;
  requested_by: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  approval_token?: string;
  created_at?: string;
  approved_at?: string;
  approved_by?: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: number;
  tool_name: string;
  arguments: string;
  result: string;
  timestamp: string;
  actor: string;
  action_type: string;
  status: string;
}

export interface DashboardData {
  total_sales_orders: number;
  open_orders_count: number;
  total_inventory_items: number;
  total_inventory_value: number;
  low_stock_count: number;
  pending_requisitions_count: number;
  approved_requisitions_count: number;
  recent_activities: Array<{
    id: number;
    tool_name: string;
    actor: string;
    action_type: string;
    status: string;
    result: string;
    timestamp: string;
  }>;
  order_status_distribution: Array<{ name: string; value: number }>;
  warehouse_distribution: Array<{ warehouse: string; items_count: number; total_units: number }>;
  monthly_sales_trend: Array<{ month: string; revenue: number }>;
}

export interface ToolExecution {
  tool_name: string;
  arguments: Record<string, any>;
  result: any;
  status: string;
}

export interface ChatMessage {
  id?: string | number;
  role: 'user' | 'assistant';
  content: string;
  tool_executions?: ToolExecution[];
  timestamp: string;
}

export interface SystemHealth {
  status: string;
  version: string;
  database: string;
  mcp_server: string;
  ai_provider: string;
  timestamp: string;
}

export interface SystemSettings {
  project_name: string;
  version: string;
  ai_provider: string;
  ai_model: string;
  mcp_host: string;
  mcp_port: number;
  cors_origins: string[];
  roles: string[];
}

