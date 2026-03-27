# 后端开发工具

`backend/cmd/tools/` 只保留仍有明确用途的开发辅助脚本。

## 目录命名与文件组织规则

`backend/cmd/tools/` 统一遵循当前后端命名规范：

- 每个工具一个独立目录；
- 目录名使用小写短语加连字符，直接表达工具用途；
- 可执行入口统一保留 `main.go`；
- 工具内部辅助文件统一使用小写 `snake_case`；
- 多个工具复用的辅助能力统一下沉到 `backend/cmd/tools/internal/`。

当前目录组织示例：

```text
backend/cmd/tools/
├─ check-admin-permissions/
│  └─ main.go
├─ import-sql/
│  └─ main.go
├─ seed-system-data/
│  └─ main.go
├─ setup-default-tenant/
│  └─ main.go
├─ verify-conn/
│  └─ main.go
└─ internal/
   └─ toolenv/
      └─ tool_env.go
```

推荐规则如下：

- 新工具目录继续沿用 `check-admin-permissions`、`seed-system-data` 这类“动作 + 对象”风格；
- 不要把工具目录命名成 `misc`、`helper-tools`、`temp` 这类泛化名称；
- 不要把多个独立工具塞进同一个目录；
- 如果工具内部开始出现多个职责文件，继续使用 `snake_case`，例如 `tool_env.go`、`sql_loader.go`、`tenant_checker.go`。

完整规则见：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

## 环境变量

这些工具已切换为强制环境变量模式：

- 不再内置数据库与 Redis 的默认账号密码；
- 缺少关键环境变量时，脚本会直接退出；
- 只有 `PANTHEON_TOOL_REDIS_PASSWORD` 与 `PANTHEON_TOOL_REDIS_DB` 保留最小兜底：
  - `PANTHEON_TOOL_REDIS_PASSWORD` 默认空字符串；
  - `PANTHEON_TOOL_REDIS_DB` 默认 `0`。

### 必填：MySQL

- `PANTHEON_TOOL_MASTER_DSN`：主库 DSN，用于大多数工具
- `PANTHEON_TOOL_MYSQL_ROOT_DSN`：不带固定库名的 MySQL DSN，主要给 `verify-conn` 使用
- `PANTHEON_TOOL_MASTER_DB_HOST`：主库主机
- `PANTHEON_TOOL_MASTER_DB_PORT`：主库端口
- `PANTHEON_TOOL_MASTER_DB_NAME`：主库数据库名
- `PANTHEON_TOOL_MASTER_DB_USER`：主库用户名
- `PANTHEON_TOOL_MASTER_DB_PASSWORD`：主库密码

### 必填：Redis

- `PANTHEON_TOOL_REDIS_ADDR`：Redis 地址

### 可选：Redis

- `PANTHEON_TOOL_REDIS_PASSWORD`：Redis 密码，默认空字符串
- `PANTHEON_TOOL_REDIS_DB`：Redis DB 编号，默认 `0`

### 快速开始

建议先复制 `backend/cmd/tools/tools.env.example`，再按本地环境修改后导入。

### PowerShell 示例

```powershell
$env:PANTHEON_TOOL_MASTER_DSN="root:password@tcp(127.0.0.1:3306)/pantheon_master?charset=utf8mb4&parseTime=True&loc=Local"
$env:PANTHEON_TOOL_MYSQL_ROOT_DSN="root:password@tcp(127.0.0.1:3306)/?charset=utf8mb4&parseTime=True&loc=Local"
$env:PANTHEON_TOOL_MASTER_DB_HOST="127.0.0.1"
$env:PANTHEON_TOOL_MASTER_DB_PORT="3306"
$env:PANTHEON_TOOL_MASTER_DB_NAME="pantheon_master"
$env:PANTHEON_TOOL_MASTER_DB_USER="root"
$env:PANTHEON_TOOL_MASTER_DB_PASSWORD="password"
$env:PANTHEON_TOOL_REDIS_ADDR="127.0.0.1:6379"
$env:PANTHEON_TOOL_REDIS_PASSWORD="your-redis-password"
$env:PANTHEON_TOOL_REDIS_DB="0"
```

## 保留脚本

### `verify-conn`

用途：

- 验证本地 MySQL 连接；
- 验证本地 Redis 连接；
- 确认主数据库可创建。

运行方式：

```bash
go run ./cmd/tools/verify-conn
```

### `setup-default-tenant`

用途：

- 初始化默认平台租户；
- 补默认租户数据库配置；
- 把 `admin` 用户关联到默认租户。

运行方式：

```bash
go run ./cmd/tools/setup-default-tenant
```

### `seed-system-data`

用途：

- 为系统管理模块注入基础菜单数据；
- 适合本地演示或初始化最小菜单树。

运行方式：

```bash
go run ./cmd/tools/seed-system-data
```

### `import-sql`

用途：

- 导入指定的演示 SQL 文件；
- 当前脚本主要面向 `scripts/demo/` 下的补数据场景。

运行方式：

```bash
go run ./cmd/tools/import-sql
```

### `check-admin-permissions`

用途：

- 检查 `admin` 用户与角色、菜单、授权规则关联是否完整；
- 适合本地排障与初始化异常修复。

运行方式：

```bash
go run ./cmd/tools/check-admin-permissions
```

## 已删除脚本

以下脚本已删除，因为它们属于重复方案、一次性修复脚本，或已明显落后于当前代码结构：

- `fix-tenant-configs`
- `insert-tenant-configs`
- `setup-default-tenant-zero-id`
- `full-system-audit`

## 使用约束

这些工具目前仍然带有明显的开发环境假设，例如：

- 部分脚本仍依赖演示数据结构；
- 并没有做成正式运维工具链；
- 仍适合开发、演示、排障，不适合直接用于生产。

## 避免产生异常 `nul` 文件

如果你在 Windows 下手工执行命令，请注意不同 Shell 的空输出写法不同：

- PowerShell：使用 `> $null` 或 `Out-Null`
- `cmd`：使用 `>nul 2>&1`
- Bash / WSL：使用 `>/dev/null 2>&1`

不要在 PowerShell 里直接写 `> nul`，否则可能在项目目录里生成异常的 `nul` 文件。
