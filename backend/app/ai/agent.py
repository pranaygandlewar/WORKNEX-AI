import json
import re
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models import AIConversation, AIMessage, User
from backend.app.schemas import ToolExecutionInfo, AIChatResponse
from backend.app.services.inventory_service import (
    check_inventory_level,
    list_low_stock_items,
    list_all_inventory
)
from backend.app.services.order_service import get_open_sales_orders, list_sales_orders
from backend.app.services.requisition_service import (
    create_purchase_requisition,
    list_requisitions
)
from backend.app.services.audit_service import record_audit

# MCP Tools Registry definition for AI Agent
MCP_TOOLS_SPEC = [
    {
        "name": "get_low_stock_items",
        "description": "Lists all inventory materials that are currently below their safety reorder point.",
        "category": "PUBLIC_READ",
        "parameters": {}
    },
    {
        "name": "check_inventory",
        "description": "Checks current stock level, warehouse, and reorder point for a specific material ID.",
        "category": "PUBLIC_READ",
        "parameters": {"material_id": "string"}
    },
    {
        "name": "get_open_orders",
        "description": "Retrieves active sales orders that are open or processing.",
        "category": "PUBLIC_READ",
        "parameters": {"status": "string (default: 'open')", "limit": "integer (default: 20)"}
    },
    {
        "name": "get_pending_requisitions",
        "description": "Retrieves pending purchase requisitions awaiting manager review.",
        "category": "PUBLIC_READ",
        "parameters": {}
    },
    {
        "name": "create_requisition",
        "description": "Proposes a new purchase requisition. Requires human-in-the-loop approval. Status will be 'pending_approval'.",
        "category": "AUTHENTICATED_WRITE",
        "parameters": {"material_id": "string", "quantity": "integer"}
    },
    {
        "name": "get_inventory_summary",
        "description": "Provides an overview of all inventory across all warehouses.",
        "category": "PUBLIC_READ",
        "parameters": {}
    }
]

# Explicit Tool Access Control Classification
PUBLIC_READ_TOOLS = {
    "get_low_stock_items",
    "check_inventory",
    "get_inventory_summary",
    "get_open_orders",
    "get_pending_requisitions",
}
AUTHENTICATED_WRITE_TOOLS = {
    "create_requisition",
}
ADMIN_ONLY_TOOLS = {
    "adjust_inventory",
    "approve_requisition",
}

