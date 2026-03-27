# Backend Directory Entry

> This is the quick entry document for `backend/`.  
> If you are new to the backend folder, start here and then follow the reading order below.

## Directory Purpose

`backend/` mainly contains:

- `cmd/`: service entrypoints and developer tools
- `internal/`: business modules and shared backend infrastructure
- `docs/`: manually maintained backend implementation documents
- `api/swagger/`: generated Swagger output
- `scripts/`: initialization and demo scripts

## Recommended Reading Order

1. `backend/README.en.md`
2. `backend/BACKEND_GUIDE.en.md`
3. `backend/docs/BACKEND_DOCS_INDEX.en.md`
4. `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`
5. `backend/docs/BACKEND_NORMALIZATION_PLAN.en.md`
6. Continue into module topics:
   - `backend/docs/auth/AUTH_BACKEND.en.md`
   - `backend/docs/tenant/TENANT_BACKEND.en.md`
   - `backend/docs/system/SYSTEM_BACKEND.en.md`
7. Read `backend/cmd/tools/README.md` for tooling
8. Read `backend/api/swagger/` for generated API output

## Current Unified Rules

The backend now follows these conventions:

- primary layered files are fixed as `dao.go`, `dto.go`, `handler.go`, `model.go`, `router.go`, and `service.go`
- supplementary files use `<subject>_<kind>.go`
- command entrypoints keep `main.go`
- shared infrastructure prefers capability + kind naming

Single naming baseline:

- `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`

Batch execution plan:

- `backend/docs/BACKEND_NORMALIZATION_PLAN.en.md`

## Quick Navigation

If you need:

- startup flow, wiring, and infrastructure: `backend/BACKEND_GUIDE.en.md`
- module implementation details: `backend/docs/`
- naming and file organization rules: `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`
- single-batch normalization workflow: `backend/docs/BACKEND_NORMALIZATION_PLAN.en.md`
- tooling structure and usage: `backend/cmd/tools/README.md`

## Notes

- `backend/BACKEND_GUIDE.en.md` already includes the backend normalization summary
- check naming conventions before adding new backend files
- run `go run ./cmd/tools/check-backend-naming` before large backend renames or before merging naming-related changes
