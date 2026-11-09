from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Any
from datetime import date, datetime

# --- Auth & User Schemas ---
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = "Employee"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: Optional[datetime] = None

# --- Inventory Schemas ---
class InventoryCheckResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    material_id: str
    description: str
    quantity_on_hand: int
    reorder_point: int
    warehouse: str
    unit_cost: Optional[float] = 0.0
    category: Optional[str] = "General"
    below_reorder_point: bool = False

class InventoryItemCreate(BaseModel):
    material_id: str
    description: str
    quantity_on_hand: int = Field(..., ge=0)
    reorder_point: int = Field(..., ge=0)
    warehouse: str
    unit_cost: Optional[float] = 0.0
    category: Optional[str] = "General"

class InventoryItemUpdate(BaseModel):
    description: Optional[str] = None
    reorder_point: Optional[int] = Field(None, ge=0)
    warehouse: Optional[str] = None
    unit_cost: Optional[float] = None
    category: Optional[str] = None

class InventoryAdjustRequest(BaseModel):
    change_quantity: int
    reason: str

class InventoryMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    material_id: str
    change_quantity: int
    resulting_quantity: int
    reason: str
    created_by: str
    timestamp: datetime

class WarehouseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    warehouse_id: str
    name: str
    location: str
    manager_name: Optional[str] = None
    capacity: int

# --- Sales & Order Schemas ---
class SalesOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    order_id: str
    customer_name: str
    status: str
    order_date: date
    total_value: float
    customer_id: Optional[str] = None

class SalesOrderCreate(BaseModel):
    order_id: Optional[str] = None
    customer_name: str
    status: str = "open"
    order_date: Optional[date] = None
    total_value: float = Field(..., ge=0.0)
    customer_id: Optional[str] = None

class SalesOrderUpdate(BaseModel):
    status: Optional[str] = None
    total_value: Optional[float] = None
    customer_name: Optional[str] = None

# --- Procurement Schemas ---
class PurchaseRequisitionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    requisition_id: str
    material_id: str
    quantity: int
    requested_by: str
    status: str
    approval_token: Optional[str] = None
    created_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    notes: Optional[str] = None

class RequisitionCreateRequest(BaseModel):
    material_id: str
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None

class RequisitionApproveRequest(BaseModel):
    approval_token: Optional[str] = None

class RequisitionRejectRequest(BaseModel):
    reason: Optional[str] = None

# --- Audit Log Schemas ---
class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tool_name: str
    arguments: str
    result: str
    timestamp: datetime
    actor: Optional[str] = "system"
    action_type: Optional[str] = "MCP_TOOL"
    status: Optional[str] = "SUCCESS"

# --- Dashboard Schemas ---
class DashboardOverview(BaseModel):
    total_sales_orders: int
    open_orders_count: int
    total_inventory_items: int
    total_inventory_value: float
    low_stock_count: int
    pending_requisitions_count: int
    approved_requisitions_count: int
    recent_activities: List[Any]
    order_status_distribution: List[dict]
    warehouse_distribution: List[dict]
    monthly_sales_trend: List[dict]

# --- AI Schemas ---
class AIChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ToolExecutionInfo(BaseModel):
    tool_name: str
    arguments: dict
    result: Any
    status: str

class AIChatResponse(BaseModel):
    conversation_id: str
    response: str
    tool_executions: List[ToolExecutionInfo] = []

class AIMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    conversation_id: str
    role: str
    content: str
    tool_calls: Optional[str] = None
    tool_results: Optional[str] = None
    timestamp: datetime

class AIConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    created_at: datetime
    messages: List[AIMessageResponse] = []

# --- System Schemas ---
class SystemHealthResponse(BaseModel):
    status: str
    version: str
    database: str
    mcp_server: str
    ai_provider: str
    timestamp: datetime

class SystemSettingsResponse(BaseModel):
    project_name: str
    version: str
    ai_provider: str
    ai_model: str
    mcp_host: str
    mcp_port: int
    cors_origins: List[str]
    roles: List[str]

