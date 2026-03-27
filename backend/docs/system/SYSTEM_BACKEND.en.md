# System Backend Implementation

> This document provides an English entry point for the backend system management module.  
> It focuses on assembly structure, submodule layout, request flow, and key authorization-related collaboration.

For the current detailed implementation reference in Chinese, see:

- `backend/docs/system/SYSTEM_BACKEND.md`

For business-level rules, see:

- `docs/system/SYSTEM_MANAGEMENT.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/tenant/TENANT_INITIALIZATION.md`

---

## Core Backend Entry Points

- System router: `backend/internal/modules/system/system_router.go`
- Container wiring: `backend/internal/modules/system/container/system_container.go`
- Shared system models: `backend/internal/modules/system/model/`

## Registered Submodules

- `backend/internal/modules/system/user/`
- `backend/internal/modules/system/dept/`
- `backend/internal/modules/system/position/`
- `backend/internal/modules/system/role/`
- `backend/internal/modules/system/permission/`
- `backend/internal/modules/system/menu/`
- `backend/internal/modules/system/dict/`
- `backend/internal/modules/system/log/`
- `backend/internal/modules/system/setting/`
- `backend/internal/modules/system/monitor/`

---

## Request Flow

The system module is mounted under the `/system` route group. A typical request path is:

1. enter `system_router.go`
2. pass authentication middleware
3. pass tenant middleware
4. pass authorization middleware when the global auth service is enabled
5. dispatch into the target submodule handler
6. process business rules in the service layer
7. access tenant-scoped data through DAO / repository logic

This means the core system-management capabilities run by default inside an authenticated, tenant-aware, and authorized context.

---

## Layering Structure

Most submodules keep the same backend layering:

- `handler.go`: HTTP input and response handling
- `service.go`: business rules and cross-object coordination
- `dao.go`: data access
- `dto.go`: request and response structs
- `model.go`: persistence mapping

This structure is consistently used in:

- `backend/internal/modules/system/user/`
- `backend/internal/modules/system/dept/`
- `backend/internal/modules/system/position/`
- `backend/internal/modules/system/role/`
- `backend/internal/modules/system/permission/`
- `backend/internal/modules/system/menu/`
- `backend/internal/modules/system/dict/`
- `backend/internal/modules/system/log/`
- `backend/internal/modules/system/setting/`

The monitor module is intentionally lighter and currently lives in:

- `backend/internal/modules/system/monitor/handler.go`
- `backend/internal/modules/system/monitor/service.go`

---

## Normalization Notes

The system module remains the main reference implementation for backend layering and naming conventions.

Current alignment includes:

- submodules consistently use `handler.go`, `service.go`, `dao.go`, `dto.go`, and `model.go`
- the `setting/` submodule already follows the fixed primary layered file names
- the `monitor/` submodule now uses explicit names such as `MonitorHandler` and `MonitorService`
- container wiring stays centralized in `container/system_container.go`

Future system submodules should keep this structure first, then add `<subject>_<kind>.go` files only when the primary layers are no longer enough.

See also:

- `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`

---

## Key Wiring Relationships

`system_container.go` is responsible for composing the system submodules with shared capabilities. It mainly does the following:

- initialize repositories / DAOs
- initialize services
- initialize handlers
- inject the transaction manager
- inject the authorization adapter
- inject validators and directory-style dependencies
- expose a unified routing surface

The most important integration points with the shared authorization service are:

- user-role writes
- role-permission writes
- role-menu writes
- online-user auth-version refresh
- user-level session revocation

---

## Core Implementation Paths

### User-role assignment

Key files:

- `backend/internal/modules/system/user/service.go`
- `backend/internal/modules/system/role/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

When user roles change, the backend must handle both:

- the business data relationship
- the authorization mapping

Updating only the business table without updating authorization will leave current permissions inconsistent.

### Role-permission assignment

Key files:

- `backend/internal/modules/system/role/service.go`
- `backend/internal/modules/system/permission/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

After a role permission change, the backend updates both the relationship data and the authorization rules, then refreshes auth results for online users that own the role.

### Role-menu assignment

Key files:

- `backend/internal/modules/system/role/service.go`
- `backend/internal/modules/system/menu/service.go`

Role-menu changes affect not only table data but also the post-login navigation tree and dynamic entry points on the frontend, so they are part of the authorization refresh path.

### Menu change propagation

Key files:

- `backend/internal/modules/system/menu/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

Changes to menu name, path, component, status, or deletion can affect mounted frontend pages. The backend therefore treats them as refresh-triggering changes, not as simple configuration edits.

### Department and position propagation

Key files:

- `backend/internal/modules/system/dept/service.go`
- `backend/internal/modules/system/position/service.go`

Department and position changes mostly affect organization context and data scope, but they can still affect what a logged-in user should see, so they also participate in refresh logic.

### User security-state changes

Key files:

- `backend/internal/modules/system/user/service.go`
- `backend/internal/modules/auth/service.go`

The following actions are treated as hard-invalidation scenarios:

- user disable
- user delete
- user password change
- admin password reset

The system module identifies the business action; the auth module performs the actual session revocation.

---

## Tenant Context

All core system-management data is tenant-scoped, so the backend must ensure:

- each request is bound to a tenant context
- users, departments, positions, roles, permissions, menus, logs, and settings are isolated per tenant
- role assignment, menu binding, and permission writes validate tenant ownership
- query endpoints never read system-management data across tenants

---

## Recommended Reading Order

1. `backend/BACKEND_GUIDE.en.md`
2. `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`
3. `backend/docs/system/SYSTEM_BACKEND.en.md`
4. `backend/docs/system/SYSTEM_BACKEND.md` for the full current implementation detail
