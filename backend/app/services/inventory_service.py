from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models import InventoryItem, InventoryMovement, Warehouse
from backend.app.schemas import (
    InventoryCheckResponse,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryMovementResponse,
    WarehouseResponse
)
from backend.app.services.audit_service import record_audit

def check_inventory_level(material_id: str, db: Session) -> InventoryCheckResponse:
    """Check inventory level for a given material_id."""
    item = db.query(InventoryItem).filter(InventoryItem.material_id == material_id).first()
    if not item:
        raise ValueError(f"Material {material_id} not found")
        
    return InventoryCheckResponse(
        material_id=item.material_id,
        description=item.description,
        quantity_on_hand=item.quantity_on_hand,
        reorder_point=item.reorder_point,
        warehouse=item.warehouse,
        unit_cost=float(item.unit_cost) if item.unit_cost is not None else 0.0,
        category=item.category or "General",
        below_reorder_point=item.quantity_on_hand < item.reorder_point
    )

def list_low_stock_items(db: Session) -> List[InventoryCheckResponse]:
    """List all inventory items below their reorder threshold."""
    items = db.query(InventoryItem).filter(InventoryItem.quantity_on_hand < InventoryItem.reorder_point).all()
    return [
        InventoryCheckResponse(
            material_id=item.material_id,
            description=item.description,
            quantity_on_hand=item.quantity_on_hand,
            reorder_point=item.reorder_point,
            warehouse=item.warehouse,
            unit_cost=float(item.unit_cost) if item.unit_cost is not None else 0.0,
            category=item.category or "General",
            below_reorder_point=True
        )
        for item in items
    ]

def list_all_inventory(
    db: Session,
    warehouse: Optional[str] = None,
    search: Optional[str] = None,
    category: Optional[str] = None
) -> List[InventoryCheckResponse]:
    """List all inventory items with optional filters."""
    query = db.query(InventoryItem)
    if warehouse:
        query = query.filter(InventoryItem.warehouse == warehouse)
    if category:
        query = query.filter(InventoryItem.category == category)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                InventoryItem.material_id.ilike(search_pattern),
                InventoryItem.description.ilike(search_pattern),
                InventoryItem.warehouse.ilike(search_pattern)
            )
        )
    items = query.all()
    return [
        InventoryCheckResponse(
            material_id=item.material_id,
            description=item.description,
            quantity_on_hand=item.quantity_on_hand,
            reorder_point=item.reorder_point,
            warehouse=item.warehouse,
            unit_cost=float(item.unit_cost) if item.unit_cost is not None else 0.0,
            category=item.category or "General",
            below_reorder_point=item.quantity_on_hand < item.reorder_point
        )
        for item in items
    ]

