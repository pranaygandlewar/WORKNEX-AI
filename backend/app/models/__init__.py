from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Numeric, Date, DateTime, Boolean, ForeignKey, text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Employee")  # Administrator, Manager, Employee, AI Agent
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Warehouse(Base):
    __tablename__ = "warehouses"

    warehouse_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    manager_name = Column(String(100), nullable=True)
    capacity = Column(Integer, default=10000, nullable=False)

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    material_id = Column(String(50), primary_key=True)
    description = Column(String(255), nullable=False)
    quantity_on_hand = Column(Integer, nullable=False)
    reorder_point = Column(Integer, nullable=False)
    warehouse = Column(String(50), nullable=False)
    unit_cost = Column(Numeric(10, 2), default=0.0, nullable=True)
    category = Column(String(100), default="General", nullable=True)

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    material_id = Column(String(50), ForeignKey("inventory_items.material_id"), nullable=False)
    change_quantity = Column(Integer, nullable=False)
    resulting_quantity = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    created_by = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)

class SalesOrder(Base):
    __tablename__ = "sales_orders"

    order_id = Column(String(50), primary_key=True)
    customer_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)  # open, processing, completed, closed, cancelled
    order_date = Column(Date, nullable=False)
    total_value = Column(Numeric(10, 2), nullable=False)
    customer_id = Column(String(50), nullable=True)

class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(50), ForeignKey("sales_orders.order_id"), nullable=False)
    material_id = Column(String(50), ForeignKey("inventory_items.material_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

class PurchaseRequisition(Base):
    __tablename__ = "purchase_requisitions"

    requisition_id = Column(String(50), primary_key=True)
    material_id = Column(String(50), ForeignKey("inventory_items.material_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    requested_by = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)  # pending_approval, approved, rejected
    approval_token = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String(100), nullable=True)
    notes = Column(String(500), nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tool_name = Column(String(100), nullable=False)
    arguments = Column(String(2000), nullable=False)
    result = Column(String(2000), nullable=False)
    timestamp = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    actor = Column(String(100), nullable=True, default="system")
    action_type = Column(String(50), nullable=True, default="MCP_TOOL")
    status = Column(String(50), nullable=True, default="SUCCESS")

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(50), primary_key=True)
    title = Column(String(255), nullable=False)
    user_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(50), ForeignKey("ai_conversations.id"), nullable=False)
    role = Column(String(50), nullable=False)  # user, assistant, system, tool
    content = Column(String(8000), nullable=False)
    tool_calls = Column(String(4000), nullable=True)
    tool_results = Column(String(4000), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

