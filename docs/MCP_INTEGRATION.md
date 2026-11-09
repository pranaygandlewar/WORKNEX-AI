# WORKNEX AI — Model Context Protocol (MCP) Integration

WORKNEX AI exposes enterprise capabilities to AI agents using Anthropic's open Model Context Protocol (MCP).

## 1. Supported Transports

1. **Local Stdio Transport**:
   - Ideal for local integration with Claude Desktop or standalone agent runtimes.
   - Run via:
     ```bash
     uv run python -m src.server
     ```

2. **Streamable HTTP Transport (`/mcp`)**:
   - For cloud or network deployments.
   - Enforces transport authentication with pure ASGI middleware.
   - Requires header:
     - `Authorization: Bearer <MCP_API_KEY>` or `X-MCP-API-Key: <MCP_API_KEY>`
   - Fails closed with HTTP 500 if `MCP_API_KEY` is not configured in the environment.

## 2. MCP Tools Specification

| Tool Name | Type | Signature | Description |
| :--- | :--- | :--- | :--- |
| `get_open_orders` | Read | `(status: str = "open", limit: int = 20)` | Retrieves open sales orders. |
| `check_inventory` | Read | `(material_id: str)` | Checks stock level & reorder threshold for material. |
| `get_low_stock_items` | Read | `()` | Lists all materials below their reorder threshold. |
| `create_requisition` | Write (Guarded) | `(material_id: str, quantity: int, requested_by: str)` | Proposes purchase requisition in `pending_approval` state. Silently generates `approval_token`. |
| `approve_pending_requisition` | Write (Privileged) | `(requisition_id: str, approved_by: str, approval_token: str)` | Approves pending requisition using constant-time token verification. |

## 3. Dedicated Administrative Endpoints (Outside MCP Surface)

The server enforces an architectural boundary separating agent tools from administrative approval retrieval:
- `GET /admin/pending-requisitions` — Returns pending requisitions alongside their approval tokens.
- `GET /admin/audit-log` — Returns append-only compliance logs.
- Protected by `ADMIN_API_KEY` via `X-Admin-Key` header.
- These endpoints sit entirely outside the MCP tool registry, ensuring autonomous agents cannot reach them.

