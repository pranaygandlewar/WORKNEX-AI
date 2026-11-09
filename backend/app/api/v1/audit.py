from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.api.dependencies import get_db, require_manager
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
    current_user: User = Depends(require_manager)
):
    """Retrieve append-only audit trail logs (Manager/Admin only)."""
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
    return [
        AuditLogEntry(
            id=e.id,
            tool_name=e.tool_name,
            arguments=e.arguments,
            result=e.result,
            timestamp=e.timestamp,
            actor=e.actor or "system",
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

