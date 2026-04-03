# Backend Tools

`backend/cmd/tools/` contains developer-facing helper commands.
These tools are for local setup, troubleshooting, and data preparation.
They are not the production service entrypoint.

## Directory Rules

- Keep one tool per directory.
- Tool directory names use kebab-case.
- Executable entry files stay as `main.go`.
- Shared helper code lives under `backend/cmd/tools/internal/`.
- Internal helper files use `snake_case`.

Current layout:

```text
backend/cmd/tools/
- check-admin-permissions/
  - main.go
- check-backend-naming/
  - main.go
- import-sql/
  - main.go
- seed-system-data/
  - main.go
- setup-default-tenant/
  - main.go
- hash-password/
  - main.go
- verify-conn/
  - main.go
- internal/
  - tool_env/
    - tool_env.go
```

See `backend/docs/BACKEND_NAMING_CONVENTIONS.md` for the backend naming baseline.

## Environment Variables

These tools now rely on explicit environment variables instead of hard-coded local credentials.

Required MySQL variables:

- `PANTHEON_TOOL_MASTER_DSN`
- `PANTHEON_TOOL_MYSQL_ROOT_DSN`
- `PANTHEON_TOOL_MASTER_DB_HOST`
- `PANTHEON_TOOL_MASTER_DB_PORT`
- `PANTHEON_TOOL_MASTER_DB_NAME`
- `PANTHEON_TOOL_MASTER_DB_USER`
- `PANTHEON_TOOL_MASTER_DB_PASSWORD`

Required Redis variables:

- `PANTHEON_TOOL_REDIS_ADDR`

Optional Redis variables:

- `PANTHEON_TOOL_REDIS_PASSWORD`
- `PANTHEON_TOOL_REDIS_DB`

PowerShell example:

```powershell
$env:PANTHEON_TOOL_MASTER_DSN="root:password@tcp(127.0.0.1:3306)/pantheon_master?charset=utf8mb4&parseTime=True&loc=Local"
$env:PANTHEON_TOOL_MYSQL_ROOT_DSN="root:password@tcp(127.0.0.1:3306)/?charset=utf8mb4&parseTime=True&loc=Local"
$env:PANTHEON_TOOL_MASTER_DB_HOST="127.0.0.1"
$env:PANTHEON_TOOL_MASTER_DB_PORT="3306"
$env:PANTHEON_TOOL_MASTER_DB_NAME="pantheon_master"
$env:PANTHEON_TOOL_MASTER_DB_USER="root"
$env:PANTHEON_TOOL_MASTER_DB_PASSWORD="password"
$env:PANTHEON_TOOL_REDIS_ADDR="127.0.0.1:6379"
$env:PANTHEON_TOOL_REDIS_PASSWORD=""
$env:PANTHEON_TOOL_REDIS_DB="0"
```

## Tool Summary

### `verify-conn`

Checks local MySQL and Redis connectivity and verifies that the master database is reachable.

```bash
go run ./cmd/tools/verify-conn
```

### `setup-default-tenant`

Initializes the default platform tenant and wires default tenant database configuration.

```bash
go run ./cmd/tools/setup-default-tenant
```

### `hash-password`

Generates a bcrypt password hash for local bootstrap, demo SQL rendering, and manual seed preparation.

```bash
go run ./cmd/tools/hash-password "StrongDemoPass!2026"
```

### `seed-system-data`

Seeds baseline system module data, mainly for local demos and initial setup.

```bash
go run ./cmd/tools/seed-system-data
```

### `import-sql`

Imports selected SQL files from `backend/scripts/demo/`.
The current default input is `scripts/demo/demo_menus_permissions.sql`.

```bash
go run ./cmd/tools/import-sql
```

### `check-admin-permissions`

Checks whether the `admin` user, roles, menus, and authorization relations are wired correctly.

```bash
go run ./cmd/tools/check-admin-permissions
```

### `check-backend-naming`

Runs backend naming and layering checks.

It verifies:

- file naming under `backend/internal/`, `backend/cmd/`, and `backend/scripts/`
- required layered files for business modules
- leftover forbidden names such as `repository.go`, `controller.go`, and `entity.go`
- code-side `Repository` naming residues outside approved compatibility exceptions

```bash
go run ./cmd/tools/check-backend-naming
```

## Removed Tools

The following one-off or outdated scripts were intentionally removed:

- `fix-tenant-configs`
- `insert-tenant-configs`
- `setup-default-tenant-zero-id`
- `full-system-audit`

## Usage Notes

- These tools still assume a local development environment.
- Some tools depend on demo or bootstrap data shape.
- They are suitable for development, debugging, and demos, not as production operations tooling.
- `hash-password` is intended for local setup only; do not commit generated plaintext passwords.

## Windows Note

Avoid creating accidental `nul` files on Windows:

- In PowerShell, use `> $null` or `Out-Null`.
- In `cmd`, use `>nul 2>&1`.
- In Bash or WSL, use `>/dev/null 2>&1`.
