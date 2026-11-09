# WORKNEX AI — Portfolio & Capstone Demonstration Walkthrough

This guide walks an evaluator or reviewer through demonstrating the key enterprise capabilities of **WORKNEX AI**.

---

## 1. Setup & Launch

1. Start the platform:
   ```bash
   # Terminal 1: Backend API
   uv run python main.py server

   # Terminal 2: React Frontend
   cd frontend
   npm run dev
   ```
2. Navigate to `http://localhost:5173`.

---

## 2. Walkthrough Steps

### Step 1: Authentication & Role-Based Access Control (RBAC)
1. On the login screen, test the preset quick-credentials:
   - Click **Admin** (`admin` / `Admin@Worknex2026!`) and sign in.
   - Notice the **User Management** item appears in the sidebar.
2. Sign out and log in as **Employee** (`employee` / `Employee@Worknex2026!`).
   - Notice that administrative actions and the User Management page are hidden.
   - Attempting to access `/users` directly redirects safely to the dashboard.
   - Requisitions created by an employee have their approval tokens hidden.

### Step 2: Executive Dashboard
1. Log back in as **Administrator** or **Manager**.
2. Review the live KPIs:
   - Total Sales Orders & Open Orders count.
   - Total Inventory Valuation computed in real-time.
   - Low-Stock items count.
   - Pending purchase requisitions awaiting managerial review.
3. Observe the charts:
   - **Monthly Sales Pipeline**: Area chart showing revenue velocity.
   - **Order Status Mix**: Pie chart with dynamic breakdown.
   - **Warehouse Inventory Levels**: Multi-facility breakdown (`WH-North`, `WH-South`, `WH-East`, `WH-West`).
4. Inspect the **Recent Business Activities** feed pulling live from the immutable audit trail.

### Step 3: Inventory Management & Negative Stock Prevention
1. Go to **Inventory**.
2. Search for `Copper Coil` or filter by warehouse `WH-South`.
3. Toggle the **Low-Stock Only** button to view only items requiring replenishment.
4. Click the **History** icon on any material to view the chronological movement history.
5. Click the **Stock Adjustment** slider icon:
   - Attempt to adjust stock by `-1000` (an invalid deduction).
   - Observe that the server rejects the request: *"Resulting quantity cannot be negative"*.
   - Adjust stock by `+25` with justification: *"Receipt of inbound supplier shipment"*.
   - Observe the quantity updates in real-time and an inventory movement record is generated.

### Step 4: Sales Order Lifecycle
1. Go to **Sales Orders**.
2. Filter orders by status (`open`, `processing`, `closed`).
3. Click **Create Sales Order** to record a new customer contract.
4. Update an order's status from `open` to `processing` or `closed` using the inline status dropdown.

### Step 5: AI Business Assistant & MCP Tool Execution
1. Go to **AI Assistant** in the sidebar.
2. Click the quick prompt: **"Show all low-stock products."**
   - Watch the assistant invoke the MCP tool `get_low_stock_items`.
   - Inspect the tool execution badge showing arguments and tool status.
3. Test natural language inventory lookup:
   - Enter: *"What is the current stock of MAT-001?"*
   - Watch the assistant invoke `check_inventory` and format the warehouse location and balance.
4. Test warehouse logistics:
   - Enter: *"Which warehouse has the lowest inventory?"*
   - Observe the breakdown computed across facilities.
5. Test the Human-in-the-Loop workflow:
   - Enter: *"Create a purchase requisition for MAT-002 with 100 units."*
   - The assistant calls `create_requisition`.
   - The assistant explicitly states that the requisition has been placed in `pending_approval` and **reminds the user that as an AI assistant, it cannot approve its own requisition**.

### Step 6: Procurement & Human-in-the-Loop Approvals
1. Go to **Procurement**.
2. Locate the requisition created by the AI in Step 5 (`status: pending_approval`).
3. Notice that as a Manager/Admin, you can click **Reveal Security Tokens** to see the underlying cryptographic token (`secrets.token_urlsafe(16)`).
4. Click **Approve**:
   - The requisition changes to `approved` with the manager's name and timestamp recorded.
   - The stock for that material is automatically replenished in inventory.
   - Attempting to approve again is rejected by duplicate approval prevention checks.

### Step 7: Compliance & Audit Trail
1. Go to **Audit Center**.
2. Filter by status: `SUCCESS`.
3. Search for `create_requisition` or `ai_assistant`.
4. Click the **Inspect** eye icon on the requisition event:
   - Review the serialized arguments.
   - Confirm that sensitive arguments like `approval_token` are redacted (`***REDACTED***`).

### Step 8: System Telemetry & Claude Desktop MCP Integration
1. Go to **System Settings**.
2. Verify all system telemetry indicators: PostgreSQL Database (Connected), MCP Server Transport (Active), AI Engine (Operational).
3. Review the MCP binding instructions for connecting to Claude Desktop via stdio.

---

## 3. Summary of Evaluator Highlights
- **100% Real API & Database Persistence**: No mock or hardcoded dashboard numbers.
- **Genuine Access Control**: Full RBAC with Argon2 password hashing.
- **Architectural Integrity**: Shared service logic between REST API and FastMCP tool registry.
- **True Human-in-the-Loop**: Consequential write operations guarded by constant-time cryptographic checks.
