# Backend AGENTS

This file extends `../AGENTS.md` and applies only to work inside `backend/`.

## Read First

- Start with `BACKEND_GUIDE.md`.
- Then read `docs/BACKEND_DOCS_INDEX.md`.
- For module details, continue into `docs/auth/`, `docs/system/`, and `docs/tenant/`.

## Directory Responsibilities

- `cmd/server/`: production service entrypoint
- `cmd/tools/`: developer and troubleshooting tools
- `internal/app/`: bootstrap and dependency wiring
- `internal/modules/`: business modules
- `internal/shared/`: shared backend infrastructure
- `api/swagger/`: generated Swagger output

## Default Layering

- `handler`: request binding, permission entry, unified HTTP response
- `service`: business rules, transaction boundaries, cross-object orchestration
- `dao`: database access
- `model`: persistence models
- `dto`: request and response payloads
- `router`: route registration

Do not mix these responsibilities casually.

## Required Checks Before Editing

Decide up front:

- Is the data platform-level or tenant-level?
- Will the change affect authentication or authorization?
- Will it affect session state, token versioning, or Redis state?
- Does it require migrations, seed data, or tool updates?

## Hard Restrictions

- Do not pile business logic into `app.Start()` or `main.go`.
- Do not bypass tenant context when touching tenant data.
- Do not rely on frontend parameters alone for permission or tenant checks.
- Do not put large orchestration logic into `handler`.
- Do not put cross-module process logic into `dao`.
- Do not edit generated Swagger output by hand unless the generation path is updated as well.

## Special Focus Areas

### Authentication

- Read `../docs/auth/AUTH_SECURITY.md` before changing auth flows.
- Preserve the `JWT + Refresh Token + Redis + revoked/version` model.

### Multi-tenant

- When changing tenant schema, verify whether tenant migrations must be registered.
- When changing bootstrap flow, also check tenant lifecycle and database manager behavior.

### Authorization

- Permission, menu, and role changes must consider Casbin, authorization refresh, and session effects together.

## Verification Baseline

Run checks proportional to the change.

Common commands:

- `make -f backend/Makefile naming`
- `make -f backend/Makefile test`
- `make -f backend/Makefile verify`
- `make -f backend/Makefile migrate-only`
- `make -f backend/Makefile swagger`

If `make` is unavailable or unstable in the current Windows shell, run the equivalent Go commands directly inside `backend/`.

## Before Handoff

- State which modules were affected.
- State whether migrations, auth, or tenant isolation were touched.
- State which verification commands actually ran.
