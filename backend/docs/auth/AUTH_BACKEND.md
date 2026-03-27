# 认证模块后端实现

> 本文提供 `auth` 后端模块的中文实现入口。  
> 重点说明认证模块的实现入口、请求链路、运行时会话控制，以及它与中间件、授权服务之间的协作关系。

业务规则相关文档见：

- `docs/auth/AUTH_SECURITY.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/tenant/TENANT_INITIALIZATION.md`

---

## 核心实现入口

- 服务入口：`backend/internal/modules/auth/service.go`
- 认证服务拆分：`backend/internal/modules/auth/auth_service.go`
- 会话服务：`backend/internal/modules/auth/session_service.go`
- API Key 服务：`backend/internal/modules/auth/api_key_service.go`
- 登录尝试服务：`backend/internal/modules/auth/login_attempt_service.go`
- 双因素认证服务：`backend/internal/modules/auth/two_factor_service.go`
- HTTP 处理器：`backend/internal/modules/auth/handler.go`
- 路由注册：`backend/internal/modules/auth/router.go`
- DAO：`backend/internal/modules/auth/dao.go`
- 请求和响应 DTO：`backend/internal/modules/auth/dto.go`
- 双因素认证模型：`backend/internal/modules/auth/model.go`
- 双因素安全辅助：`backend/internal/modules/auth/two_factor_security.go`
- 错误翻译：`backend/internal/modules/auth/error_translator.go`
- 密码校验：`backend/internal/modules/auth/password_validator.go`
- API Key 中间件：`backend/internal/modules/auth/api_key_middleware.go`

## 相关共享组件

- 认证中间件：`backend/internal/shared/middleware/auth_middleware.go`
- 授权与会话失效联动：`backend/internal/shared/authorization/casbin_service.go`

---

## 规范化结果

认证模块现在已经对齐统一后端分层模式：

- 主分层文件：`dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`
- 补充服务文件：`auth_service.go`、`session_service.go`、`api_key_service.go`、`login_attempt_service.go`、`two_factor_service.go`
- 辅助文件：`two_factor_security.go`、`password_validator.go`、`error_translator.go`、`api_key_middleware.go`

这使主认证流程保持稳定，同时把登录、会话、API Key、登录安全和 2FA 逻辑拆到更清晰的文件边界中。

命名基线见：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

---

## 路由分组

### 公共路由

公共认证接口主要包括：

- `GET /api/v1/auth/config`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/2fa/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/unlock`
- `GET /api/v1/auth/attempts`
- `POST /api/v1/auth/validate-password`

### 受保护路由

登录后可访问的认证接口主要包括：

- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/2fa/status`
- `POST /api/v1/auth/2fa/enable`
- `POST /api/v1/auth/2fa/verify`
- `POST /api/v1/auth/2fa/disable`
- `POST /api/v1/auth/2fa/backup-codes`
- `POST /api/v1/auth/2fa/verify-code`
- `GET/POST/PUT/DELETE /api/v1/api-keys`

这种拆分保证了身份建立、登录后安全操作和 API Key 管理的边界清晰。

---

## 主要后端流程

### 1. 登录

`AuthService.Login()` 是主登录入口，负责：

- 校验用户、密码和账号状态
- 校验租户上下文
- 处理默认管理员回退登录
- 判断是否需要双因素认证
- 生成 `access_token + refresh_token`
- 创建基于 Redis 的会话状态
- 记录登录日志

如果用户已经启用 2FA，登录流程不会立刻创建最终会话，而是先发放临时 `temp_token`，等待 `/auth/2fa/login` 完成校验。

### 2. 完成 2FA 登录

`AuthService.VerifyLogin2FA()` 负责把登录前半段与最终会话建立衔接起来：

- 从 `temp_token` 恢复用户和租户上下文
- 校验 OTP 或备份码
- 生成最终 Token 对
- 记录成功登录结果

待完成登录状态保存在 Redis 的 `auth:2fa:pending:{tempToken}` 下。

### 3. 刷新和退出

`AuthService.RefreshToken()` 负责：

- 校验 Refresh Token
- 检查 Redis 中的 Refresh 会话是否仍然有效
- 执行 Refresh Token 轮换
- 下发新的 Access / Refresh Token 对

`AuthService.Logout()` 负责：

- 记录退出日志
- 使当前会话失效
- 写入用户级 `revoked_after` 时间戳，使旧 Token 停止生效

---

## 运行时会话校验

认证模块的关键价值不仅是签发 JWT，还包括在运行时持续控制它们。

### JWT Claims

`auth_middleware.go` 中的 Claims 至少包括：

- `user_id`
- `username`
- `tenant_id`
- `auth_version`
- 标准 JWT Registered Claims

### 中间件校验链

`Auth()` 中间件按以下顺序处理请求：

1. 解析 Bearer Token
2. 校验 JWT 签名和过期时间
3. 检查 Redis Key `auth:session:{userID}:{jti}`
4. 检查 Redis Key `auth:revoked_after:{userID}`
5. 检查 Redis Key `auth:version:{userID}`
6. 向 Gin Context 注入 `user_id`、`tenant_id` 和 `jti`

实际效果：

- `auth:revoked_after:*` 支持硬失效
- `auth:version:*` 支持软刷新和权限刷新
- 任一检查失败都会返回 `401`

### 与授权服务的协作

系统模块在用户、角色、权限、菜单变更后负责提升认证版本或写入 `revoked_after`；认证模块负责在请求入口执行这些检查。

---

## 双因素认证与 API Key

### 双因素认证

`two_factor_security.go` 联合认证服务处理：

- TOTP Secret 生成
- QR Code URL 生成
- 备份码生成与解析
- OTP / 备份码校验
- 启用、启用确认、关闭和重置备份码流程

### API Key 管理

认证模块当前已经支持：

- 创建 API Key
- 查询当前用户 API Key
- 更新 Key 名称和权限
- 删除 API Key

这套能力主要用于自动化集成，但仍然受当前用户和权限边界约束。

---

## 与其他模块的协作

### 与 `system/`

- 用户禁用、删除、改密会触发硬失效
- 角色、权限、菜单变更会触发 `auth_version` 刷新
- 个人中心的密码、2FA、API Key 操作复用认证服务

### 与 `tenant/`

- 登录和刷新流程始终携带租户上下文
- 租户禁用和删除会撤销该租户用户的会话
- 未完成租户初始化时，可以引导用户进入初始化流程，而不是直接进入主业务界面

---

## 推荐阅读顺序

1. `backend/BACKEND_GUIDE.md`
2. `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
3. `backend/docs/auth/AUTH_BACKEND.md`
4. 再结合 `docs/auth/` 下的安全和会话规则文档继续深入
