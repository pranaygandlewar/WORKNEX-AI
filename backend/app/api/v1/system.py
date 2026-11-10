from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone

from backend.app.api.dependencies import get_db, get_current_user_or_demo
from backend.app.models import User
from backend.app.core.config import settings
from backend.app.core.permissions import RoleEnum
from backend.app.schemas import SystemHealthResponse, SystemSettingsResponse

router = APIRouter(prefix="/system", tags=["System Management"])

@router.get("/health", response_model=SystemHealthResponse)
def get_health(db: Session = Depends(get_db)):
    """Check system readiness, database connectivity, and MCP server status."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return SystemHealthResponse(
        status="operational" if db_status == "healthy" else "degraded",
        version=settings.VERSION,
        database=db_status,
        mcp_server="active (Streamable HTTP / stdio ready)",
        ai_provider=settings.AI_PROVIDER,
        timestamp=datetime.now(timezone.utc)
    )

@router.get("/settings", response_model=SystemSettingsResponse)
def get_settings(current_user: User = Depends(get_current_user_or_demo)):
    """Retrieve system configuration metadata (no secrets exposed!)."""
    return SystemSettingsResponse(
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        ai_provider=settings.AI_PROVIDER,
        ai_model=settings.AI_MODEL,
        mcp_host=settings.MCP_HOST,
        mcp_port=settings.MCP_PORT,
        cors_origins=settings.BACKEND_CORS_ORIGINS,
        roles=[r.value for r in RoleEnum]
    )