def create_inventory_item(
    data: InventoryItemCreate,
    db: Session,
    created_by: str = "system"
) -> InventoryCheckResponse:
    """Create a new inventory item with initial stock movement recording."""
    existing = db.query(InventoryItem).filter(InventoryItem.material_id == data.material_id).first()
    if existing:
        raise ValueError(f"Material {data.material_id} already exists.")
        
    item = InventoryItem(
        material_id=data.material_id,
        description=data.description,
        quantity_on_hand=data.quantity_on_hand,
        reorder_point=data.reorder_point,
        warehouse=data.warehouse,
        unit_cost=data.unit_cost,
        category=data.category
    )
    db.add(item)
    db.flush()

    # Record initial inventory movement if quantity > 0
    if data.quantity_on_hand > 0:
        movement = InventoryMovement(
            material_id=item.material_id,
            change_quantity=data.quantity_on_hand,
            resulting_quantity=data.quantity_on_hand,
            reason="Initial inventory creation",
            created_by=created_by,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(movement)

    db.commit()
    db.refresh(item)
    
    record_audit(
        tool_name="create_inventory_item",
        arguments=data.model_dump(),
        result=f"Created material {item.material_id} with qty {item.quantity_on_hand}",
        actor=created_by,
        action_type="INVENTORY_CREATE",
        db=db
    )

    return InventoryCheckResponse(
        material_id=item.material_id,
        description=item.description,
        quantity_on_hand=item.quantity_on_hand,
        reorder_point=item.reorder_point,
        warehouse=item.warehouse,
        unit_cost=float(item.unit_cost) if item.unit_cost is not None else 0.0,
        category=item.category or "General",
        below_reorder_point=item.quantity_on_hand < item.reorder_point
    )

def update_inventory_item(
    material_id: str,
    data: InventoryItemUpdate,
    db: Session,
    updated_by: str = "system"
) -> InventoryCheckResponse:
    """Update metadata for an inventory item."""
    item = db.query(InventoryItem).filter(InventoryItem.material_id == material_id).first()
    if not item:
        raise ValueError(f"Material {material_id} not found.")

    if data.description is not None:
        item.description = data.description
    if data.reorder_point is not None:
        item.reorder_point = data.reorder_point
    if data.warehouse is not None:
        item.warehouse = data.warehouse
    if data.unit_cost is not None:
        item.unit_cost = data.unit_cost
    if data.category is not None:
        item.category = data.category

    db.commit()
    db.refresh(item)

    record_audit(
        tool_name="update_inventory_item",
        arguments={"material_id": material_id, **data.model_dump(exclude_unset=True)},
        result=f"Updated material {item.material_id}",
        actor=updated_by,
        action_type="INVENTORY_UPDATE",
        db=db
    )

    return InventoryCheckResponse(
        material_id=item.material_id,
        description=item.description,
        quantity_on_hand=item.quantity_on_hand,
        reorder_point=item.reorder_point,
        warehouse=item.warehouse,
        unit_cost=float(item.unit_cost) if item.unit_cost is not None else 0.0,
        category=item.category or "General",
        below_reorder_point=item.quantity_on_hand < item.reorder_point
    )

def adjust_stock(
    material_id: str,
    change_quantity: int,
    reason: str,
    db: Session,
    created_by: str = "system"
) -> InventoryCheckResponse:
    """Adjust stock level up or down. Rejects any adjustment leading to negative stock."""
    item = db.query(InventoryItem).filter(InventoryItem.material_id == material_id).first()
    if not item:
        raise ValueError(f"Material {material_id} not found.")

    new_quantity = item.quantity_on_hand + change_quantity
    if new_quantity < 0:
        raise ValueError(
            f"Adjustment rejected: Resulting quantity ({new_quantity}) cannot be negative. "
            f"Current stock: {item.quantity_on_hand}, Requested change: {change_quantity}."
        )

    item.quantity_on_hand = new_quantity
    movement = InventoryMovement(
        material_id=item.material_id,
        change_quantity=change_quantity,
        resulting_quantity=new_quantity,
        reason=reason,
        created_by=created_by,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(movement)
    db.commit()
    db.refresh(item)

    record_audit(
        tool_name="adjust_stock",
        arguments={
            "material_id": material_id,
            "change_quantity": change_quantity,
            "reason": reason
        },
        result=f"Adjusted {material_id} by {change_quantity}. New qty: {new_quantity}",
        actor=created_by,
        action_type="INVENTORY_ADJUST",
        db=db
    )

    return InventoryCheckResponse(
        material_id=item.material_id,
        description=item.description,
        quantity_on_hand=item.quantity_on_hand,
        reorder_point=item.reorder_point,
        warehouse=item.warehouse,
        unit_cost=float(item.unit_cost) if item.unit_cost is not None else 0.0,
        category=item.category or "General",
        below_reorder_point=item.quantity_on_hand < item.reorder_point
    )

def get_inventory_movements(
    db: Session,
    material_id: Optional[str] = None,
    limit: int = 50
) -> List[InventoryMovementResponse]:
    """Retrieve inventory movements, ordered by timestamp desc."""
    query = db.query(InventoryMovement)
    if material_id:
        query = query.filter(InventoryMovement.material_id == material_id)
    movements = query.order_by(InventoryMovement.timestamp.desc()).limit(limit).all()
    return [InventoryMovementResponse.model_validate(m) for m in movements]

def list_warehouses(db: Session) -> List[WarehouseResponse]:
    """Retrieve all warehouses."""
    warehouses = db.query(Warehouse).all()
    return [WarehouseResponse.model_validate(w) for w in warehouses]