class AIAssistantService:
    """Enterprise AI Business Operations Assistant.
    
    Orchestrates MCP tools with LLM reasoning or intelligent heuristic fallback,
    enforcing human-in-the-loop approval for write operations.
    """

    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.user = current_user

    def execute_tool(self, tool_name: str, args: Dict[str, Any]) -> ToolExecutionInfo:
        """Execute an MCP tool with audit logging and permission boundaries."""
        # Demo Mode boundary: only explicitly approved PUBLIC_READ tools are executable
        if getattr(self.user, "role", "") == "Demo Visitor" and tool_name not in PUBLIC_READ_TOOLS:
            return ToolExecutionInfo(
                tool_name=tool_name,
                arguments=args,
                result={
                    "error": "Action restricted in Demo Mode",
                    "detail": f"Tool '{tool_name}' requires authenticated credentials. Demo Mode only allows read-only queries."
                },
                status="RESTRICTED"
            )
        try:
            if tool_name == "get_low_stock_items":
                items = list_low_stock_items(self.db)
                result_data = [item.model_dump() for item in items]
                status = "SUCCESS"
                result_str = f"Found {len(items)} low-stock items."

            elif tool_name == "check_inventory":
                mat_id = args.get("material_id", "").strip().upper()
                if not mat_id:
                    raise ValueError("material_id parameter is required.")
                item = check_inventory_level(mat_id, self.db)
                result_data = item.model_dump()
                status = "SUCCESS"
                result_str = f"Material {item.material_id}: {item.quantity_on_hand} units available in {item.warehouse}."

            elif tool_name == "get_open_orders":
                st = args.get("status", "open")
                limit = int(args.get("limit", 20))
                orders = get_open_sales_orders(status=st, limit=limit, db=self.db)
                result_data = [o.model_dump(mode="json") for o in orders]
                status = "SUCCESS"
                result_str = f"Retrieved {len(orders)} orders with status '{st}'."

            elif tool_name == "get_pending_requisitions":
                reqs = list_requisitions(self.db, status="pending_approval")
                # AI Agent MUST NOT see approval tokens
                result_data = [
                    {
                        "requisition_id": r.requisition_id,
                        "material_id": r.material_id,
                        "quantity": r.quantity,
                        "requested_by": r.requested_by,
                        "status": r.status,
                        "created_at": r.created_at.isoformat() if r.created_at else None
                    }
                    for r in reqs
                ]
                status = "SUCCESS"
                result_str = f"Retrieved {len(reqs)} pending requisitions."

            elif tool_name == "create_requisition":
                mat_id = args.get("material_id", "").strip().upper()
                qty = int(args.get("quantity", 0))
                if qty <= 0:
                    raise ValueError("Quantity must be positive.")
                req = create_purchase_requisition(
                    material_id=mat_id,
                    quantity=qty,
                    requested_by=f"AI Agent (on behalf of {self.user.username})",
                    notes="Automated requisition proposed by WORKNEX AI Assistant",
                    db=self.db
                )
                result_data = {
                    "requisition_id": req.requisition_id,
                    "material_id": req.material_id,
                    "quantity": req.quantity,
                    "status": req.status,
                    "approval_required": True,
                    "notice": "Awaiting human-in-the-loop approval by an authorized Manager or Administrator."
                }
                status = "SUCCESS"
                result_str = f"Requisition {req.requisition_id} created. Status: {req.status}."

            elif tool_name == "get_inventory_summary":
                all_items = list_all_inventory(self.db)
                result_data = [item.model_dump() for item in all_items]
                status = "SUCCESS"
                result_str = f"Total {len(all_items)} materials in inventory."

            else:
                raise ValueError(f"Unknown MCP tool: {tool_name}")

            record_audit(
                tool_name=tool_name,
                arguments=args,
                result=result_str,
                actor=f"ai_assistant ({self.user.username})",
                action_type="AI_TOOL_EXECUTION",
                status="SUCCESS",
                db=self.db
            )

            return ToolExecutionInfo(
                tool_name=tool_name,
                arguments=args,
                result=result_data,
                status=status
            )

        except Exception as exc:
            record_audit(
                tool_name=tool_name,
                arguments=args,
                result=f"AI TOOL FAILED: {str(exc)}",
                actor=f"ai_assistant ({self.user.username})",
                action_type="AI_TOOL_EXECUTION",
                status="FAILURE",
                db=self.db
            )
            return ToolExecutionInfo(
                tool_name=tool_name,
                arguments=args,
                result={"error": str(exc)},
                status="FAILURE"
            )

    def process_chat(self, message: str, conversation_id: Optional[str] = None) -> AIChatResponse:
        """Process user message, determine tool calls, execute, and generate structured response."""
        now = datetime.now(timezone.utc)
        
        # Resolve or create conversation
        if not conversation_id:
            conversation_id = f"conv-{uuid.uuid4().hex[:8]}"
            conv = AIConversation(
                id=conversation_id,
                title=message[:50] + "..." if len(message) > 50 else message,
                user_id=self.user.id,
                created_at=now,
                updated_at=now
            )
            self.db.add(conv)
            self.db.commit()
        else:
            conv = self.db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
            if not conv:
                conv = AIConversation(
                    id=conversation_id,
                    title=message[:50],
                    user_id=self.user.id,
                    created_at=now,
                    updated_at=now
                )
                self.db.add(conv)
                self.db.commit()

        # Save user message
        user_msg = AIMessage(
            conversation_id=conversation_id,
            role="user",
            content=message,
            timestamp=now
        )
        self.db.add(user_msg)
        self.db.commit()

        msg_lower = message.lower()
        tool_executions: List[ToolExecutionInfo] = []
        assistant_reply = ""

        # Pattern Recognition for Enterprise Operations:
        
        # 1. Low stock items
        if any(k in msg_lower for k in ["low stock", "out of stock", "below reorder", "low-stock", "reorder point"]):
            tool_info = self.execute_tool("get_low_stock_items", {})
            tool_executions.append(tool_info)
            items = tool_info.result if isinstance(tool_info.result, list) else []
            if items:
                reply_lines = [
                    f"### ⚠️ Low-Stock Inventory Alert\n",
                    f"I found **{len(items)} items** that have fallen below their safety reorder thresholds:\n"
                ]
                for it in items:
                    reply_lines.append(
                        f"- **{it['material_id']}** ({it['description']}): **{it['quantity_on_hand']} units** on hand in `{it['warehouse']}` (Reorder threshold: {it['reorder_point']} units)."
                    )
                reply_lines.append(
                    "\n> **Recommendation:** Would you like me to generate purchase requisitions to replenish any of these materials?"
                )
                assistant_reply = "\n".join(reply_lines)
            else:
                assistant_reply = "✅ **All inventory items are currently well-stocked!** None are below their reorder threshold."

        # 2. Check specific inventory item
        elif any(k in msg_lower for k in ["check inventory", "check material", "stock of", "inventory for", "lookup"]):
            # Extract material code e.g. MAT-001, MAT-002, etc.
            match = re.search(r"\b(MAT-[A-Za-z0-9_-]+)\b", message, re.IGNORECASE)
            if match:
                mat_id = match.group(1).upper()
                tool_info = self.execute_tool("check_inventory", {"material_id": mat_id})
                tool_executions.append(tool_info)
                if tool_info.status == "SUCCESS":
                    it = tool_info.result
                    status_badge = "⚠️ Below Reorder Point" if it.get("below_reorder_point") else "✅ Sufficient Stock"
                    assistant_reply = (
                        f"### 📦 Inventory Status for `{it['material_id']}`\n\n"
                        f"- **Description:** {it['description']}\n"
                        f"- **Quantity on Hand:** {it['quantity_on_hand']} units\n"
                        f"- **Reorder Point:** {it['reorder_point']} units\n"
                        f"- **Warehouse Location:** `{it['warehouse']}`\n"
                        f"- **Status:** {status_badge}\n"
                    )
                else:
                    assistant_reply = f"❌ Could not find material `{mat_id}` in inventory."
            else:
                tool_info = self.execute_tool("get_inventory_summary", {})
                tool_executions.append(tool_info)
                assistant_reply = "Please specify a Material ID (e.g., `MAT-001` or `MAT-002`) to inspect. Here is the general overview of all warehouse stock."

        # 3. Create purchase requisition
        elif any(k in msg_lower for k in ["create requisition", "reorder", "replenish", "purchase requisition", "order more", "buy"]):
            if getattr(self.user, "role", "") == "Demo Visitor":
                assistant_reply = (
                    "🔒 **Demo Mode Restriction:** Proposing purchase requisitions or modifying database records is disabled in read-only Demo Mode. "
                    "Please sign in with an authorized Employee, Manager, or Administrator account to submit purchase requisitions."
                )
            else:
                mat_match = re.search(r"\b(MAT-[A-Za-z0-9_-]+)\b", message, re.IGNORECASE)
                qty_match = re.search(r"\b(\d+)\s*(units|pieces|items|qty)?\b", message, re.IGNORECASE)
                
                mat_id = mat_match.group(1).upper() if mat_match else None
                qty = int(qty_match.group(1)) if qty_match else 100
                
                if mat_id:
                    tool_info = self.execute_tool("create_requisition", {"material_id": mat_id, "quantity": qty})
                    tool_executions.append(tool_info)
                    if tool_info.status == "SUCCESS":
                        res = tool_info.result
                        assistant_reply = (
                            f"### 📋 Purchase Requisition Proposed\n\n"
                            f"I have successfully created **Requisition `{res['requisition_id']}`** for **{res['quantity']} units** of `{res['material_id']}`.\n\n"
                            f"- **Current Status:** `pending_approval`\n"
                            f"- **Human-in-the-Loop Policy:** As an AI assistant, I cannot approve requisitions. A manager or administrator must review and approve this requisition through the Procurement Center.\n"
                        )
                    else:
                        assistant_reply = f"❌ Failed to create requisition: {tool_info.result.get('error', 'Unknown error')}"
                else:
                    assistant_reply = "To create a purchase requisition, please provide the Material ID (e.g. `create requisition for MAT-002 with 150 units`)."

        # 4. Open Sales Orders
        elif any(k in msg_lower for k in ["open orders", "sales orders", "sales order", "pending orders", "order summary"]):
            tool_info = self.execute_tool("get_open_orders", {"status": "open", "limit": 10})
            tool_executions.append(tool_info)
            orders = tool_info.result if isinstance(tool_info.result, list) else []
            if orders:
                total_val = sum(float(o.get("total_value", 0)) for o in orders)
                reply_lines = [
                    f"### 📑 Open Sales Orders Summary\n",
                    f"There are currently **{len(orders)} open sales orders** with a combined total value of **${total_val:,.2f}**:\n"
                ]
                for o in orders[:5]:
                    reply_lines.append(f"- **{o['order_id']}** — Customer: *{o['customer_name']}*, Date: {o['order_date']}, Total: **${float(o['total_value']):,.2f}**")
                if len(orders) > 5:
                    reply_lines.append(f"\n*...and {len(orders) - 5} more open orders.*")
                assistant_reply = "\n".join(reply_lines)
            else:
                assistant_reply = "There are currently no open sales orders requiring processing."

        # 5. Pending Requisitions
        elif any(k in msg_lower for k in ["pending requisitions", "pending approval", "requisitions awaiting", "approval queue"]):
            tool_info = self.execute_tool("get_pending_requisitions", {})
            tool_executions.append(tool_info)
            reqs = tool_info.result if isinstance(tool_info.result, list) else []
            if reqs:
                reply_lines = [
                    f"### ⏳ Pending Purchase Requisitions\n",
                    f"There are **{len(reqs)} requisitions** awaiting managerial approval:\n"
                ]
                for r in reqs:
                    reply_lines.append(f"- **{r['requisition_id']}**: {r['quantity']} units of `{r['material_id']}` requested by *{r['requested_by']}* on {r['created_at'][:10] if r['created_at'] else 'N/A'}")
                reply_lines.append("\nAuthorized Managers can approve these directly via the **Procurement Management** page.")
                assistant_reply = "\n".join(reply_lines)
            else:
                assistant_reply = "There are currently no pending purchase requisitions in the approval queue."

        # 6. General operations or lowest inventory warehouse
        elif any(k in msg_lower for k in ["lowest inventory", "warehouse", "operations summary", "business status"]):
            tool_info = self.execute_tool("get_inventory_summary", {})
            tool_executions.append(tool_info)
            items = tool_info.result if isinstance(tool_info.result, list) else []
            wh_totals: Dict[str, int] = {}
            for it in items:
                wh = it.get("warehouse", "Unknown")
                wh_totals[wh] = wh_totals.get(wh, 0) + it.get("quantity_on_hand", 0)
            
            sorted_wh = sorted(wh_totals.items(), key=lambda x: x[1])
            lowest_wh = sorted_wh[0] if sorted_wh else ("None", 0)
            
            assistant_reply = (
                f"### 🏭 Operational Warehouse Breakdown\n\n"
                f"- **Warehouse with lowest stock level:** `{lowest_wh[0]}` with **{lowest_wh[1]} total units**.\n"
                f"- **Total warehouse distribution:**\n" +
                "\n".join([f"  - `{wh}`: {qty} units" for wh, qty in wh_totals.items()])
            )

        # 7. Fallback conversational reply
        else:
            assistant_reply = (
                f"Hello {self.user.full_name or self.user.username}! I am **WORKNEX AI**, your enterprise operations assistant.\n\n"
                "I can assist you with real-time enterprise management through our MCP tool integrations:\n\n"
                "- 📦 **Check Inventory:** *'Show all low-stock products'* or *'Check inventory for MAT-001'*\n"
                "- 🏭 **Warehouse Logistics:** *'Which warehouse has the lowest inventory?'*\n"
                "- 🛒 **Sales Pipeline:** *'Summarize open sales orders'*\n"
                "- 📋 **Procurement:** *'Create a purchase requisition for MAT-002 with 100 units'*\n"
                "- ⏳ **Approvals:** *'Show pending purchase requisitions'*\n\n"
                "How can I help you optimize your business operations today?"
            )

        # Record assistant reply in database
        assistant_msg = AIMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_reply,
            tool_calls=json.dumps([t.model_dump() for t in tool_executions]) if tool_executions else None,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(assistant_msg)
        self.db.commit()

        return AIChatResponse(
            conversation_id=conversation_id,
            response=assistant_reply,
            tool_executions=tool_executions
        )

