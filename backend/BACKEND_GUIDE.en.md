# Pantheon Platform Backend

> **High-Performance Go 1.23+ Modular Backend Architecture**  
> Gin, GORM, Casbin, JWT, Redis, Multi-Tenant Isolation
>
> Naming rules are documented in `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`.  
> The backend docs index is `backend/docs/BACKEND_DOCS_INDEX.en.md`.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Structure](#module-structure)
3. [API Design Specs](#api-design-specs)
4. [Database Design](#database-design)
5. [Casbin RBAC Design & Integration](#casbin-rbac-design--integration)
6. [Database Initialization Logic](#database-initialization-logic)
7. [Authentication & Authorization Flow](#authentication--authorization-flow)
8. [Multi-Tenant Architecture](#multi-tenant-architecture)
9. [i18n Error Handling](#i18n-error-handling)
10. [Code Standards](#code-standards)
11. [Adding a New Business Module](#adding-a-new-business-module)
12. [Security Design](#security-design)
13. [Performance Optimization](#performance-optimization)
14. [Development & Build](#development--build)

---

## Architecture Overview

### Layered Architecture

```text
HTTP Request
  -> Middleware Chain
  -> Handler Layer
  -> Service Layer
  -> DAO / Repository Layer
  -> Model / Entity Layer
```

### Layer Responsibilities

- **Middleware Chain**: recovery, logging, CORS, security headers, auth, tenant binding, authorization
- **Handler Layer**: parse HTTP params, validate input, call services, build responses
- **Service Layer**: business rules, cross-module collaboration, transaction boundaries
- **DAO / Repository Layer**: all GORM query logic and persistence operations
- **Model / Entity Layer**: persistence structs, table mapping, tags, indexes

---

## Module Structure

Each business module follows a consistent layered file structure:

| File | Responsibility |
|:---|:---|
| `model.go` | GORM struct and persistence mapping |
| `dto.go` | Request and response DTOs |
| `dao.go` | Database operations encapsulation |
| `service.go` | Business logic, validation, and coordination |
| `handler.go` | HTTP handlers |
| `router.go` | Route registration |

Primary layered files use fixed names:

- `dao.go`
- `dto.go`
- `handler.go`
- `model.go`
- `router.go`
- `service.go`

Supplementary files use `<subject>_<kind>.go`, for example:

- `user_validation.go`
- `template_renderer.go`
- `session_service.go`
- `database_initializer.go`

### Command Entry Layout

- `cmd/server/`: production server entrypoint
- `cmd/tools/`: bootstrap, diagnosis, repair, and maintenance tools
- each tool keeps its executable entry as `main.go`
- helper files inside tool packages still use `snake_case`

---

## API Design Specs

### RESTful Style

Resource names use plural nouns and module prefixes.

```text
# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/api-keys
POST   /api/v1/auth/api-keys
DELETE /api/v1/auth/api-keys/:id
POST   /api/v1/auth/2fa/enable
POST   /api/v1/auth/2fa/verify

# Tenants
GET    /api/v1/tenants/list
POST   /api/v1/tenants/register

# System - Users
GET    /api/v1/system/users
POST   /api/v1/system/users
GET    /api/v1/system/users/:id
PUT    /api/v1/system/users/:id
DELETE /api/v1/system/users/:id
PATCH  /api/v1/system/users/status
PATCH  /api/v1/system/users/:id/password

# Notifications
GET    /api/v1/notifications
POST   /api/v1/notifications/send
GET    /api/v1/notifications/inbox
GET    /api/v1/notifications/templates
```

### Unified Response Format

**Success**

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

**Paginated Success**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 100,
      "total_pages": 10
    }
  }
}
```

**Error**

```json
{
  "code": 40001,
  "message": "auth.login.invalid_credentials",
  "data": null
}
```

The `message` field is an i18n key. The frontend translates it via `t(message)`.

---

## Database Design

### Master DB (`pantheon_master`)

| Table | Purpose |
|:---|:---|
| `tenants` | Tenant metadata |
| `tenant_database_configs` | Tenant DB connection configs |
| `tenant_quotas` | Tenant quotas |
| `translations` | i18n translation data |
| `notifications` | Notification message bodies |
| `notification_inboxes` | User inbox state |
| `notification_templates` | Notification templates |
| `notification_jobs` | Async notification queue |

### Tenant DB (`pantheon_{tenant_code}`)

| Table | Purpose |
|:---|:---|
| `users` | Users |
| `sys_roles` | Roles |
| `sys_permissions` | Permission tree |
| `sys_user_roles` | User-role mapping |
| `sys_role_permissions` | Role-permission mapping |
| `sys_role_menus` | Role-menu mapping |
| `sys_departments` | Department tree |
| `sys_positions` | Positions |
| `sys_menus` | Menus |
| `sys_operation_logs` | Operation logs |
| `sys_login_logs` | Login logs |
| `sys_configs` | Settings |
| `sys_dict_types` | Dictionary types |
| `sys_dict_data` | Dictionary items |
| `casbin_rule` | Casbin policy storage |

---

## Casbin RBAC Design & Integration

### Model (`config/rbac_model.conf`)

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && (keyMatch(r.obj, p.obj) || keyMatch2(r.obj, p.obj)) && (r.act == p.act || p.act == "*")
```

- `sub`: subject, usually user ID or role ID
- `obj`: object, usually API path
- `act`: action, usually HTTP method

### Policy Examples

```text
p, {role_id}, /api/v1/users, GET
p, {role_id}, /api/v1/users, POST
p, {super_admin_id}, /api/v1/*, *
g, {user_id}, {role_id}
```

### Multi-Tenant Casbin Isolation

`AuthorizationService` maintains independent enforcers per tenant:

```go
type AuthorizationService struct {
    masterEnforcer  *casbin.Enforcer
    tenantEnforcers map[string]*casbin.Enforcer
    mu              sync.RWMutex
}
```

It lazily creates tenant enforcers and selects the correct one via `ctx.Value("tenant_id")`.

---

## Database Initialization Logic

### Startup Sequence

```text
1. Load config
2. Connect to master DB
3. Auto-migrate when enabled
4. Initialize monitor DB
5. Initialize database manager
6. Initialize Redis
7. Initialize authorization service
8. Bootstrap default data
9. Exit early when migrate_only=true
10. Register tenant migrators
11. Load existing tenant DB connections
12. Start HTTP server
```

### Tenant DB Initialization

When a new tenant is created:

1. create `tenants` record
2. save encrypted DB config to `tenant_database_configs`
3. test the new DB connection
4. register the tenant DB in the connection pool
5. run all registered `TenantMigrator` implementations

### TenantMigrator Interface

```go
type TenantMigrator interface {
    MigrateTenantDB(db *gorm.DB) error
    SeedTenantDB(db *gorm.DB, tenantID string) error
}
```

---

## Authentication & Authorization Flow

### JWT Login

```text
POST /auth/login
  1. Get tenant DB
  2. Query user
  3. Compare password hash
  4. Check account status
  5. Generate access token
  6. Generate refresh token
  7. Record login log
  8. Return tokens and user info
```

### JWT Claims

```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "username": "admin",
  "iat": 1234567890,
  "exp": 1234574890,
  "iss": "pantheon-platform"
}
```

### Middleware Chain Per Request

```text
1. Auth middleware parses JWT and writes user_id / tenant_id into context
2. Tenant middleware loads tenant DB and writes tenant_db into context
3. Casbin middleware reads user and path information and enforces policy
```

---

## Multi-Tenant Architecture

### Dynamic DB Switching

```text
Tenant Middleware:
  1. Read tenant_id from JWT claims or header
  2. Validate tenant status
  3. DBManager.GetTenantDB(tenant_id)
     - Cache hit: return *gorm.DB directly
     - Cache miss: query config, decrypt password, connect, cache
  4. Write tenant DB into context as "tenant_db"
  5. Handler / Service / DAO reads tenant DB from context
```

### Password Encryption

Tenant DB passwords are stored AES-256 encrypted:

```go
encrypted, _ := crypto.Encrypt(plainPassword, encryptionKey)
plain, _ := crypto.Decrypt(encrypted, encryptionKey)
```

`encryption_key` must be exactly 32 bytes in production.

---

## i18n Error Handling

### Rule

Never return hardcoded business text directly from handlers.

```go
// Wrong
c.JSON(400, gin.H{"message": "Invalid username or password"})

// Correct
response.BadRequest(c, "INVALID_CREDENTIALS", "auth.login.invalid_credentials", "")
```

### Key Naming Convention

```text
{module}.{operation}.{status}

Examples:
auth.login.invalid_credentials
auth.login.user_not_found
system.user.create.success
tenant.not_found
common.unauthorized
```

---

## Code Standards

### Naming

| Type | Convention | Example |
|:---|:---|:---|
| Package | singular lowercase | `tenant`, `user` |
| File | snake_case | `handler.go`, `user_validation.go` |
| Interface | suffix `er` | `TenantMigrator` |
| Struct | PascalCase | `TenantService` |
| Public func | PascalCase | `GetByID`, `CreateUser` |
| Private func | camelCase | `hashPassword` |

See also:

- `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`

### Error Handling

```go
// Wrap with context
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}

// In handlers, use the response package
if err != nil {
    response.InternalError(c, "USER_CREATE_FAILED", "system.user.create.failed", err.Error())
    return
}
```

### DB Operations

```go
// Always read DB from context in multi-tenant flows
func (r *UserRepository) GetByID(ctx context.Context, id string) (*User, error) {
    db := ctx.Value("tenant_db").(*gorm.DB)
    // ...
}

// Keep transaction boundaries in the service layer
func (s *UserService) Create(ctx context.Context, req *CreateRequest) error {
    db := ctx.Value("tenant_db").(*gorm.DB)
    return db.Transaction(func(tx *gorm.DB) error {
        txCtx := context.WithValue(ctx, "tenant_db", tx)
        // ...
        return nil
    })
}
```

---

## Adding a New Business Module

Example workflow:

1. define `model.go`
2. define `dto.go`
3. implement `dao.go`
4. implement `service.go`
5. implement `handler.go`
6. register routes in `router.go`
7. register tenant migrator in `app_bootstrap.go` when needed
8. wire permissions, logs, and i18n integration

---

## Security Design

### Security Response Headers

Typical headers include:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### Password Security

- bcrypt storage
- configurable password policy
- never log raw passwords or password hashes

### Rate Limiting

```yaml
security:
  rate_limit:
    enabled: true
    requests_per_minute: 100
    requests_per_hour: 1000
```

---

## Performance Optimization

### Redis Caching

| Data | TTL |
|:---|:---|
| Tenant DB config | 1 hour |
| JWT blacklist | Token remaining lifetime |
| Dictionary data | 30 minutes |
| System settings | 10 minutes |

### Connection Pool

```yaml
master_db:
  max_open_conns: 100
  max_idle_conns: 10
  conn_max_lifetime: 3600
```

---

## Development & Build

```bash
# Run development server
go run ./cmd/server

# Migration only
go run ./cmd/server --migrate-only

# Generate Swagger docs
swag init -g cmd/server/main.go -o api/swagger

# Run all tests
go test ./...

# Build binary
go build -o bin/pantheon-server ./cmd/server
```

---

## Backend Normalization Summary

This backend cleanup aligned naming, layering, and shared infrastructure conventions across the codebase.

### Unified Rules

- primary layered files are fixed as `dao.go`, `dto.go`, `handler.go`, `model.go`, `router.go`, and `service.go`
- supplementary files use `<subject>_<kind>.go`
- command entrypoints keep `main.go`
- shared infrastructure prefers capability-oriented names such as `base_dao.go` and `database_initializer.go`
- exported type names must keep module meaning instead of generic names such as `Service` or `Handler`

### Normalized Modules

The main normalized modules include:

- `internal/modules/auth/`
- `internal/modules/tenant/`
- `internal/modules/notification/`
- selected submodules under `internal/modules/system/`

Examples:

- `auth` now includes `auth_service.go`, `session_service.go`, `api_key_service.go`, `login_attempt_service.go`, and `two_factor_service.go`
- `tenant` now consistently uses the fixed layered files plus focused `*_service.go` files
- `notification` renamed `repository.go` to `dao.go`
- selected `system` submodules aligned constructor and exported type naming

### Normalized Shared Layers

The shared cleanup covered:

- `internal/shared/database/`
- `internal/shared/i18n/`
- `internal/shared/middleware/`
- `internal/shared/storage/`
- `internal/shared/constants/`
- `internal/shared/docs/`

Representative renames:

- `internal/app/app.go` -> `internal/app/app_bootstrap.go`
- `internal/shared/database/base_repository.go` -> `internal/shared/database/base_dao.go`
- `internal/shared/database/database.go` -> `internal/shared/database/database_initializer.go`
- `internal/shared/storage/storage.go` -> `internal/shared/storage/storage_provider.go`
- `internal/shared/utils/masking.go` -> `internal/shared/utils/data_masking.go`

### Ongoing Rule

For future backend files, use `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md` as the single naming baseline.

---

*Pantheon Backend - Scalable, Secure, Modular*
