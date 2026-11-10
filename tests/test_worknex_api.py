import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.models import Base, User, InventoryItem, SalesOrder, PurchaseRequisition, AuditLog
from backend.app.core.security import get_password_hash
from backend.app.main import app
import backend.app.api.dependencies as deps
import src.db as src_db

# Setup test in-memory SQLite database with StaticPool so all threads share the memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[deps.get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="function", autouse=True)
def setup_test_database(monkeypatch):
    Base.metadata.create_all(bind=engine)
    monkeypatch.setattr(deps, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(src_db, "SessionLocal", TestingSessionLocal)
    
    db = TestingSessionLocal()
    
    # Create test users with Argon2 hashes
    admin = User(
        id="usr-test-admin",
        username="testadmin",
        email="testadmin@worknex.ai",
        full_name="Admin Tester",
        role="Administrator",
        hashed_password=get_password_hash("AdminPass123!"),
        is_active=True
    )
    manager = User(
        id="usr-test-manager",
        username="testmanager",
        email="testmanager@worknex.ai",
        full_name="Manager Tester",
        role="Manager",
        hashed_password=get_password_hash("ManagerPass123!"),
        is_active=True
    )
    employee = User(
        id="usr-test-employee",
        username="testemployee",
        email="testemployee@worknex.ai",
        full_name="Employee Tester",
        role="Employee",
        hashed_password=get_password_hash("EmployeePass123!"),
        is_active=True
    )
    db.add_all([admin, manager, employee])
    
    # Add inventory items
    item1 = InventoryItem(
        material_id="MAT-101",
        description="Steel Plate",
        quantity_on_hand=50,
        reorder_point=100,
        warehouse="WH-North",
        unit_cost=30.0,
        category="Metals"
    )
    item2 = InventoryItem(
        material_id="MAT-102",
        description="Copper Wire",
        quantity_on_hand=200,
        reorder_point=100,
        warehouse="WH-South",
        unit_cost=15.0,
        category="Electronics"
    )
    db.add_all([item1, item2])
    
    # Add sales order
    order = SalesOrder(
        order_id="SO-9999",
        customer_name="Test Client Corp",
        status="open",
        order_date=date(2026, 8, 1),
        total_value=5000.0
    )
    db.add(order)
    db.commit()
    
    yield db
    
    db.close()
    Base.metadata.drop_all(bind=engine)

def get_token(username: str, password: str) -> str:
    r = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]

# -------------------------------------------------------------
# 1. AUTHENTICATION & RBAC TESTS
# -------------------------------------------------------------

