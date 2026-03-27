# 认证模块前端实现

## 定位

本文件只说明认证模块在前端的状态管理、页面入口和交互链路，不重复平台级业务设计。

- 业务边界：看 `docs/auth/AUTH_SECURITY.md`
- 会话刷新与强制失效规则：看 `docs/auth/AUTH_SESSION_STRATEGY.md`
- 租户初始化与生命周期：看 `docs/tenant/TENANT_INITIALIZATION.md`

---

## 核心代码入口

### 登录与状态管理

- 登录页：`frontend/src/modules/auth/views/Login.tsx`
- 认证 Store：`frontend/src/modules/auth/store/authStore.ts`
- 认证 API：`frontend/src/modules/auth/api/authApi.ts`
- API 客户端：`frontend/src/shared/utils/apiClient.ts`
- 刷新拦截器：`frontend/src/shared/utils/apiInterceptor.ts`
- 应用入口：`frontend/src/App.tsx`

### 个人中心与安全设置

- 个人资料：`frontend/src/modules/auth/profile/views/PersonalInfo.tsx`
- 安全设置：`frontend/src/modules/auth/profile/views/SecuritySettings.tsx`

---

## 前端状态模型

`authStore` 是认证模块的核心状态入口，除了常规 `user / accessToken / refreshToken` 外，还显式维护：

- `requires2FA`：当前登录是否等待二次认证；
- `tempToken`：登录阶段的临时验证 token；
- `enableMultiTenant`：当前是否启用多租户能力；
- `loginRequiresTenantCode`：登录页是否必须填写租户编码；
- `isFirstLogin`：租户是否首次登录；
- `tenantSetupRequired`：是否需要进入租户初始化向导；
- `tenantInfo`：当前租户摘要。

这意味着认证前端不仅关心“有没有 token”，还承担登录后首轮上下文初始化的分发职责。

---

## 登录闭环在前端如何落地

### 1. 公开配置预取

应用启动后会先调用 `authApi.getPublicConfig()`，把以下开关拉到前端：

- 是否启用多租户；
- 登录页是否必须输入租户编码；
- 是否启用 2FA。

因此登录页的展示不是纯静态页面，而是跟平台配置联动。

### 2. 用户名密码登录

`authStore.login()` 的核心流程是：

1. 校验本地锁定窗口；
2. 调用 `authApi.login()`；
3. 若后端返回 `require_2fa=true`，仅写入 `requires2FA + tempToken`；
4. 若后端直接返回正式 token，则写入用户、token、过期时间；
5. 清空历史标签页；
6. 依次执行 `reloadAuthorization()` 与 `checkTenantStatus()`。

登录成功后的初始化不是写完 token 就结束，而是继续补齐“权限 + 菜单 + 租户状态”。

### 3. 二次认证

`authStore.verify2FA()` 会：

- 读取前一步保存的 `tempToken`；
- 调用 `authApi.verifyLogin2FA()`；
- 在验证成功后写入正式 token；
- 再次执行 `reloadAuthorization()` 与 `checkTenantStatus()`。

因此 2FA 用户与非 2FA 用户最终都会收敛到同一条登录后初始化链路。

---

## 登录后初始化

### 1. 授权重载

`authStore.reloadAuthorization()` 当前做两件事情：

- `refreshCurrentUser()`：刷新当前用户主档；
- `loadPermissions()`：拉取权限集合。

权限集合会被后续页面、按钮、路由动态装载直接使用。

### 2. 权限匹配

`authStore` 内部已经实现：

- `hasPermission()`
- `hasRole()`
- `hasAnyPermission()`
- `hasAllPermissions()`

并支持通配权限和路径型权限匹配，因此新模块只要补权限码即可接入现有判断逻辑。

### 3. 系统与导航联动

登录成功、refresh 成功、授权刷新成功后，系统侧会继续：

- 初始化 `systemStore`；
- 让 `SidebarNew` 重新按菜单渲染导航；
- 让 `ViewManager` 按最新菜单与视图配置挂载页面。

这就是“角色-权限-菜单变更后，当前登录用户界面自动更新”的前端承接点。

---

## 自动刷新与失效处理

### 1. 刷新入口

`frontend/src/shared/utils/apiInterceptor.ts` 负责全局 refresh 协调，特点包括：

- 串行化 token 刷新，避免并发重复 refresh；
- refresh 成功后更新 `authStore` 中 token；
- refresh 成功后自动执行 `reloadAuthorization()`；
- 同步触发 `useSystemStore.getState().initialize()` 重建系统数据。

### 2. 失效表现

当 refresh 失败或后端返回不可恢复的 `401` 时：

- 调用 `authStore.logout()`；
- 清空标签页与系统缓存；
- 回到登录页；
- 给出“登录已过期，请重新登录”的统一提示。

这部分与 `docs/auth/AUTH_SESSION_STRATEGY.md` 中定义的软刷新 / 强制失效策略一一对应。

---

## 与租户初始化的联动

认证前端和租户前端是串联关系。

`authStore.checkTenantStatus()` 会在登录成功后：

- 判断是否启用多租户；
- 根据 `tenantCode` 调用租户状态接口；
- 写入 `isFirstLogin` 与 `tenantSetupRequired`；
- 若租户已初始化，再加载 `tenantInfo`。

`App.tsx` 再根据 `tenantSetupRequired` 决定：

- 渲染登录页；
- 渲染 `TenantSetupWizard`；
- 或进入正式业务主界面。

---

## 个人中心中的认证能力

个人中心虽然从系统管理入口进入，但安全相关能力都落在认证模块前端：

- 修改密码；
- 2FA 启用、验证、关闭；
- 备份码查看与重置；
- API Key 管理；
- 登录安全感知。

因此“个人中心”是系统管理的入口，“安全能力”是认证模块的实现。

---

## 阅读建议

1. 先读 `docs/auth/AUTH_SECURITY.md`
2. 再读 `docs/auth/AUTH_SESSION_STRATEGY.md`
3. 最后结合本文件进入 `frontend/src/modules/auth/`、`frontend/src/shared/utils/` 与 `frontend/src/App.tsx`
