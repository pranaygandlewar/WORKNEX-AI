from datetime import date, datetime, timezone
from sqlalchemy.orm import Session

from backend.app.models import (
    Base,
    User,
    Warehouse,
    InventoryItem,
    InventoryMovement,
    Customer,
    SalesOrder,
    PurchaseRequisition,
    AuditLog
)
from backend.app.core.security import get_password_hash
from backend.app.core.permissions import RoleEnum

def seed_database(db: Session) -> None:
    """Populate database with initial enterprise demonstration records if empty."""
    # 1. Seed Users if not present
    existing_admin = db.query(User).filter(User.username == "admin").first()
    if not existing_admin:
        users = [
            User(
                id="usr-admin",
                username="admin",
                email="admin@worknex.ai",
                full_name="Sarah Connor (System Administrator)",
                hashed_password=get_password_hash("Admin@Worknex2026!"),
                role=RoleEnum.ADMINISTRATOR.value,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            ),
            User(
                id="usr-manager",
                username="manager",
                email="manager@worknex.ai",
                full_name="Alex Mercer (Operations Manager)",
                hashed_password=get_password_hash("Manager@Worknex2026!"),
                role=RoleEnum.MANAGER.value,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            ),
            User(
                id="usr-employee",
                username="employee",
                email="employee@worknex.ai",
                full_name="Elena Vance (Procurement Specialist)",
                hashed_password=get_password_hash("Employee@Worknex2026!"),
                role=RoleEnum.EMPLOYEE.value,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
        ]
        db.add_all(users)
        db.commit()

    # 2. Seed Warehouses
    if db.query(Warehouse).count() == 0:
        warehouses = [
            Warehouse(warehouse_id="WH-North", name="North Regional Hub", location="New York, NY", manager_name="John Doe", capacity=25000),
            Warehouse(warehouse_id="WH-South", name="South Logistics Center", location="Atlanta, GA", manager_name="Jane Smith", capacity=30000),
            Warehouse(warehouse_id="WH-East", name="East Coast Distribution", location="Boston, MA", manager_name="Robert Johnson", capacity=15000),
            Warehouse(warehouse_id="WH-West", name="West Coast Terminal", location="San Francisco, CA", manager_name="Lisa Wong", capacity=20000),
        ]
        db.add_all(warehouses)
        db.commit()

    # 3. Seed Inventory Items
    if db.query(InventoryItem).count() == 0:
        items = [
            InventoryItem(material_id="MAT-001", description="High-Grade Steel Widget", quantity_on_hand=500, reorder_point=100, warehouse="WH-North", unit_cost=45.50, category="Raw Materials"),
            InventoryItem(material_id="MAT-002", description="Industrial Copper Coil", quantity_on_hand=80, reorder_point=150, warehouse="WH-South", unit_cost=120.00, category="Metals"),
            InventoryItem(material_id="MAT-003", description="Precision Titanium Bolt", quantity_on_hand=1200, reorder_point=500, warehouse="WH-North", unit_cost=15.25, category="Hardware"),
            InventoryItem(material_id="MAT-004", description="Die-Cast Aluminum Casing", quantity_on_hand=45, reorder_point=100, warehouse="WH-East", unit_cost=85.00, category="Casings"),
            InventoryItem(material_id="MAT-005", description="Micro-Silicon Semiconductor Wafer", quantity_on_hand=250, reorder_point=300, warehouse="WH-West", unit_cost=340.00, category="Electronics"),
        ]
        db.add_all(items)
        db.commit()

        # Seed initial movements
        movements = [
            InventoryMovement(material_id="MAT-001", change_quantity=500, resulting_quantity=500, reason="Initial stock intake", created_by="admin", timestamp=datetime.now(timezone.utc)),
            InventoryMovement(material_id="MAT-002", change_quantity=80, resulting_quantity=80, reason="Initial stock intake", created_by="admin", timestamp=datetime.now(timezone.utc)),
            InventoryMovement(material_id="MAT-003", change_quantity=1200, resulting_quantity=1200, reason="Initial stock intake", created_by="admin", timestamp=datetime.now(timezone.utc)),
            InventoryMovement(material_id="MAT-004", change_quantity=45, resulting_quantity=45, reason="Initial stock intake", created_by="admin", timestamp=datetime.now(timezone.utc)),
            InventoryMovement(material_id="MAT-005", change_quantity=250, resulting_quantity=250, reason="Initial stock intake", created_by="admin", timestamp=datetime.now(timezone.utc)),
        ]
        db.add_all(movements)
        db.commit()

    # 4. Seed Customers
    if db.query(Customer).count() == 0:
        customers = [
            Customer(customer_id="CUST-001", name="Acme Corporation", email="procurement@acme.com", phone="+1-555-0101", address="100 Enterprise Way, NY"),
            Customer(customer_id="CUST-002", name="Globex International", email="orders@globex.com", phone="+1-555-0102", address="500 Global Plaza, GA"),
            Customer(customer_id="CUST-003", name="Initech Solutions", email="contact@initech.com", phone="+1-555-0103", address="4120 Freemont Blvd, CA"),
            Customer(customer_id="CUST-004", name="Stark Industries", email="defense@stark.com", phone="+1-555-0104", address="10880 Malibu Point, CA"),
            Customer(customer_id="CUST-005", name="Wayne Enterprises", email="procure@waynecorp.com", phone="+1-555-0105", address="1007 Mountain Drive, NJ"),
        ]
        db.add_all(customers)
        db.commit()

    # 5. Seed Sales Orders
    if db.query(SalesOrder).count() == 0:
        orders = [
            SalesOrder(order_id="SO-1001", customer_name="Acme Corporation", status="open", order_date=date(2026, 8, 1), total_value=15000.00, customer_id="CUST-001"),
            SalesOrder(order_id="SO-1002", customer_name="Globex International", status="closed", order_date=date(2026, 7, 28), total_value=2500.50, customer_id="CUST-002"),
            SalesOrder(order_id="SO-1003", customer_name="Initech Solutions", status="open", order_date=date(2026, 8, 10), total_value=8900.00, customer_id="CUST-003"),
            SalesOrder(order_id="SO-1004", customer_name="Stark Industries", status="open", order_date=date(2026, 8, 11), total_value=45000.00, customer_id="CUST-004"),
            SalesOrder(order_id="SO-1005", customer_name="Wayne Enterprises", status="closed", order_date=date(2026, 7, 15), total_value=12000.00, customer_id="CUST-005"),
        ]
        db.add_all(orders)
        db.commit()

    # 6. Seed Purchase Requisitions
    if db.query(PurchaseRequisition).count() == 0:
        reqs = [
            PurchaseRequisition(requisition_id="PR-2001", material_id="MAT-002", quantity=200, requested_by="Alice Smith", status="approved", approval_token="tok_seed_approved_1", created_at=datetime(2026, 8, 5, 10, 0, 0), approved_at=datetime(2026, 8, 6, 14, 30, 0), approved_by="Alex Mercer"),
            PurchaseRequisition(requisition_id="PR-2002", material_id="MAT-004", quantity=150, requested_by="Bob Jones", status="pending_approval", approval_token="tok_seed_pending_2", created_at=datetime(2026, 8, 11, 9, 15, 0), approved_at=None),
            PurchaseRequisition(requisition_id="PR-2003", material_id="MAT-005", quantity=100, requested_by="Charlie Brown", status="pending_approval", approval_token="tok_seed_pending_3", created_at=datetime(2026, 8, 12, 8, 0, 0), approved_at=None),
        ]
        db.add_all(reqs)
        db.commit()

    # 7. Seed initial audit log entry
    if db.query(AuditLog).count() == 0:
        audit = AuditLog(
            tool_name="system_initialization",
            arguments='{"status": "initialized", "environment": "production-ready"}',
            result="WORKNEX AI Platform successfully initialized with baseline configuration.",
            timestamp=datetime.now(timezone.utc),
            actor="system",
            action_type="SYSTEM_BOOT",
            status="SUCCESS"
        )
        db.add(audit)
        db.commit()

