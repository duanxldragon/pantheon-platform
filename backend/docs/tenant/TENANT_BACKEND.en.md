# Tenant Backend Implementation

> This document provides an English entry point for the backend tenant module implementation.  
> It focuses on tenant lifecycle entry points, database onboarding, initialization flow, and runtime collaboration.

For the current detailed implementation reference in Chinese, see:

- `backend/docs/tenant/TENANT_BACKEND.md`

For business-level rules, see:

- `docs/tenant/TENANT_INITIALIZATION.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/system/SYSTEM_MANAGEMENT.md`

---

## Core Backend Entry Points

### Tenant master data

- Service entry: `backend/internal/modules/tenant/service.go`
- Backup service: `backend/internal/modules/tenant/backup_service.go`
- Quota service: `backend/internal/modules/tenant/quota_service.go`
- HTTP handler: `backend/internal/modules/tenant/handler.go`
- Route registration: `backend/internal/modules/tenant/router.go`
- DAO: `backend/internal/modules/tenant/dao.go`
- Model: `backend/internal/modules/tenant/model.go`
- Quota model: `backend/internal/modules/tenant/quota_model.go`
- DTOs: `backend/internal/modules/tenant/dto.go`

### Tenant database onboarding

- Database manager and tenant pool: `backend/internal/shared/database/`
- Distributed locking and cache support: `backend/internal/shared/cache/`

---

## Normalization Notes

The tenant module now follows the unified backend layering:

- primary layered files: `dao.go`, `dto.go`, `handler.go`, `model.go`, `router.go`, `service.go`
- supplementary service files: `backup_service.go`, `quota_service.go`
- supplementary model file: `quota_model.go`

This keeps tenant master data, database onboarding, and lifecycle logic in the primary layers while moving backup and quota concerns into focused files.

See also:

- `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`

---

## Route Groups

### Public routes

The public tenant endpoints mainly cover:

- `POST /api/v1/tenants/register`
- `GET /api/v1/tenants/status`
- `POST /api/v1/tenants/test-connection`

### Protected routes

The authenticated tenant endpoints mainly cover:

- `POST /api/v1/tenants/setup`
- `GET /api/v1/tenants/current`
- `GET /api/v1/tenants/list`
- `POST /api/v1/tenants/switch/:id`
- `GET /api/v1/tenants/:id/quotas`
- `PUT /api/v1/tenants/:id/quotas`

---

## Initialization Flow

### 1. Create tenant master record

`TenantService.CreateTenant()` currently:

- generates the tenant ID
- writes name, code, and description
- sets status to `active`
- sets `IsFirstLogin` to `true`

This step only opens the tenant on the platform side. It does not mean the tenant database is already usable.

### 2. Query initialization status

`TenantService.GetTenantStatus()` reads:

- the tenant master record
- whether a tenant database configuration already exists

The response includes fields such as:

- `databaseConfigured`
- `isFirstLogin`
- `tenantId`
- `tenantCode`
- `tenantName`
- `status`
- `databaseType`

The frontend uses this result to decide whether the user should enter the initialization wizard after login.

### 3. Test connection

`DatabaseService.TestConnection()` builds the DSN and then delegates to `database.Manager` for the real connection test.

This keeps test-connection and formal setup on the same database construction rules.

### 4. Submit tenant database setup

`DatabaseService.SetupDatabase()` is the most important backend entry point for tenant setup. The path includes:

1. parse `tenantID`
2. acquire distributed lock `tenant:init:{tenantID}`
3. load the tenant master record
4. build the tenant DSN
5. call `dbManager.ConnectTenant()` to connect and run tenant migrations
6. encrypt the database password
7. create or update `TenantDatabaseConfig`
8. set `IsFirstLogin` to `false`
9. return `InitializedModules`

`InitializedModules` comes from `dbManager.GetTenantMigratorNames()` and acts as the extension anchor for future modules joining the setup pipeline.

### 5. Startup recovery

`DatabaseService.LoadAllTenants()` reloads historical tenant database configs after service startup and reconnects them into the pool.

That allows already initialized tenants to survive backend restarts without manual re-onboarding.

---

## Lifecycle and Runtime Collaboration

### Suspend tenant

`TenantService.SuspendTenant()`:

- sets tenant status to `disabled`
- revokes sessions for users under the tenant
- removes the tenant connection from `dbManager`

### Delete tenant

`TenantService.DeleteTenant()`:

- revokes tenant user sessions first
- deletes the tenant master record
- closes and removes the tenant database connection

This means tenant lifecycle changes are naturally linked to auth-session control, not just to a status field update.

---

## Quotas and Context Capabilities

### Current tenant info

`GetCurrentTenantInfo()` returns the current tenant summary used by frontend tenant badges, setup-complete status, and context switching.

### Tenant switching

The backend already reserves `switch/:id` as the boundary for future multi-tenant switching scenarios.

### Quota management

The handler layer is already wired for reading and updating tenant quotas. This is the natural governance point for plans, feature switches, and resource limits.

---

## Collaboration With Other Modules

### With `auth/`

- post-login tenant status controls whether the user can enter the business UI
- tenant disable and delete trigger session revocation through `SessionRevoker`
- full tenant business context is established only after setup is complete

### With `system/`

After the tenant database is connected and migrated, system-management tables and future business module tables can join the same initialization path.

---

## Recommended Reading Order

1. `backend/BACKEND_GUIDE.en.md`
2. `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`
3. `backend/docs/tenant/TENANT_BACKEND.en.md`
4. `backend/docs/tenant/TENANT_BACKEND.md` for the full current implementation detail
