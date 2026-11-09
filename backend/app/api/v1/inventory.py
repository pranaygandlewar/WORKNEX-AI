from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.api.dependencies import (
    get_db,
    require_authenticated,
    require_manager
)
from backend.app.models import User
from backend.app.schemas import (
    InventoryCheckResponse,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryAdjustRequest,
    InventoryMovementResponse,
    WarehouseResponse
)
from backend.app.services.inventory_service import (
    check_inventory_level,
    list_low_stock_items,
    list_all_inventory,
    create_inventory_item,
    update_inventory_item,
    adjust_stock,
    get_inventory_movements,
    list_warehouses
)

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

@router.get("", response_model=List[InventoryCheckResponse])
def get_inventory_list(
    warehouse: Optional[str] = Query(None, description="Filter by warehouse ID"),
    search: Optional[str] = Query(None, description="Search by material ID or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """List all inventory items with optional search and warehouse filters."""
    return list_all_inventory(db=db, warehouse=warehouse, search=search, category=category)

@router.get("/low-stock", response_model=List[InventoryCheckResponse])
def get_low_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """Retrieve all materials where quantity_on_hand is strictly below reorder_point."""
    return list_low_stock_items(db)

@router.get("/movements", response_model=List[InventoryMovementResponse])
def get_movements(
    material_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """Retrieve historical inventory movements for traceability."""
    return get_inventory_movements(db=db, material_id=material_id, limit=limit)

@router.get("/warehouses", response_model=List[WarehouseResponse])
def get_warehouses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """List all warehouse facilities."""
    return list_warehouses(db)

@router.get("/{material_id}", response_model=InventoryCheckResponse)
def get_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """Inspect inventory levels for a specific material."""
    try:
        return check_inventory_level(material_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("", response_model=InventoryCheckResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item_in: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new material item (Manager/Admin only)."""
    try:
        return create_inventory_item(item_in, db, created_by=current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{material_id}", response_model=InventoryCheckResponse)
def update_item(
    material_id: str,
    item_in: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update material description, warehouse, or reorder threshold (Manager/Admin only)."""
    try:
        return update_inventory_item(material_id, item_in, db, updated_by=current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{material_id}/adjust", response_model=InventoryCheckResponse)
def adjust_inventory_stock(
    material_id: str,
    adjust_in: InventoryAdjustRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Perform authorized manual stock adjustment (Manager/Admin only). Prevents negative inventory."""
    try:
        return adjust_stock(
            material_id=material_id,
            change_quantity=adjust_in.change_quantity,
            reason=adjust_in.reason,
            db=db,
            created_by=current_user.username
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

