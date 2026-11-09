# WORKNEX AI — REST API Reference

All endpoints are versioned under `/api/v1`. Authentication is passed via `Authorization: Bearer <JWT_ACCESS_TOKEN>` unless noted.

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint       | Access        | Description                                         |
| :----- | :------------- | :------------ | :-------------------------------------------------- |
| `POST` | `/auth/login`  | Public        | Authenticates credentials with Argon2. Returns JWT. |
| `POST` | `/auth/logout` | Authenticated | Logs out current session and audits event.          |
| `GET`  | `/auth/me`     | Authenticated | Returns currently authenticated user profile.       |

## 2. Dashboard (`/api/v1/dashboard`)

| Method | Endpoint               | Access        | Description                                                           |
| :----- | :--------------------- | :------------ | :-------------------------------------------------------------------- |
| `GET`  | `/dashboard/overview`  | Authenticated | Returns real KPI metrics, inventory valuation, and distribution data. |
| `GET`  | `/dashboard/analytics` | Authenticated | Revenue velocity, order mix, and low stock ratios.                    |
| `GET`  | `/dashboard/activity`  | Authenticated | Recent business operations from audit log.                            |

## 3. Inventory Management (`/api/v1/inventory`)

| Method  | Endpoint                          | Access        | Description                                               |
| :------ | :-------------------------------- | :------------ | :-------------------------------------------------------- |
| `GET`   | `/inventory`                      | Authenticated | Lists items with search, warehouse, and category filters. |
| `GET`   | `/inventory/low-stock`            | Authenticated | Retrieves materials strictly below reorder points.        |
| `GET`   | `/inventory/movements`            | Authenticated | Returns historical stock movement audit trail.            |
| `GET`   | `/inventory/warehouses`           | Authenticated | Lists warehouse facilities.                               |
| `GET`   | `/inventory/{material_id}`        | Authenticated | Single material stock status.                             |
| `POST`  | `/inventory`                      | Manager/Admin | Registers a new material item.                            |
| `PATCH` | `/inventory/{material_id}`        | Manager/Admin | Updates metadata or reorder points.                       |
| `POST`  | `/inventory/{material_id}/adjust` | Manager/Admin | Adjusts stock level. Rejects negative quantities.         |

## 4. Sales Orders (`/api/v1/orders`)

| Method  | Endpoint             | Access        | Description                                                   |
| :------ | :------------------- | :------------ | :------------------------------------------------------------ |
| `GET`   | `/orders`            | Authenticated | Lists sales orders with status filtering and customer search. |
| `GET`   | `/orders/{order_id}` | Authenticated | Inspects single order.                                        |
| `POST`  | `/orders`            | Manager/Admin | Creates a new sales order.                                    |
| `PATCH` | `/orders/{order_id}` | Manager/Admin | Updates status (open, processing, closed, cancelled).         |

## 5. Procurement & Approvals (`/api/v1/requisitions`)

| Method | Endpoint                                 | Access        | Description                                                     |
| :----- | :--------------------------------------- | :------------ | :-------------------------------------------------------------- |
| `GET`  | `/requisitions`                          | Authenticated | Lists requisitions (approval tokens redacted for non-managers). |
| `GET`  | `/requisitions/{requisition_id}`         | Authenticated | Single requisition details.                                     |
| `POST` | `/requisitions`                          | Authenticated | Proposes requisition in `pending_approval`. Masks token.        |
| `POST` | `/requisitions/{requisition_id}/approve` | Manager/Admin | Approves requisition and updates stock.                         |
| `POST` | `/requisitions/{requisition_id}/reject`  | Manager/Admin | Rejects requisition with reason.                                |

## 6. AI Assistant (`/api/v1/ai`)

| Method | Endpoint                 | Access        | Description                                                 |
| :----- | :----------------------- | :------------ | :---------------------------------------------------------- |
| `POST` | `/ai/chat`               | Authenticated | Processes conversational query with MCP tool orchestration. |
| `GET`  | `/ai/conversations`      | Authenticated | Lists user's past conversational threads.                   |
| `GET`  | `/ai/conversations/{id}` | Authenticated | Retrieves conversation message thread.                      |

## 7. Compliance & Audit (`/api/v1/audit`)

| Method | Endpoint            | Access        | Description                                                |
| :----- | :------------------ | :------------ | :--------------------------------------------------------- |
| `GET`  | `/audit`            | Manager/Admin | Lists append-only compliance logs with search and filters. |
| `GET`  | `/audit/{event_id}` | Manager/Admin | Inspects specific event arguments and results.             |

## 8. Users & RBAC (`/api/v1/users`)

| Method  | Endpoint           | Access        | Description                                 |
| :------ | :----------------- | :------------ | :------------------------------------------ |
| `GET`   | `/users`           | Administrator | Lists all enterprise accounts.              |
| `POST`  | `/users`           | Administrator | Creates new user with Argon2 password hash. |
| `PATCH` | `/users/{user_id}` | Administrator | Updates user account, role, or credentials. |
| `GET`   | `/users/roles`     | Authenticated | Lists valid system roles.                   |

## 9. System Management (`/api/v1/system`)

| Method | Endpoint           | Access        | Description                                        |
| :----- | :----------------- | :------------ | :------------------------------------------------- |
| `GET`  | `/system/health`   | Public        | Readiness and connectivity status.                 |
| `GET`  | `/system/settings` | Authenticated | System configuration metadata (no secrets leaked). |
