# 认证模块前端实现

## 定位

本文件只说明认证模块在前端的状态管理、页面入口和交互链路，不重复平台级业务设计。

- 业务边界：看 `docs/auth/AUTH_SECURITY.md`
- 会话刷新与强制失效规则：看 `docs/auth/AUTH_SESSION_STRATEGY.md`
- 租户初始化与生命周期：看 `docs/tenant/TENANT_INITIALIZATION.md`

---

## 核心代码入口

### 登录与状态管理

- 登录页：`frontend/src/modules/auth/views/login/index.tsx`
- 认证 Store：`frontend/src/modules/auth/store/auth_store.ts`
- 认证 API：`frontend/src/modules/auth/api/auth_api.ts`
- API 客户端：`frontend/src/shared/utils/api_client.ts`
- 刷新协调入口：`frontend/src/shared/utils/api_client.ts`
- 顶栏退出入口：`frontend/src/components/top_bar.tsx`
- 应用入口：`frontend/src/App.tsx`

### 个人中心与安全设置

- 个人中心路由页：`frontend/src/modules/auth/profile/profile_center/index.tsx`
- 账户设置路由页：`frontend/src/modules/auth/profile/account_settings/index.tsx`
- 个人资料：`frontend/src/modules/auth/profile/views/personal_info/index.tsx`
- 安全设置：`frontend/src/modules/auth/profile/views/security_settings/index.tsx`

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

当前登录页还额外做了两层体验收口：

- 多租户模式下默认收起租户编码输入，只有需要时再展开；
- 当后端识别到租户编码时，会在登录页给出租户预览反馈。
- 登录页现在也把“记住账号信息”显式接到界面：启用后会保留用户名，并在租户登录模式下同步保留租户代码；关闭后会一并清空本地记忆项，避免 Hook 已支持但页面无入口的状态割裂。

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
- 让动态视图运行时按最新菜单与视图配置挂载页面。

这就是“角色-权限-菜单变更后，当前登录用户界面自动更新”的前端承接点。

---

## 自动刷新与失效处理

### 1. 刷新入口

`frontend/src/shared/utils/api_client.ts` 负责全局 refresh 协调，特点包括：

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

### 3. 主动退出

当前主动退出不再依赖独立“退出页”，而是由顶栏统一发起：

1. 用户在 `TopBar` 中点击退出；
2. 前端先弹出确认对话框，提示保存当前工作；
3. 确认后调用 `authStore.logout()`；
4. 清空认证态、系统缓存与标签页；
5. 由路由守卫把用户带回 `/login`。

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

其中 API Key 管理当前还补了统一确认链路：

- 删除密钥前会先弹出平台级确认弹窗；
- 删除成功后立即从列表移除；
- 这样可以避免高风险安全操作继续依赖浏览器原生确认框。

2FA 与会话管理当前也已经收口到真实前端链路：

- 关闭 2FA 不再使用浏览器 `prompt`，而是改为平台对话框输入当前密码；
- 会话管理页不再展示本地 mock 数据，而是直接调用 `/v1/auth/sessions`；
- 单个会话终止走 `kickSession(jti)`，并通过统一确认弹窗承接高风险操作；
- “终止其他会话” 当前采用前端遍历非当前会话逐个撤销的方式，保持与现有后端接口能力一致。

因此“个人中心”是系统管理的入口，“安全能力”是认证模块的实现。

个人资料页中的基础资料与头像更新当前采用“本地即时更新 + 服务端权威回刷”模式：

- 页面先调用 `authApi.updateProfile()` 完成保存；
- 再执行 `authStore.refreshCurrentUser()` 回刷当前用户主档；
- 顶栏用户摘要、个人中心卡片与资料表单因此保持一致；
- 这样可以避免只依赖前端本地合并，导致遗漏后端归一化字段或最新登录态摘要。

当前 Router 已明确拆分两类入口：

- `/profile`：个人中心总览；
- `/profile/settings`：账户设置与会话、安全、隐私等专题能力。

登录历史页当前也补齐了搜索闭环：

- 当用户输入 IP、地点、浏览器、系统或消息关键字时，前端会跨登录历史分页做聚合拉取后再过滤；
- 不再只在“当前页结果”内做本地搜索，避免搜索命中范围和分页总数相互矛盾；
- 清空关键字后再恢复后端原始分页节奏。

个人偏好相关页面当前也统一了保存态提示：

- `frontend/src/modules/auth/profile/views/privacy_settings/index.tsx` 现在会区分“未保存变更”和“已同步”状态，保存按钮只在实际发生变更时可点击；
- `frontend/src/modules/auth/profile/views/api_key_management/index.tsx` 在取消创建新密钥时会清空临时名称输入，避免再次打开创建态时继续带出上一轮未提交的草稿。

---

## 阅读建议

1. 先读 `docs/auth/AUTH_SECURITY.md`
2. 再读 `docs/auth/AUTH_SESSION_STRATEGY.md`
3. 最后结合本文件进入 `frontend/src/modules/auth/`、`frontend/src/shared/utils/` 与 `frontend/src/App.tsx`
