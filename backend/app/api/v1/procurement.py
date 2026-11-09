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
    PurchaseRequisitionResponse,
    RequisitionCreateRequest,
    RequisitionApproveRequest,
    RequisitionRejectRequest
)
from backend.app.services.requisition_service import (
    create_purchase_requisition,
    approve_requisition,
    reject_requisition,
    list_requisitions,
    get_requisition
)
from backend.app.core.permissions import RoleEnum

router = APIRouter(prefix="/requisitions", tags=["Procurement & Approvals"])

@router.get("", response_model=List[PurchaseRequisitionResponse])
def get_all_requisitions(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """Retrieve purchase requisitions.
    
    Security note: approval_token is only visible to Managers and Administrators.
    For standard employees and AI agents, approval_token is masked.
    """
    results = list_requisitions(db, status=status_filter)
    is_privileged = current_user.role in [RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value]
    
    sanitized = []
    for r in results:
        data = r.model_copy()
        if not is_privileged:
            data.approval_token = None
        sanitized.append(data)
    return sanitized

@router.get("/{requisition_id}", response_model=PurchaseRequisitionResponse)
def get_single_requisition(
    requisition_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """Inspect a single purchase requisition."""
    try:
        r = get_requisition(requisition_id, db)
        is_privileged = current_user.role in [RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value]
        if not is_privileged:
            r.approval_token = None
        return r
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("", response_model=PurchaseRequisitionResponse, status_code=status.HTTP_201_CREATED)
def propose_requisition(
    req_in: RequisitionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """Submit a new purchase requisition in pending_approval status.
    
    The approval token is generated securely on the server and NEVER returned to the applicant.
    """
    try:
        r = create_purchase_requisition(
            material_id=req_in.material_id,
            quantity=req_in.quantity,
            requested_by=current_user.full_name or current_user.username,
            notes=req_in.notes,
            db=db
        )
        # Always mask approval token from submission response
        r.approval_token = None
        return r
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{requisition_id}/approve", response_model=PurchaseRequisitionResponse)
def approve_single_requisition(
    requisition_id: str,
    approve_in: RequisitionApproveRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Approve a pending purchase requisition (Manager/Admin only)."""
    token = approve_in.approval_token if approve_in else None
    try:
        return approve_requisition(
            requisition_id=requisition_id,
            approved_by=current_user.full_name or current_user.username,
            approval_token=token,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{requisition_id}/reject", response_model=PurchaseRequisitionResponse)
def reject_single_requisition(
    requisition_id: str,
    reject_in: RequisitionRejectRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Reject a pending purchase requisition (Manager/Admin only)."""
    reason = reject_in.reason if reject_in else "Administrative rejection"
    try:
        return reject_requisition(
            requisition_id=requisition_id,
            rejected_by=current_user.full_name or current_user.username,
            reason=reason,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

