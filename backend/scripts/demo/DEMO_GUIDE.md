# Demo Data Guide

This directory contains demo SQL data and helper scripts for local setup and demonstrations.

## Files

```text
demo/
- demo_tenants.sql
- demo_tenants_fixed.sql
- demo_departments.sql
- demo_roles.sql
- demo_roles_fixed.sql
- demo_users.sql
- demo_menus_permissions.sql
- init_demo_data.sh
- init_demo_data.bat
- simple_roles.sql
- simple_users.sql
- demo_guide.md
```

## Main Data Files

### `demo_tenants.sql`

Seeds demo tenant records in the master database.

### `demo_departments.sql`

Seeds tenant department structures.
This file uses `{tenant_id}` placeholders and is intended to be rendered per tenant before import.

### `demo_roles.sql`

Seeds tenant roles.
This file also uses `{tenant_id}` placeholders.

### `demo_users.sql`

Seeds tenant users and related associations.
This file uses `{tenant_id}` and `{demo_password_hash}` placeholders.

### `demo_menus_permissions.sql`

Seeds menu and permission data.
This is mainly used for the enterprise demo tenant.

## Helper Scripts

### `init_demo_data.sh`

Linux/macOS/WSL helper for loading the demo SQL files.
It requires a demo user password at runtime and renders bcrypt hashes locally.

### `init_demo_data.bat`

Windows helper for loading the demo SQL files.
It also requires a demo user password at runtime and renders bcrypt hashes locally.

## Recommended Order

1. Load tenant records into the master database with `demo_tenants.sql`.
2. For each tenant database, replace `{tenant_id}` in:
   - `demo_departments.sql`
   - `demo_roles.sql`
   - `demo_users.sql`
3. Also replace `{demo_password_hash}` in `demo_users.sql`, or use the helper scripts to do it for you.
4. For the enterprise tenant, also load `demo_menus_permissions.sql`.

## Tooling

If you use backend helper tools instead of importing files manually:

- `go run ./cmd/tools/import-sql`
- `go run ./cmd/tools/seed-system-data`
- `go run ./cmd/tools/check-admin-permissions`

See `backend/cmd/tools/README.md` for tool details.

## Naming Baseline

Demo files in this directory now follow the backend-wide naming rule:

- SQL, shell, batch, and Python files use `snake_case`
- the old numbered demo file names were retired

## Notes

- These files are for local development and demos.
- Review the SQL before running it against a real environment.
- Do not commit real demo passwords or rendered bcrypt hashes back into the repository.
- The `_fixed` variants are historical compatibility files and should not be treated as the preferred baseline unless a specific scenario requires them.
