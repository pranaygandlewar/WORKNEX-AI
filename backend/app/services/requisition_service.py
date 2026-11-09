import uuid
import secrets
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.models import PurchaseRequisition, InventoryItem, InventoryMovement
from backend.app.schemas import PurchaseRequisitionResponse
from backend.app.core.security import verify_token_constant_time
from backend.app.services.audit_service import record_audit

def create_purchase_requisition(
    material_id: str,
    quantity: int,
    requested_by: str,
    notes: Optional[str] = None,
    db: Session = None
) -> PurchaseRequisitionResponse:
    """Create a new purchase requisition in 'pending_approval' state.
    
    Generates a secure approval token stored in the database.
    The token is NOT exposed to standard users or AI tool responses.
    """
    if quantity <= 0:
        raise ValueError("Quantity must be positive.")

    # Validate material exists
    item = db.query(InventoryItem).filter(InventoryItem.material_id == material_id).first()
    if not item:
        raise ValueError(f"Material {material_id} not found. Cannot create requisition.")

    requisition_id = f"PR-{uuid.uuid4().hex[:6].upper()}"
    approval_token = secrets.token_urlsafe(16)

    new_req = PurchaseRequisition(
        requisition_id=requisition_id,
        material_id=material_id,
        quantity=quantity,
        requested_by=requested_by,
        status="pending_approval",
        approval_token=approval_token,
        notes=notes,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    record_audit(
        tool_name="create_requisition",
        arguments={
            "material_id": material_id,
            "quantity": quantity,
            "requested_by": requested_by,
            "approval_token": approval_token  # will be redacted by audit service!
        },
        result=f"Successfully created requisition {new_req.requisition_id} for {quantity} units of {material_id}. Status: {new_req.status}.",
        actor=requested_by,
        action_type="PROCUREMENT_CREATE",
        db=db
    )

    return PurchaseRequisitionResponse.model_validate(new_req)

def approve_requisition(
    requisition_id: str,
    approved_by: str,
    approval_token: Optional[str] = None,
    db: Session = None
) -> PurchaseRequisitionResponse:
    """Approve a pending purchase requisition.
    
    Can be approved either:
    1. By providing the valid approval_token (used by MCP tool or human passing token),
    2. Or directly by an authorized human Manager/Administrator (via authenticated UI/REST endpoint).
    """
    req = db.query(PurchaseRequisition).filter(PurchaseRequisition.requisition_id == requisition_id).first()
    if not req:
        raise ValueError(f"Requisition {requisition_id} not found.")

    if req.status == "approved":
        raise ValueError(f"Requisition {requisition_id} is already approved.")
    if req.status == "rejected":
        raise ValueError(f"Requisition {requisition_id} has already been rejected.")

    # If approval_token is supplied, verify it using constant-time check
    if approval_token is not None:
        if not req.approval_token or not verify_token_constant_time(approval_token, req.approval_token):
            raise ValueError(f"Invalid or missing approval token for requisition {requisition_id}.")

    req.status = "approved"
    req.approved_at = datetime.now(timezone.utc)
    req.approved_by = approved_by
    
    # Optionally update stock or record inbound movement
    item = db.query(InventoryItem).filter(InventoryItem.material_id == req.material_id).first()
    if item:
        # We record that an approved requisition will replenish stock
        item.quantity_on_hand += req.quantity
        movement = InventoryMovement(
            material_id=item.material_id,
            change_quantity=req.quantity,
            resulting_quantity=item.quantity_on_hand,
            reason=f"Approved Requisition {requisition_id}",
            created_by=approved_by,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(movement)

    db.commit()
    db.refresh(req)

    record_audit(
        tool_name="approve_pending_requisition",
        arguments={
            "requisition_id": requisition_id,
            "approved_by": approved_by,
            "approval_token": approval_token
        },
        result=f"Successfully approved requisition {req.requisition_id}. Status is now {req.status}.",
        actor=approved_by,
        action_type="PROCUREMENT_APPROVE",
        db=db
    )

    return PurchaseRequisitionResponse.model_validate(req)

def reject_requisition(
    requisition_id: str,
    rejected_by: str,
    reason: Optional[str] = None,
    db: Session = None
) -> PurchaseRequisitionResponse:
    """Reject a pending purchase requisition."""
    req = db.query(PurchaseRequisition).filter(PurchaseRequisition.requisition_id == requisition_id).first()
    if not req:
        raise ValueError(f"Requisition {requisition_id} not found.")

    if req.status == "approved":
        raise ValueError(f"Cannot reject requisition {requisition_id}: already approved.")
    if req.status == "rejected":
        raise ValueError(f"Requisition {requisition_id} is already rejected.")

    req.status = "rejected"
    req.approved_by = rejected_by
    if reason:
        req.notes = f"Rejected: {reason}"
    db.commit()
    db.refresh(req)

    record_audit(
        tool_name="reject_requisition",
        arguments={"requisition_id": requisition_id, "rejected_by": rejected_by, "reason": reason},
        result=f"Rejected requisition {requisition_id}",
        actor=rejected_by,
        action_type="PROCUREMENT_REJECT",
        db=db
    )

    return PurchaseRequisitionResponse.model_validate(req)

def list_requisitions(
    db: Session,
    status: Optional[str] = None,
    limit: int = 100
) -> List[PurchaseRequisitionResponse]:
    """List purchase requisitions."""
    query = db.query(PurchaseRequisition)
    if status and status != "all":
        query = query.filter(PurchaseRequisition.status == status)
    reqs = query.order_by(PurchaseRequisition.created_at.desc()).limit(limit).all()
    return [PurchaseRequisitionResponse.model_validate(r) for r in reqs]

def get_requisition(requisition_id: str, db: Session) -> PurchaseRequisitionResponse:
    """Get single requisition."""
    req = db.query(PurchaseRequisition).filter(PurchaseRequisition.requisition_id == requisition_id).first()
    if not req:
        raise ValueError(f"Requisition {requisition_id} not found.")
    return PurchaseRequisitionResponse.model_validate(req)

