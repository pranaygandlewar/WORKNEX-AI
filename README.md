# WORKNEX AI
### AI-Powered Enterprise Workflow & Resource Management Platform

[![CI Pipeline](https://github.com/josephkamau32/erp-lite-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/josephkamau32/erp-lite-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.13+](https://img.shields.io/badge/Python-3.13+-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![FastMCP](https://img.shields.io/badge/MCP-FastMCP-indigo.svg)](https://github.com/jlowin/fastmcp)
[![Tests Passing](https://img.shields.io/badge/Tests-36%20Passed-emerald.svg)](tests/)

**WORKNEX AI** is a full-stack, cloud-deployable enterprise management platform combining traditional ERP operations (inventory, multi-warehouse logistics, sales orders, procurement) with an intelligent AI operations assistant powered by Anthropic's **Model Context Protocol (MCP)**. 

Sensitive and consequential enterprise decisions remain strictly guarded by **human-in-the-loop cryptographic approval workflows**, ensuring AI agents propose actions without exceeding managerial authority.

---

## Architecture Overview

```mermaid
graph TD
    User([Human Operator: Admin / Manager / Employee]) -->|HTTPS / JWT| UI[React 18 + Vite + Tailwind CSS Dashboard]
    Agent([Autonomous AI Agent / Claude Desktop]) -->|MCP stdio or Streamable HTTP| MCP[FastMCP Server /mcp]
    
    UI -->|REST API v1| Backend[FastAPI Enterprise Application]
    Backend -->|Argon2 + RBAC| Auth[Identity & Security Engine]
    
    Backend -->|Unified Logic| Services[Shared Business Services Layer]
    MCP -->|Unified Logic| Services
    
    Services -->|ORM / Migrations| DB[(PostgreSQL Database)]
    Services -->|Append-Only Trail| Audit[(Audit Log with Redaction)]
    
    Backend -->|Natural Language Assistant| Assistant[AI Assistant Orchestration Engine]
    Assistant -->|Tool Calling| MCP
```

---

## Core Application Modules

### 1. Executive Dashboard
- Real-time KPI summaries: total sales orders, open orders, aggregate inventory valuation, low-stock alerts, and pending procurement requisitions.
- Interactive operational analytics powered by **Recharts**: Monthly Sales Pipeline Area Chart, Order Status Mix Pie Chart, and Warehouse Unit Distribution Bar Chart.
- Live business activity feed showing recent human and AI actions.

### 2. Inventory Management
- Multi-warehouse catalog across regional facilities (`WH-North`, `WH-South`, `WH-East`, `WH-West`).
- Automated low-stock detection based on safety reorder thresholds.
- Authorized stock adjustments with mandatory business justifications and strict prevention of negative stock balances.
- Complete chronological inventory movement traceability.

### 3. Sales & Order Management
- Order fulfillment lifecycle tracking (`open`, `processing`, `closed`, `cancelled`).
- Customer account linking and total order valuation.
- Search and status filtering.

### 4. Procurement & Human-in-the-Loop Approvals
- Requisition creation workflow triggered by human staff or AI agents in `pending_approval` state.
- Autonomous AI agents and standard employees are strictly prohibited from approving requisitions.
- Server-generated cryptographic approval tokens compared with constant-time equality checks (`secrets.compare_digest`) to prevent timing attacks.
- Managerial one-click review, approval, and rejection interfaces.

### 5. AI Business Assistant (MCP Integrated)
- Natural language query interface connected to the MCP tool registry:
  - *"Show all low-stock products."*
  - *"Which warehouse has the lowest inventory?"*
  - *"Summarize open sales orders."*
  - *"Create a purchase requisition for MAT-002 with 100 units."*
- Inline tool invocation cards rendering tool signatures, arguments, and live database results.
- Human-in-the-loop guardrail enforcement: AI clearly indicates when an action requires human managerial approval.

### 6. Compliance & Audit Center
- Immutable, append-only audit trail recording every human and AI tool execution.
- Automated redaction of sensitive credentials (`approval_token`, `password`, `api_key`, `secret`) prior to persistence.
- Detailed modal inspection for arguments and execution results.

### 7. User & Access Management (RBAC)
- Multi-tier Role-Based Access Control:
  - **Administrator**: Full system configuration, user provisioning, audit inspection, and approval rights.
  - **Manager**: Operational dashboards, stock adjustments, and requisition approvals.
  - **Employee**: Catalog exploration and requisition proposals.
  - **AI Agent**: Explicitly permitted MCP tool execution without approval rights.
- **Argon2id** password hashing with memory and parallelism security parameters.

### 8. System & AI Settings
- Real-time platform health telemetry (PostgreSQL connection, MCP server status, active AI engine).
- MCP configuration details (Streamable HTTP binding, ASGI authentication).
- Environment metadata (zero secret leakage).

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Recharts, Lucide React, Axios |
| **Backend** | Python 3.13+, FastAPI, FastMCP, SQLAlchemy 2.0, Pydantic v2, Uvicorn |
| **Identity & Security** | Argon2id (`argon2-cffi`), PyJWT, Starlette ASGI Middleware, Constant-Time Comparison |
| **Database** | PostgreSQL 15, In-Memory SQLite (Testing) |
| **Package Management** | Astral `uv` (Python), `npm` (Node.js) |
| **Container & CI/CD** | Docker, Docker Compose, GitHub Actions |

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.13+ with `uv` installed (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Node.js 20+ and npm

### 1. Clone & Setup Environment
```bash
cp .env.example .env
```

### 2. Backend Setup & Run
```bash
# Install backend dependencies
uv sync

# Run backend API server (runs on http://localhost:8000)
uv run uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
```
The React application will launch at [http://localhost:5173](http://localhost:5173).

### Default Demonstration Accounts
| Role | Username | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@Worknex2026!` | Complete administrative and approval access |
| **Manager** | `manager` | `Manager@Worknex2026!` | Inventory adjustments and requisition approvals |
| **Employee** | `employee` | `Employee@Worknex2026!` | Catalog lookup and requisition submissions |

---

## Running with Docker Compose

To spin up the entire platform (PostgreSQL, FastAPI Backend, and React Frontend) with one command:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL**: `localhost:15432`

---

## MCP Protocol Integration & Claude Desktop

WORKNEX AI functions as a standard MCP server for agentic workflows.

### Claude Desktop Configuration
Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "worknex-ai": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "/absolute/path/to/WORKNEX-AI",
        "python",
        "-m",
        "src.server"
      ],
      "env": {
        "DATABASE_URL": "postgresql://erp_user:erp_password@localhost:15432/erp_lite"
      }
    }
  }
}
```

---

## Automated Test Suite

WORKNEX AI maintains strict test coverage, preserving **100% of the original repository's tests** while expanding with new enterprise test suites.

```bash
uv run pytest -v
```

### Test Results Breakdown
```
tests/test_tools.py ..................               [ 50%] (18 passing tests)
tests/test_transport_auth.py .......                 [ 69%] (7 passing tests)
tests/test_worknex_api.py ...........                [100%] (11 passing tests)
======================= 36 passed, 2 warnings in 8.06s =======================
```
- **18 Original Tool Tests**: Verifies `get_open_orders`, `check_inventory`, `get_low_stock_items`, `create_requisition`, `approve_pending_requisition`.
- **7 Original Transport Auth Tests**: Verifies ASGI middleware authentication, Bearer tokens, and fail-closed security.
- **11 WORKNEX Enterprise Tests**: Verifies Argon2 authentication, RBAC authorization, negative stock prevention, token masking, and AI tool orchestration.

---

## Security Model & Attribution

### Security Controls
1. **Argon2id Password Hashing**: State-of-the-art memory-hard password verification.
2. **Constant-Time Verification**: Prevents side-channel timing attacks on secret approval tokens (`secrets.compare_digest`).
3. **Sensitive Data Redaction**: Automatic masking of passwords and approval tokens in compliance logs.
4. **Human-in-the-Loop Isolation**: Approval tokens are never returned to applicant users or autonomous AI agent tool contexts.

### Attribution & Acknowledgements
WORKNEX AI is an extension built upon the foundational work of the **ERP-lite MCP Server** by **josephkamau32**.
- **Original Repository**: [josephkamau32/erp-lite-mcp](https://github.com/josephkamau32/erp-lite-mcp)
- **Original Author**: Joseph Kamau ([@josephkamau32](https://github.com/josephkamau32))
- **Original License**: MIT License (Preserved in [LICENSE](LICENSE))

---

## License

This project is licensed under the terms of the **MIT License**. See the [LICENSE](LICENSE) file for complete details.
#   W O R K N E X - A I  
 