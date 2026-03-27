# Backend Naming Conventions

> This document defines the naming rules under `backend/` so modules, shared infrastructure, tools, and scripts follow one consistent convention.

## Scope

These rules apply to:

- `backend/internal/modules/`
- `backend/internal/shared/`
- `backend/internal/app/`
- `backend/internal/config/`
- `backend/cmd/`
- `backend/scripts/`

Generated files are exceptions when the generator has a stable default, for example:

- `backend/api/swagger/docs.go`

## Core Rules

- Use lowercase `snake_case` for file names.
- Keep the same responsibility under the same file name across modules.
- Use fixed names for primary layered files.
- Use `<subject>_<kind>.go` for supplementary files.
- Use module-specific exported type names instead of overly generic names like `Service`, `Repository`, or `Handler`.

## Primary Layered Files

Business modules use these fixed file names:

- `dao.go`
- `dto.go`
- `handler.go`
- `model.go`
- `router.go`
- `service.go`

Example:

```text
internal/modules/system/user/
- dao.go
- dto.go
- handler.go
- model.go
- router.go
- service.go
```

Do not introduce alternative names such as:

- `repository.go`
- `controller.go`
- `entity.go`

## Supplementary Files

When a module grows beyond the primary files, use:

```text
<subject>_<kind>.go
```

Examples:

- `auth_service.go`
- `session_service.go`
- `api_key_service.go`
- `backup_service.go`
- `quota_service.go`
- `user_validation.go`
- `notification_mapper.go`
- `template_renderer.go`
- `tool_env.go`

### Subject

Prefer a concrete business or technical subject:

- `auth`
- `session`
- `quota`
- `backup`
- `template`
- `notification`
- `tool`

Avoid vague subjects such as:

- `common`
- `misc`
- `helper`

### Kind

Common suffixes include:

- `service`
- `handler`
- `router`
- `middleware`
- `validator`
- `validation`
- `mapper`
- `renderer`
- `provider`
- `initializer`
- `manager`
- `factory`
- `record`
- `bootstrap`

## Type Naming

### DAO

Prefer `DAO` consistently instead of mixing `Repository` and `DAO`.

Prefer:

- `UserDAO`
- `SettingDAO`
- `TenantDAO`
- `NotificationDAO`

Avoid:

- `DAO`
- `Repository`

Private implementations should also stay specific:

- `userDAO`
- `settingDAO`

Constructors should match:

- `NewUserDAO`
- `NewSettingDAO`

### Service

Prefer:

- `AuthService`
- `TenantService`
- `MonitorService`

Avoid:

- `Service`

Private implementations:

- `authService`
- `tenantService`
- `monitorService`

Constructors:

- `NewAuthService`
- `NewMonitorService`

### Handler

Prefer:

- `AuthHandler`
- `SettingHandler`
- `NotificationHandler`

Avoid:

- `Handler`

Constructors:

- `NewAuthHandler`
- `NewSettingHandler`
- `NewNotificationHandler`

## Directory-Level Rules

### `internal/modules/`

- One business subdomain per directory.
- Start with the fixed six layered files.
- If the service logic grows too large, split by subdomain into files like `<subject>_service.go`.

### `internal/shared/`

- Keep `snake_case`.
- Prefer capability + kind naming, such as:
  - `base_dao.go`
  - `database_initializer.go`
  - `storage_provider.go`
  - `data_masking.go`

### `internal/app/`

- Use semantic bootstrap-oriented names for application assembly.
- Current convention:
  - `app_bootstrap.go`

### `cmd/`

- Keep executable entrypoints as `main.go`.
- The directory name must describe the tool purpose, for example:
  - `check-admin-permissions`
  - `seed-system-data`
  - `setup-default-tenant`

Tool-internal helper files still follow `snake_case`, for example:

- `tool_env.go`

### `scripts/`

- Use `snake_case` for SQL, Python, and shell scripts.
- Prefer `init_<subject>.sql` for initialization scripts.
- Prefer `fix_<subject>.sql` for fix scripts.
- Prefer `insert_<subject>.py` for insert/import scripts.

## Recommended Examples

### Small Module

```text
internal/modules/example/
- dao.go
- dto.go
- handler.go
- model.go
- router.go
- service.go
```

### Medium Module

```text
internal/modules/auth/
- dao.go
- dto.go
- handler.go
- model.go
- router.go
- service.go
- auth_service.go
- session_service.go
- api_key_service.go
- two_factor_service.go
```

### Shared Infrastructure

```text
internal/shared/storage/
- storage_provider.go
- local_storage.go
- s3_storage.go
```

## Anti-Patterns

Avoid file names like:

- `repository.go`
- `controller.go`
- `entity.go`
- `common.go`
- `util.go`
- `helpers.go`
- `misc.go`
- `temp.go`

These names are too broad, hide responsibility, and make code search harder.

## File Creation Decision Order

Before adding a new file, decide in this order:

1. Can it stay inside an existing `dao.go`, `dto.go`, `handler.go`, `model.go`, `router.go`, or `service.go`?
2. If not, can it be split by subdomain into `<subject>_service.go` or another specific supplementary file?
3. If it is technical support code, can it be named `<subject>_<kind>.go`?
4. If the best name you can think of is `common`, `util`, or `helper`, the responsibility probably needs to be split more clearly first.

## Normalization Results

This backend normalization work has already converged several major areas:

- `auth` now uses the fixed layered files and supplementary files such as `auth_service.go`, `session_service.go`, `api_key_service.go`, `login_attempt_service.go`, and `two_factor_service.go`
- `tenant` now follows the fixed `dao/dto/handler/model/router/service` layering with additional `*_service.go` files where needed
- `notification` renamed `repository.go` to `dao.go` and aligned handler naming with `NotificationHandler`
- selected `system` submodules now use the same exported type and constructor naming pattern
- `internal/app/app.go` was normalized to `app_bootstrap.go`
- shared infrastructure names were normalized, for example:
  - `base_repository.go` -> `base_dao.go`
  - `database.go` -> `database_initializer.go`
  - `storage.go` -> `storage_provider.go`
  - `masking.go` -> `data_masking.go`

## Final Convention Summary

The backend now follows these rules:

- Primary layered files: `dao.go`, `dto.go`, `handler.go`, `model.go`, `router.go`, `service.go`
- Supplementary files: `<subject>_<kind>.go`
- Tool entrypoints: keep `main.go`, express purpose in the directory name
- Generated files: keep the generator default unless there is a strong reason not to
