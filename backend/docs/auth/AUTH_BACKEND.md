# 认证模块后端实现

> 本文提供 `auth` 后端模块的中文实现入口。  
> 重点说明认证模块的实现入口、请求链路、运行时会话控制，以及它与中间件、授权服务之间的协作关系。

相关业务规则文档见：

- `docs/auth/AUTH_SECURITY.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/tenant/TENANT_INITIALIZATION.md`

---

## 1. 核心入口

- 服务入口：`backend/internal/modules/auth/service.go`
- 认证服务拆分：`backend/internal/modules/auth/auth_service.go`
- 会话服务：`backend/internal/modules/auth/session_service.go`
- API Key 服务：`backend/internal/modules/auth/api_key_service.go`
- 登录尝试服务：`backend/internal/modules/auth/login_attempt_service.go`
- 双因素认证服务：`backend/internal/modules/auth/two_factor_service.go`
- HTTP 处理器：`backend/internal/modules/auth/handler.go`
- 路由注册：`backend/internal/modules/auth/router.go`
- DAO：`backend/internal/modules/auth/dao.go`
- DTO：`backend/internal/modules/auth/dto.go`
- 模型：`backend/internal/modules/auth/model.go`
- 2FA 安全辅助：`backend/internal/modules/auth/two_factor_security.go`
- 密码校验：`backend/internal/modules/auth/password_validator.go`
- API Key 中间件：`backend/internal/modules/auth/api_key_middleware.go`

相关共享组件：

- 认证中间件：`backend/internal/shared/middleware/auth_middleware.go`
- 授权与会话联动：`backend/internal/shared/authorization/casbin_service.go`

---

## 2. 路由分组

### 公共接口

主要包括：

- `GET /api/v1/auth/config`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/2fa/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/unlock`
- `GET /api/v1/auth/attempts`
- `POST /api/v1/auth/validate-password`

### 登录后接口

主要包括：

- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/2fa/status`
- `POST /api/v1/auth/2fa/enable`
- `POST /api/v1/auth/2fa/verify`
- `POST /api/v1/auth/2fa/disable`
- `POST /api/v1/auth/2fa/backup-codes`
- `POST /api/v1/auth/2fa/verify-code`
- `GET/POST/PUT/DELETE /api/v1/auth/api-keys`

---

## 3. 主认证链路

### 登录

`AuthService.Login()` 负责：

- 校验用户名、密码和账号状态
- 校验租户上下文
- 处理默认管理员兜底登录
- 判断是否需要 2FA
- 生成 `access_token` 和 `refresh_token`
- 创建 Redis 会话态
- 记录登录日志

如果用户已启用 2FA，登录流程会先发放临时 `temp_token`，待 `/auth/2fa/login` 验证通过后再签发正式会话。

### 完成 2FA 登录

`AuthService.VerifyLogin2FA()` 负责：

- 根据 `temp_token` 恢复登录上下文
- 校验 OTP 或备份码
- 生成最终 Access / Refresh Token
- 记录成功登录结果

待完成登录状态保存在：

- `auth:2fa:pending:{tempToken}`

### 刷新与退出

`AuthService.RefreshToken()` 负责：

- 校验 Refresh Token
- 校验 Redis 中的 refresh 会话
- 执行 refresh token 轮换
- 签发新的 token 对

`AuthService.Logout()` 负责：

- 记录退出日志
- 让当前会话失效
- 写入 `auth:revoked_after:{userID}`，使旧 token 失效

---

## 4. 运行时会话校验

认证模块的核心不只是签发 JWT，还包括运行时持续控制。

`auth_middleware.go` 中的 claims 至少包括：

- `user_id`
- `username`
- `tenant_id`
- `auth_version`

中间件校验顺序：

1. 解析 Bearer Token
2. 校验签名和过期时间
3. 检查 `auth:session:{userID}:{jti}`
4. 检查 `auth:revoked_after:{userID}`
5. 检查 `auth:version:{userID}`
6. 向请求上下文注入 `user_id`、`tenant_id`、`jti`

实际效果：

- `auth:revoked_after:*` 用于硬失效
- `auth:version:*` 用于权限刷新和软刷新
- 任一检查失败都会返回 `401`

---

## 5. 与授权服务的协作

系统模块在以下场景会驱动认证态刷新：

- 用户禁用
- 用户删除
- 用户改密
- 管理员重置密码
- 角色、权限、菜单变化

分工如下：

- 系统模块负责识别业务动作并调用刷新接口
- 授权服务负责写入 `auth_version` 或 `revoked_after`
- 认证中间件在请求入口真正执行这些检查

---

## 6. 2FA 与 API Key

### 双因素认证

`two_factor_security.go` 和 `two_factor_service.go` 联合处理：

- TOTP Secret 生成
- QR Code URL 生成
- 备份码生成与解析
- OTP / 备份码校验
- 启用、确认、关闭与重置流程

### API Key

当前已支持：

- 创建 API Key
- 查询当前用户 API Key
- 更新 Key 名称和权限
- 删除 API Key

API Key 主要用于自动化调用，但仍受当前用户身份和权限边界约束。

---

## 7. 与其他模块的协作

### 与 `system`

- 用户、角色、权限、菜单变化会触发授权刷新
- 个人中心的改密、2FA、API Key 能力复用认证服务

### 与 `tenant`

- 登录与刷新始终携带租户上下文
- 租户禁用或删除会撤销该租户用户会话
- 未完成租户初始化时，登录后会进入初始化相关流程，而不是直接进入主业务界面

---

## 8. 推荐阅读顺序

1. `backend/BACKEND_GUIDE.md`
2. `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
3. `backend/docs/auth/AUTH_BACKEND.md`
4. 再结合 `docs/auth/` 下的安全与会话规则文档继续深入
