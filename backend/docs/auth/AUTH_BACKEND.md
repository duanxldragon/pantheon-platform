# 认证模块后端实现

## 定位

本文件只说明认证模块在后端的实现落点、调用链路和协作关系，不重复平台级业务设计。

- 业务边界：看 `docs/auth/AUTH_SECURITY.md`
- 会话刷新与强制失效规则：看 `docs/auth/AUTH_SESSION_STRATEGY.md`
- 租户初始化与生命周期：看 `docs/tenant/TENANT_INITIALIZATION.md`

---

## 核心代码入口

### 认证主链路

- 服务实现：`backend/internal/modules/auth/service.go`
- 服务拆分：`backend/internal/modules/auth/auth_service.go`
- 会话服务：`backend/internal/modules/auth/session_service.go`
- API Key 服务：`backend/internal/modules/auth/api_key_service.go`
- 登录尝试服务：`backend/internal/modules/auth/login_attempt_service.go`
- 2FA 服务：`backend/internal/modules/auth/two_factor_service.go`
- HTTP 处理器：`backend/internal/modules/auth/handler.go`
- 路由注册：`backend/internal/modules/auth/router.go`
- 数据访问：`backend/internal/modules/auth/dao.go`
- 请求响应模型：`backend/internal/modules/auth/dto.go`
- 2FA 模型与算法：`backend/internal/modules/auth/two_factor_auth.go`
- 认证错误翻译：`backend/internal/modules/auth/error_translator.go`
- 密码策略校验：`backend/internal/modules/auth/password_validator.go`
- API Key 中间件：`backend/internal/modules/auth/api_key_middleware.go`

### 中间件与授权联动

- JWT / Session 校验：`backend/internal/shared/middleware/auth_middleware.go`
- 授权版本与撤销时间：`backend/internal/shared/authorization/casbin_service.go`

---

## 规范化说明

认证模块已经按后端统一规则整理为固定主分层 + 主题补充文件：

- 主分层文件：`dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`
- 主题补充文件：`auth_service.go`、`session_service.go`、`api_key_service.go`、`login_attempt_service.go`、`two_factor_service.go`
- 辅助能力文件：`two_factor_auth.go`、`password_validator.go`、`error_translator.go`、`api_key_middleware.go`

这意味着：

- 主链路职责继续收敛在固定分层文件中；
- 登录、会话、API Key、登录安全、2FA 等复杂能力按主题拆开；
- 后续新增认证能力时，优先沿用 `<subject>_<kind>.go`，避免重新引入 `common.go`、`helper.go` 这类泛化命名。

完整规则见：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

---

## 路由分组

### 公共路由

由 `handler.go` 注册的公共认证接口主要包括：

- `GET /api/v1/auth/config`：获取公开认证配置；
- `POST /api/v1/auth/login`：用户名密码登录；
- `POST /api/v1/auth/2fa/login`：登录阶段二次认证；
- `POST /api/v1/auth/refresh`：Refresh Token 换新；
- `POST /api/v1/auth/unlock`：解锁账户；
- `GET /api/v1/auth/attempts`：查询登录尝试统计；
- `POST /api/v1/auth/validate-password`：校验密码策略。

### 受保护路由

登录后可访问的认证相关接口主要包括：

- `POST /api/v1/auth/logout`；
- `GET /api/v1/auth/2fa/status`；
- `POST /api/v1/auth/2fa/enable`；
- `POST /api/v1/auth/2fa/verify`；
- `POST /api/v1/auth/2fa/disable`；
- `POST /api/v1/auth/2fa/backup-codes`；
- `POST /api/v1/auth/2fa/verify-code`；
- `GET/POST/PUT/DELETE /api/v1/api-keys`。

这样划分后，登录前的身份建立、登录后的安全设置、API Key 管理边界都比较清楚。

---

## 后端实现主链路

### 1. 登录

