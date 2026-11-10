from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.api.dependencies import get_db, require_manager, get_current_user_or_demo
from backend.app.models import AuditLog, User
from backend.app.schemas import AuditLogEntry

router = APIRouter(prefix="/audit", tags=["Compliance & Audit"])

@router.get("", response_model=List[AuditLogEntry])
def get_audit_trail(
    tool_name: Optional[str] = Query(None, description="Filter by tool or action name"),
    actor: Optional[str] = Query(None, description="Filter by actor/user"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (SUCCESS, FAILURE)"),
    search: Optional[str] = Query(None, description="Keyword search in arguments or result"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo)
):
    """Retrieve append-only audit trail logs.
    
    In Demo Mode, sensitive arguments and internal results are automatically sanitized.
    """
    query = db.query(AuditLog)
    if tool_name:
        query = query.filter(AuditLog.tool_name == tool_name)
    if actor:
        query = query.filter(AuditLog.actor == actor)
    if status_filter:
        query = query.filter(AuditLog.status == status_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (AuditLog.arguments.ilike(search_pattern)) | 
            (AuditLog.result.ilike(search_pattern)) |
            (AuditLog.tool_name.ilike(search_pattern))
        )
    
    entries = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    is_demo = current_user.role == "Demo Visitor"
    
    return [
        AuditLogEntry(
            id=e.id,
            tool_name=e.tool_name,
            arguments="[Arguments Sanitized for Demo View]" if is_demo and e.tool_name in ["user_login", "create_user", "update_user"] else e.arguments,
            result="[Result Sanitized for Demo View]" if is_demo and e.tool_name in ["user_login", "create_user", "update_user"] else e.result,
            timestamp=e.timestamp,
            actor="[Protected Identity]" if is_demo and e.actor and "admin" in e.actor.lower() else (e.actor or "system"),
            action_type=e.action_type or "MCP_TOOL",
            status=e.status or "SUCCESS"
        )
        for e in entries
    ]

@router.get("/{event_id}", response_model=AuditLogEntry)
def get_audit_entry(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Retrieve a single audit event."""
    entry = db.query(AuditLog).filter(AuditLog.id == event_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit entry not found")
    return AuditLogEntry.model_validate(entry)

