from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.api.dependencies import get_db, require_authenticated
from backend.app.models import User
from backend.app.schemas import DashboardOverview
from backend.app.services.dashboard_service import get_dashboard_overview

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=DashboardOverview)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """Retrieve top-level KPI overview, charts, and activity summaries."""
    return get_dashboard_overview(db)

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """Operational analytics for order velocity, stock levels, and procurement bottlenecks."""
    overview = get_dashboard_overview(db)
    return {
        "monthly_sales_trend": overview.monthly_sales_trend,
        "order_status_distribution": overview.order_status_distribution,
        "warehouse_distribution": overview.warehouse_distribution,
        "inventory_value": overview.total_inventory_value,
        "low_stock_ratio": round(
            overview.low_stock_count / max(overview.total_inventory_items, 1) * 100, 1
        )
    }

@router.get("/activity")
def get_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated)
):
    """Retrieve recent business activities and audit trail highlights."""
    overview = get_dashboard_overview(db)
    return {"activities": overview.recent_activities}

