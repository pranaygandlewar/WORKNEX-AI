from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date

from backend.app.models import SalesOrder, Customer
from backend.app.schemas import SalesOrderResponse, SalesOrderCreate, SalesOrderUpdate
from backend.app.services.audit_service import record_audit

def get_open_sales_orders(status: str = "open", limit: int = 20, db: Session = None) -> List[SalesOrderResponse]:
    """Retrieve open sales orders by status. Compatible with original tool implementation."""
    orders = db.query(SalesOrder).filter(SalesOrder.status == status).limit(limit).all()
    return [
        SalesOrderResponse(
            order_id=order.order_id,
            customer_name=order.customer_name,
            status=order.status,
            order_date=order.order_date,
            total_value=float(order.total_value),
            customer_id=order.customer_id
        )
        for order in orders
    ]

def list_sales_orders(
    db: Session,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
) -> List[SalesOrderResponse]:
    """List sales orders with optional status or search query."""
    query = db.query(SalesOrder)
    if status and status != "all":
        query = query.filter(SalesOrder.status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                SalesOrder.order_id.ilike(search_pattern),
                SalesOrder.customer_name.ilike(search_pattern)
            )
        )
    orders = query.order_by(SalesOrder.order_date.desc()).limit(limit).all()
    return [
        SalesOrderResponse(
            order_id=order.order_id,
            customer_name=order.customer_name,
            status=order.status,
            order_date=order.order_date,
            total_value=float(order.total_value),
            customer_id=order.customer_id
        )
        for order in orders
    ]

def get_sales_order(order_id: str, db: Session) -> SalesOrderResponse:
    """Retrieve a single sales order by ID."""
    order = db.query(SalesOrder).filter(SalesOrder.order_id == order_id).first()
    if not order:
        raise ValueError(f"Sales order {order_id} not found.")
    return SalesOrderResponse(
        order_id=order.order_id,
        customer_name=order.customer_name,
        status=order.status,
        order_date=order.order_date,
        total_value=float(order.total_value),
        customer_id=order.customer_id
    )

def create_sales_order(
    data: SalesOrderCreate,
    db: Session,
    created_by: str = "system"
) -> SalesOrderResponse:
    """Create a new sales order."""
    import uuid
    order_id = data.order_id or f"SO-{uuid.uuid4().hex[:6].upper()}"
    existing = db.query(SalesOrder).filter(SalesOrder.order_id == order_id).first()
    if existing:
        raise ValueError(f"Sales order {order_id} already exists.")

    order = SalesOrder(
        order_id=order_id,
        customer_name=data.customer_name,
        status=data.status,
        order_date=data.order_date or date.today(),
        total_value=data.total_value,
        customer_id=data.customer_id
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    record_audit(
        tool_name="create_sales_order",
        arguments=data.model_dump(mode="json"),
        result=f"Created order {order.order_id} for {order.customer_name} (${order.total_value})",
        actor=created_by,
        action_type="ORDER_CREATE",
        db=db
    )

    return SalesOrderResponse(
        order_id=order.order_id,
        customer_name=order.customer_name,
        status=order.status,
        order_date=order.order_date,
        total_value=float(order.total_value),
        customer_id=order.customer_id
    )

def update_sales_order(
    order_id: str,
    data: SalesOrderUpdate,
    db: Session,
    updated_by: str = "system"
) -> SalesOrderResponse:
    """Update sales order status or details."""
    order = db.query(SalesOrder).filter(SalesOrder.order_id == order_id).first()
    if not order:
        raise ValueError(f"Sales order {order_id} not found.")

    if data.status:
        order.status = data.status
    if data.total_value is not None:
        order.total_value = data.total_value
    if data.customer_name:
        order.customer_name = data.customer_name

    db.commit()
    db.refresh(order)

    record_audit(
        tool_name="update_sales_order",
        arguments={"order_id": order_id, **data.model_dump(exclude_unset=True)},
        result=f"Updated order {order.order_id} status={order.status}",
        actor=updated_by,
        action_type="ORDER_UPDATE",
        db=db
    )

    return SalesOrderResponse(
        order_id=order.order_id,
        customer_name=order.customer_name,
        status=order.status,
        order_date=order.order_date,
        total_value=float(order.total_value),
        customer_id=order.customer_id
    )

