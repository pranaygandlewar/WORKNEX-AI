from enum import Enum
from typing import List, Set

class RoleEnum(str, Enum):
    ADMINISTRATOR = "Administrator"
    MANAGER = "Manager"
    EMPLOYEE = "Employee"
    AI_AGENT = "AI Agent"

class PermissionEnum(str, Enum):
    # Inventory
    INVENTORY_READ = "inventory:read"
    INVENTORY_WRITE = "inventory:write"
    INVENTORY_ADJUST = "inventory:adjust"
    
    # Orders
    ORDERS_READ = "orders:read"
    ORDERS_WRITE = "orders:write"
    
    # Procurement
    REQUISITIONS_READ = "requisitions:read"
    REQUISITIONS_CREATE = "requisitions:create"
    REQUISITIONS_APPROVE = "requisitions:approve"
    REQUISITIONS_REJECT = "requisitions:reject"
    
    # Audit
    AUDIT_READ = "audit:read"
    
    # Users
    USERS_MANAGE = "users:manage"
    
    # System
    SYSTEM_MANAGE = "system:manage"
    
    # AI
    AI_CHAT = "ai:chat"

# Role permissions mapping
ROLE_PERMISSIONS: dict[RoleEnum, Set[PermissionEnum]] = {
    RoleEnum.ADMINISTRATOR: {
        PermissionEnum.INVENTORY_READ,
        PermissionEnum.INVENTORY_WRITE,
        PermissionEnum.INVENTORY_ADJUST,
        PermissionEnum.ORDERS_READ,
        PermissionEnum.ORDERS_WRITE,
        PermissionEnum.REQUISITIONS_READ,
        PermissionEnum.REQUISITIONS_CREATE,
        PermissionEnum.REQUISITIONS_APPROVE,
        PermissionEnum.REQUISITIONS_REJECT,
        PermissionEnum.AUDIT_READ,
        PermissionEnum.USERS_MANAGE,
        PermissionEnum.SYSTEM_MANAGE,
        PermissionEnum.AI_CHAT,
    },
    RoleEnum.MANAGER: {
        PermissionEnum.INVENTORY_READ,
        PermissionEnum.INVENTORY_WRITE,
        PermissionEnum.INVENTORY_ADJUST,
        PermissionEnum.ORDERS_READ,
        PermissionEnum.ORDERS_WRITE,
        PermissionEnum.REQUISITIONS_READ,
        PermissionEnum.REQUISITIONS_CREATE,
        PermissionEnum.REQUISITIONS_APPROVE,
        PermissionEnum.REQUISITIONS_REJECT,
        PermissionEnum.AUDIT_READ,
        PermissionEnum.AI_CHAT,
    },
    RoleEnum.EMPLOYEE: {
        PermissionEnum.INVENTORY_READ,
        PermissionEnum.ORDERS_READ,
        PermissionEnum.REQUISITIONS_READ,
        PermissionEnum.REQUISITIONS_CREATE,
        PermissionEnum.AI_CHAT,
    },
    RoleEnum.AI_AGENT: {
        PermissionEnum.INVENTORY_READ,
        PermissionEnum.ORDERS_READ,
        PermissionEnum.REQUISITIONS_READ,
        PermissionEnum.REQUISITIONS_CREATE,
        # Notice: AI_AGENT CANNOT approve requisitions or manage users/system
    },
}

def has_role_permission(role: str, permission: PermissionEnum) -> bool:
    try:
        r = RoleEnum(role)
        return permission in ROLE_PERMISSIONS.get(r, set())
    except ValueError:
        return False

