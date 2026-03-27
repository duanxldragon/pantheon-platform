# Backend AGENTS

> 本文件补充 `../AGENTS.md`，只约束 `backend/` 目录下的默认行为。

## 1. 先看什么

- 先读 `BACKEND_GUIDE.md`
- 再看 `docs/BACKEND_DOCS_INDEX.md`
- 涉及业务专题时，再进入：
  - `docs/auth/`
  - `docs/system/`
  - `docs/tenant/`

## 2. 目录职责

- `cmd/server/`：正式服务入口，保持薄
- `cmd/tools/`：开发与排障工具，不当成正式运维入口
- `internal/app/`：启动、装配、依赖注入
- `internal/modules/`：业务模块
- `internal/shared/`：跨模块共享基础设施
- `api/swagger/`：Swagger 生成产物

## 3. 默认分层

- `handler`：参数绑定、权限入口、统一响应
- `service`：业务规则、事务边界、模块协作
- `dao`：数据库读写
- `model`：持久化模型
- `dto`：请求响应模型
- `router`：路由注册

不要把这些职责混写。

## 4. 后端改动前必须先判断

- 这是平台级数据还是租户级数据？
- 是否会影响鉴权链路？
- 是否会影响会话、授权版本或 Redis 状态？
- 是否需要补迁移器、默认数据或工具脚本？

## 5. 明确禁止

- 不要把业务逻辑直接堆进 `app.Start()` 或 `main.go`
- 不要绕开租户上下文直接访问租户数据
- 不要只依赖前端传参做权限或租户判断
- 不要在 `handler` 里写大量业务编排
- 不要在 `dao` 里塞跨模块流程
- 不要手改 `api/swagger/` 生成产物，除非同时更新生成链路

## 6. 重点事项

### 认证

- 改认证前先读 `../docs/auth/AUTH_SECURITY.md`
- 不要破坏 `JWT + Refresh Token + Redis + revoked/version` 协作模型

### 多租户

- 涉及租户表结构时，检查是否需要注册租户迁移器
- 涉及初始化流程时，同时检查租户生命周期与数据库管理器

### 授权

- 权限、菜单、角色相关改动，要同时考虑 Casbin、授权刷新和会话联动

## 7. 验证基线

- 至少做与改动相称的验证
- 常用命令：
  - `make test`
  - `make lint`
  - `make migrate-only`
  - `make swagger`

## 8. 提交前

- 说明影响模块
- 说明是否涉及迁移、鉴权、租户隔离
- 说明实际跑过的验证