`AuthService.Login()` 负责登录主流程，核心职责包括：

- 校验用户、密码、账号状态；
- 校验租户上下文；
- 处理默认管理员回退登录；
- 判断是否要求 2FA；
- 签发 `access_token + refresh_token`；
- 建立 Redis 会话态；
- 记录登录日志。

如果用户开启了 2FA，登录阶段不会直接签发正式会话，而是先下发临时 `temp_token`，等待 `/auth/2fa/login` 完成校验。

### 2. 2FA 登录完成

`AuthService.VerifyLogin2FA()` 负责衔接登录前半段与正式会话建立：

- 从临时 `temp_token` 中恢复用户和租户上下文；
- 校验 OTP 或备份码；
- 校验通过后再签发正式 token；
- 记录本次登录成功结果。

登录阶段的待验证态使用 Redis Key `auth:2fa:pending:{tempToken}` 管理。

### 3. 刷新与登出

`AuthService.RefreshToken()` 负责：

- 校验 refresh token；
- 检查 Redis 中 refresh session 是否仍然有效；
- 进行 refresh rotation；
- 重新签发 access / refresh token。

`AuthService.Logout()` 负责：

- 标记登出日志；
- 撤销当前会话；
- 写入用户级撤销时间，确保旧 token 不再可用。

---

## 会话校验与实时刷新

认证后端的关键不只是签 token，而是让 token 在运行期可控。

### 1. JWT Claims

`auth_middleware.go` 中的 Claims 至少承载：

- `user_id`
- `username`
- `tenant_id`
- `auth_version`
- 标准 JWT 注册声明

### 2. 中间件校验链路

`Auth()` 中间件会按顺序处理：

1. Bearer Token 解析；
2. JWT 签名与过期校验；
3. Redis `auth:session:{userID}:{jti}` 存在性校验；
4. Redis `auth:revoked_after:{userID}` 撤销时间校验；
5. Redis `auth:version:{userID}` 授权版本校验；
6. 将 `user_id`、`tenant_id`、`jti` 注入 Gin Context。

其中：

- `auth:revoked_after:*` 对应强制失效；
- `auth:version:*` 对应软刷新；
- 任一校验不通过都会返回 `401`，由前端决定 refresh 或回到登录页。

### 3. 与授权服务的协作

系统管理模块在用户、角色、权限、菜单变化后，会通过共享授权服务递增授权版本或写入撤销时间；认证模块只负责在请求入口执行校验与拦截。

---

## 2FA 与 API Key

### 1. 2FA

`two_factor_auth.go` 与 `service.go` 共同承担：

- TOTP 密钥生成；
- 二维码 URL 生成；
- 备份码生成与解析；
- OTP / 备份码校验；
- 启用、验证启用、关闭、重置备份码。

2FA 的管理入口在登录后接口中，也会被个人中心页面复用。

### 2. API Key

`AuthService` 已提供：

- 创建 API Key；
- 查询当前用户 API Key 列表；
- 更新名称与权限；
- 删除 API Key。

这部分能力适合给自动化任务或系统集成使用，但仍然受当前用户身份与权限边界约束。

---

## 认证模块与其他模块的协作

### 与 `system/` 的协作

- 用户停用、删除、改密：触发强制失效；
- 用户角色、角色权限、角色菜单变化：触发授权版本刷新；
- 个人中心中的密码、2FA、API Key 操作复用认证服务。

### 与 `tenant/` 的协作

- 登录与刷新都带租户上下文；
- 租户停用、删除会触发该租户用户会话撤销；
- 租户初始化未完成时，认证允许进入初始化向导，但不直接放行业务主界面。

---

## 阅读建议

1. 先读 `docs/auth/AUTH_SECURITY.md`
2. 再读 `docs/auth/AUTH_SESSION_STRATEGY.md`
3. 最后结合本文件进入 `backend/internal/modules/auth/` 与 `backend/internal/shared/middleware/`
