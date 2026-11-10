from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.api.dependencies import (
    get_db,
    get_current_user_or_demo,
    require_manager
)
from backend.app.models import User
from backend.app.schemas import SalesOrderResponse, SalesOrderCreate, SalesOrderUpdate
from backend.app.services.order_service import (
    list_sales_orders,
    get_sales_order,
    create_sales_order,
    update_sales_order
)

router = APIRouter(prefix="/orders", tags=["Sales Orders"])

@router.get("", response_model=List[SalesOrderResponse])
def get_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (open, processing, closed, etc.)"),
    search: Optional[str] = Query(None, description="Search by order ID or customer name"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo)
):
    """Retrieve list of sales orders with filtering."""
    return list_sales_orders(db=db, status=status_filter, search=search, limit=limit)

@router.get("/{order_id}", response_model=SalesOrderResponse)
def get_single_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo)
):
    """Inspect single order details."""
    try:
        return get_sales_order(order_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
def create_new_order(
    order_in: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new sales order (Manager/Admin only)."""
    try:
        return create_sales_order(order_in, db, created_by=current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{order_id}", response_model=SalesOrderResponse)
def update_order(
    order_id: str,
    order_in: SalesOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update order status or customer details (Manager/Admin only)."""
    try:
        return update_sales_order(order_id, order_in, db, updated_by=current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