def test_login_success():
    r = client.post("/api/v1/auth/login", json={"username": "testadmin", "password": "AdminPass123!"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["role"] == "Administrator"

def test_login_invalid_password():
    r = client.post("/api/v1/auth/login", json={"username": "testadmin", "password": "WrongPassword"})
    assert r.status_code == 401
    assert "Incorrect username or password" in r.json()["detail"]

def test_auth_me_authenticated():
    token = get_token("testemployee", "EmployeePass123!")
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["username"] == "testemployee"
    assert r.json()["role"] == "Employee"

def test_user_management_rbac_enforcement():
    emp_token = get_token("testemployee", "EmployeePass123!")
    # Employee cannot view all users
    r = client.get("/api/v1/users", headers={"Authorization": f"Bearer {emp_token}"})
    assert r.status_code == 403

    # Admin CAN view users
    admin_token = get_token("testadmin", "AdminPass123!")
    r_admin = client.get("/api/v1/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_admin.status_code == 200
    assert len(r_admin.json()) >= 3

# -------------------------------------------------------------
# 2. INVENTORY MANAGEMENT TESTS
# -------------------------------------------------------------

def test_get_inventory_and_low_stock():
    token = get_token("testemployee", "EmployeePass123!")
    headers = {"Authorization": f"Bearer {token}"}
    
    # List all
    r = client.get("/api/v1/inventory", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) == 2
    
    # Low stock
    r_low = client.get("/api/v1/inventory/low-stock", headers=headers)
    assert r_low.status_code == 200
    items = r_low.json()
    assert len(items) == 1
    assert items[0]["material_id"] == "MAT-101"

def test_stock_adjustment_positive_and_negative_rejection():
    mgr_token = get_token("testmanager", "ManagerPass123!")
    headers = {"Authorization": f"Bearer {mgr_token}"}
    
    # Positive adjustment
    r = client.post(
        "/api/v1/inventory/MAT-101/adjust",
        json={"change_quantity": 25, "reason": "Restock shipment"},
        headers=headers
    )
    assert r.status_code == 200
    assert r.json()["quantity_on_hand"] == 75
    
    # Reject negative stock
    r_neg = client.post(
        "/api/v1/inventory/MAT-101/adjust",
        json={"change_quantity": -100, "reason": "Excessive deduction"},
        headers=headers
    )
    assert r_neg.status_code == 400
    assert "cannot be negative" in r_neg.json()["detail"]

# -------------------------------------------------------------
# 3. SALES ORDERS TESTS
# -------------------------------------------------------------

def test_sales_orders_crud():
    mgr_token = get_token("testmanager", "ManagerPass123!")
    headers = {"Authorization": f"Bearer {mgr_token}"}
    
    # Get existing order
    r = client.get("/api/v1/orders/SO-9999", headers=headers)
    assert r.status_code == 200
    assert r.json()["customer_name"] == "Test Client Corp"
    
    # Create new order
    r_create = client.post(
        "/api/v1/orders",
        json={
            "customer_name": "New Horizons LLC",
            "status": "open",
            "total_value": 7800.50
        },
        headers=headers
    )
    assert r_create.status_code == 201
    new_order = r_create.json()
    assert new_order["customer_name"] == "New Horizons LLC"

# -------------------------------------------------------------
# 4. PROCUREMENT & HUMAN-IN-THE-LOOP APPROVAL TESTS
# -------------------------------------------------------------

def test_procurement_workflow_and_token_masking():
    emp_token = get_token("testemployee", "EmployeePass123!")
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    
    # 1. Employee proposes requisition
    r_create = client.post(
        "/api/v1/requisitions",
        json={"material_id": "MAT-101", "quantity": 100, "notes": "Urgent restock"},
        headers=emp_headers
    )
    assert r_create.status_code == 201
    created_req = r_create.json()
    req_id = created_req["requisition_id"]
    assert created_req["status"] == "pending_approval"
    assert created_req["approval_token"] is None  # Token MUST be masked from applicant
    
    # 2. Employee viewing list cannot see token
    r_list_emp = client.get("/api/v1/requisitions", headers=emp_headers)
    for req in r_list_emp.json():
        assert req["approval_token"] is None
        
    # 3. Employee cannot approve
    r_emp_approve = client.post(f"/api/v1/requisitions/{req_id}/approve", headers=emp_headers)
    assert r_emp_approve.status_code == 403
    
    # 4. Manager can see token and approve
    mgr_token = get_token("testmanager", "ManagerPass123!")
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}
    r_mgr_view = client.get(f"/api/v1/requisitions/{req_id}", headers=mgr_headers)
    assert r_mgr_view.status_code == 200
    assert r_mgr_view.json()["approval_token"] is not None
    
    # 5. Manager approves requisition
    r_approve = client.post(f"/api/v1/requisitions/{req_id}/approve", headers=mgr_headers)
    assert r_approve.status_code == 200
    assert r_approve.json()["status"] == "approved"
    
    # 6. Duplicate approval is rejected
    r_dup = client.post(f"/api/v1/requisitions/{req_id}/approve", headers=mgr_headers)
    assert r_dup.status_code == 400
    assert "already approved" in r_dup.json()["detail"]

# -------------------------------------------------------------
# 5. AI ASSISTANT & MCP ORCHESTRATION TESTS
# -------------------------------------------------------------

def test_ai_assistant_low_stock_query():
    emp_token = get_token("testemployee", "EmployeePass123!")
    headers = {"Authorization": f"Bearer {emp_token}"}
    
    r = client.post(
        "/api/v1/ai/chat",
        json={"message": "Show all low-stock products"},
        headers=headers
    )
    assert r.status_code == 200
    data = r.json()
    assert "MAT-101" in data["response"]
    assert len(data["tool_executions"]) >= 1
    assert data["tool_executions"][0]["tool_name"] == "get_low_stock_items"

def test_ai_assistant_creates_requisition_without_approving():
    emp_token = get_token("testemployee", "EmployeePass123!")
    headers = {"Authorization": f"Bearer {emp_token}"}
    
    r = client.post(
        "/api/v1/ai/chat",
        json={"message": "Create purchase requisition for MAT-102 with 80 units"},
        headers=headers
    )
    assert r.status_code == 200
    data = r.json()
    assert "pending_approval" in data["response"]
    assert "Human-in-the-Loop" in data["response"] or "manager" in data["response"].lower()

# -------------------------------------------------------------
# 6. AUDIT LOG & REDACTION TESTS
# -------------------------------------------------------------

def test_audit_log_records_events_and_redacts():
    mgr_token = get_token("testmanager", "ManagerPass123!")
    headers = {"Authorization": f"Bearer {mgr_token}"}
    
    r = client.get("/api/v1/audit", headers=headers)
    assert r.status_code == 200
    logs = r.json()
    assert len(logs) > 0
    
    # Ensure sensitive credentials like passwords or approval tokens are redacted
    for log in logs:
        assert "AdminPass123!" not in log["arguments"]
        assert "ManagerPass123!" not in log["arguments"]

# -------------------------------------------------------------
# 7. DEMO MODE & PUBLIC READ-ONLY BOUNDARY TESTS
# -------------------------------------------------------------

def test_demo_mode_public_read_allowed():
    """Anonymous visitors can access approved read-only endpoints without credentials."""
    # Overview
    r_overview = client.get("/api/v1/dashboard/overview")
    assert r_overview.status_code == 200
    assert "total_sales_orders" in r_overview.json()

    # Inventory read-only
    r_inv = client.get("/api/v1/inventory")
    assert r_inv.status_code == 200
    assert len(r_inv.json()) >= 1

    # Orders read-only
    r_orders = client.get("/api/v1/orders")
    assert r_orders.status_code == 200

    # Requisitions read-only, but approval token is strictly masked
    r_reqs = client.get("/api/v1/requisitions")
    assert r_reqs.status_code == 200
    for req in r_reqs.json():
        assert req["approval_token"] is None

    # Audit trail read-only (sanitized)
    r_audit = client.get("/api/v1/audit")
    assert r_audit.status_code == 200

def test_demo_mode_write_actions_strictly_rejected():
    """Anonymous visitors must be rejected from all write and administrative actions."""
    # Cannot create inventory item
    r_create_item = client.post(
        "/api/v1/inventory",
        json={"material_id": "MAT-999", "description": "Hacked", "quantity_on_hand": 10, "reorder_point": 5, "warehouse": "WH-North"}
    )
    assert r_create_item.status_code in (401, 403)

    # Cannot adjust stock
    r_adjust = client.post(
        "/api/v1/inventory/MAT-101/adjust",
        json={"change_quantity": 50, "reason": "Unauthorized adjustment"}
    )
    assert r_adjust.status_code in (401, 403)

    # Cannot create sales order
    r_order = client.post(
        "/api/v1/orders",
        json={"customer_name": "Unauthorized Client", "status": "open", "total_value": 1000}
    )
    assert r_order.status_code in (401, 403)

    # Cannot propose requisition
    r_req = client.post(
        "/api/v1/requisitions",
        json={"material_id": "MAT-101", "quantity": 50, "notes": "Unauthorized requisition"}
    )
    assert r_req.status_code in (401, 403)

    # Cannot view user management
    r_users = client.get("/api/v1/users")
    assert r_users.status_code in (401, 403)

def test_demo_mode_ai_assistant_enforces_read_only():
    """AI Assistant permits PUBLIC_READ tools but blocks AUTHENTICATED_WRITE tools for Demo visitors."""
    # 1. Read-only tool is permitted
    r_read = client.post(
        "/api/v1/ai/chat",
        json={"message": "Show low stock materials"}
    )
    assert r_read.status_code == 200
    data_read = r_read.json()
    assert "MAT-101" in data_read["response"]
    assert len(data_read["tool_executions"]) >= 1
    assert data_read["tool_executions"][0]["status"] == "SUCCESS"

    # 2. Write tool is restricted
    r_write = client.post(
        "/api/v1/ai/chat",
        json={"message": "Create requisition for MAT-101 with 50 units"}
    )
    assert r_write.status_code == 200
    data_write = r_write.json()
    assert "Demo Mode Restriction" in data_write["response"]

def test_invalid_token_returns_401():
    """Invalid credentials return 401 Unauthorized instead of silently falling back."""
    r = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer totally-invalid-token"}
    )
    assert r.status_code == 401
