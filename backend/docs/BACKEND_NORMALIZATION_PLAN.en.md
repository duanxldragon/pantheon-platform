# Backend Normalization Execution Plan

> This document defines the batch workflow for normalizing `backend/` naming, layering, file organization, and documentation.  
> In future iterations, `continue with the backend normalization plan` is enough to execute this checklist without step-by-step confirmation.

## Goals

- standardize backend layering as `dao / dto / handler / model / router / service`
- standardize file naming as fixed primary layered files plus `<subject>_<kind>.go`
- standardize exported types, private implementations, constructors, and container getters
- standardize shared infrastructure and bootstrap file naming
- keep code, docs, and verification aligned so the rules do not drift again

## Unified Rules

### Primary Layered Files

Business modules use these fixed files:

- `dao.go`
- `dto.go`
- `handler.go`
- `model.go`
- `router.go`
- `service.go`

Exceptions:

- aggregation namespaces do not need to force the six-file layout
- model-only namespaces may stay model-focused
- runtime-only monitoring modules may omit persistence-oriented layers when they would be artificial
- compatibility-driven metadata field names may remain as isolated exceptions, such as `json:"repository"`, but they must not reintroduce `Repository` naming into code

### Supplementary Files

When the primary files become too large, use:

```text
<subject>_<kind>.go
```

Examples:

- `auth_service.go`
- `session_service.go`
- `api_key_service.go`
- `backup_service.go`
- `user_validation.go`
- `database_initializer.go`

### Type Naming

- use `DAO` consistently instead of mixing in `Repository`
- exported types must stay domain-specific, such as `UserDAO`, `AuthService`, and `NotificationHandler`
- private implementations stay specific, such as `userDAO` and `authService`
- constructors use `New<Type>()`
- container getters use `Get<Type>()`

## Batch Execution Checklist

### 1. Baseline Scan

- scan `backend/internal/` for `repository.go`, `controller.go`, and `entity.go`
- scan exported types, constructors, and container getters for leftover `Repository` naming
- scan modules for missing primary layered files
- scan for garbled comments, broken doc links, and historical naming leftovers

### 2. Module Normalization

Process these module groups in batches:

- `backend/internal/modules/auth/`
- `backend/internal/modules/tenant/`
- `backend/internal/modules/system/`
- `backend/internal/modules/notification/`

For each module:

1. align `dao.go / dto.go / handler.go / model.go / router.go / service.go`
2. split oversized `service.go` files into `<subject>_service.go`
3. standardize `DAO / Service / Handler` type naming
4. standardize constructors and dependency wiring
5. remove obsolete file names and garbled comments

If a directory is an aggregation namespace, a model-only namespace, or a runtime-only module, document the exception instead of adding fake layers.

### 3. Shared Layer Normalization

Process:

- `backend/internal/shared/`
- `backend/internal/app/`
- `backend/internal/config/`

Rules:

- prefer capability + kind naming such as `base_dao.go` and `storage_provider.go`
- bootstrap and assembly files should use purpose-specific names such as `app_bootstrap.go`
- avoid vague file names such as `common.go`, `util.go`, and `helpers.go`

### 4. Tooling and Script Normalization

Process:

- `backend/cmd/`
- `backend/scripts/`

Rules:

- tool directory names should express purpose, while executable entrypoints may keep `main.go`
- internal helper files still use `snake_case`
- SQL, shell, and Python scripts use `snake_case`

### 5. Documentation Sync

Keep these documents aligned:

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
- `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`
- `backend/docs/BACKEND_DOCS_INDEX.md`
- `backend/docs/BACKEND_DOCS_INDEX.en.md`
- `backend/README.md`
- `backend/README.en.md`
- `backend/BACKEND_GUIDE.md`
- `backend/BACKEND_GUIDE.en.md`

Requirements:

- rules, examples, and entry links must match the current codebase
- historical rename examples may remain, but they must stay clearly documented as historical context
- Chinese and English docs should be updated together when adding entry links or execution guidance

### 6. Formatting and Verification

Run this after each batch of structural changes:

```powershell
$env:GOCACHE=(Resolve-Path .).Path + '\backend\.gocache'
cd backend
gofmt -w ./internal/...
go test ./...
```

Partial module tests are acceptable during iteration, but final closure requires one full `backend` test pass.

## Acceptance Criteria

- `backend/internal/` does not introduce new `repository.go`, `controller.go`, or `entity.go`
- code no longer mixes `Repository` and `DAO`
- new modules start from the fixed six layered files
- approved exception directories are explicitly documented instead of being padded with artificial files
- supplementary files follow `<subject>_<kind>.go`
- major backend documentation entrypoints point to the current rules
- `gofmt` and `go test ./...` both pass

## Invocation

If you want this handled as a single batch in future turns, any of these instructions is sufficient:

- `continue with the backend normalization plan`
- `continue with BACKEND_NORMALIZATION_PLAN`
- `finish the remaining backend naming normalization`

Default behavior:

- no file-by-file confirmation
- continue in module-sized batches
- report only phase results, risks, and verification outcomes
