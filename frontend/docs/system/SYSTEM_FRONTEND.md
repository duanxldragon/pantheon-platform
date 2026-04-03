# 系统管理模块前端实现

## 定位

本文件只说明系统管理模块在前端的页面组织、状态管理、动态挂载与交互链路，不重复业务规则。

- 业务边界与对象关系：看 `docs/system/SYSTEM_MANAGEMENT.md`
- UI 实现入口与组件基座：看 `./UI_IMPLEMENTATION_GUIDE.md`
- 登录、会话、2FA：看 `docs/auth/AUTH_SECURITY.md`
- 权限刷新与强制失效：看 `docs/auth/AUTH_SESSION_STRATEGY.md`
- 租户初始化：看 `docs/tenant/TENANT_INITIALIZATION.md`
- 功能回归覆盖：看 `./SYSTEM_MANAGEMENT_TEST_MATRIX.md`

---

## 1. 前端总入口

系统管理模块的前端展示依赖“认证态 + 动态视图 + 系统状态”三条链路共同完成。

### 应用级入口

- 应用入口：`frontend/src/App.tsx`
- 左侧菜单：`frontend/src/components/SidebarNew.tsx`
- 顶部导航：`frontend/src/components/TopBar.tsx`
- 动态视图管理：`frontend/src/shared/components/ViewManager.tsx`
- 视图配置：`frontend/src/shared/constants/viewsConfig.ts`
- 系统状态：`frontend/src/stores/systemStore.ts`
- 标签页状态：`frontend/src/stores/uiStore.ts`

### 系统模块目录

- 模块入口：`frontend/src/modules/system/`
- API 聚合：`frontend/src/modules/system/api/systemApi.ts`
- 类型定义：`frontend/src/modules/system/types/index.ts`
- 视图页面：`frontend/src/modules/system/views/`
- 复用组件：`frontend/src/modules/system/components/`
- 业务 Hook：`frontend/src/modules/system/hooks/`

---

## 2. 登录后的前端初始化链路

登录成功后，前端不是直接进入固定页面，而是执行一轮系统初始化。

### 关键链路

1. `App.tsx` 检测用户已登录；
2. 调用 `useSystemStore().initialize()` 加载系统基础数据；
3. 调用 `useAuthStore().reloadAuthorization()` 重新拉取当前用户与权限；
4. 如启用多租户，再执行租户状态检查；
5. `SidebarNew` 根据菜单与视图配置渲染导航；
6. `ViewManager` 根据当前视图标识动态加载页面组件。

### 初始化的数据范围

`systemStore.initialize()` 当前会并发拉取：

- 用户列表；
- 部门列表；
- 角色列表；
- 菜单列表；
- 岗位列表；
- 操作日志；
- 系统设置。

这保证系统管理页面进入后可以直接工作，而不是每个页面都从零开始拼装。

---

## 3. 状态管理分工

前端系统管理相关状态目前主要分成三层：

### 3.1 `authStore`

位置：`frontend/src/modules/auth/store/authStore.ts`

负责：

- 当前登录用户；
- 当前权限集合；
- token 与会话状态；
- `reloadAuthorization()`；
- 登录后租户状态检查。

系统管理依赖它来判断：

- 当前用户是谁；
- 当前用户拥有哪些权限；
- 是否需要刷新授权；
- 是否允许展示某些操作入口。

### 3.2 `systemStore`

位置：`frontend/src/stores/systemStore.ts`

负责：

- 用户、部门、岗位、角色、菜单；
- 操作日志；
- 系统设置；
- 系统管理页面初始化；
- 本地增删改后的即时状态更新。

### 3.3 `uiStore`

位置：`frontend/src/stores/uiStore.ts`

负责：

- 标签页；
- 当前激活视图；
- 多页签切换与关闭。

系统管理模块的大量页面都依赖标签页和动态视图切换来提供后台体验。

---

## 4. 视图组织方式

系统管理前端按“功能页 + 组件 + Hook”组织。

### 当前主要页面

- 用户管理：`frontend/src/modules/system/views/UserManagement.tsx`
- 部门管理：`frontend/src/modules/system/views/DepartmentManagement.tsx`
- 岗位管理：`frontend/src/modules/system/views/PositionManagement.tsx`
- 角色管理：`frontend/src/modules/system/views/RoleManagement.tsx`
- 权限管理：`frontend/src/modules/system/views/PermissionManagement.tsx`
- 菜单管理：`frontend/src/modules/system/views/MenuManagement.tsx`
- 数据字典：`frontend/src/modules/system/views/DataDictionary.tsx`
- 统一日志：`frontend/src/modules/system/views/UnifiedLogManagement.tsx`
- 系统设置：`frontend/src/modules/system/views/SystemSettings.tsx`
- 系统监控：`frontend/src/modules/system/views/SystemMonitor.tsx`
- 仪表盘：`frontend/src/modules/system/views/SystemDashboard.tsx`

### 页面下沉结构

每个页面通常再拆成：

- 页面级容器；
- 对话框管理器；
- 搜索表单；
- 表格或树表格；
- 领域 Hook；
- 复用表单组件。

这能让系统管理这种页面数量多、交互相似的模块保持可维护性。

---

## 5. 权限与菜单在前端的生效方式

### 5.1 权限判断

`authStore` 维护当前用户权限集合，并提供：

- `hasPermission()`
- `hasAnyPermission()`
- `hasAllPermissions()`

前端页面和组件可基于这些方法控制：

- 按钮显示；
- 操作菜单显示；
- 某些区域是否可编辑；
- 高风险动作是否可执行。

### 5.2 菜单渲染

- 后端返回当前用户可见菜单；
- `SidebarNew` 负责导航展示；
- 菜单项与 `viewsConfig.ts` 中的视图配置共同决定页面如何打开；
- 菜单里的 `component` 标识与前端实际组件形成映射关系。

### 5.3 动态页面挂载

- `ViewManager` 负责按视图标识动态加载组件；
- `viewsConfig.ts` 维护静态视图注册与动态组件映射；
- 菜单一旦配置正确并授权给角色，登录后即可自动显示对应页面入口。

这也是后续扩展“主机管理”等模块的前端基础能力。

---

## 6. 在线授权变更后的前端协同

前端已经接入“授权变化后刷新当前用户与权限”的链路。

### 当前关键点

- `authStore.reloadAuthorization()` 会重新拉取当前用户与权限；
- `apiInterceptor.ts` 在 refresh 成功后会重新执行授权加载；
- `App.tsx` 在登录态初始化时会同步拉取系统数据与授权数据。

### 设计含义

这意味着以下变更发生后，前端能够较快拿到新结果：

- 用户被重新分配角色；
- 角色权限发生调整；
- 角色菜单发生调整；
- 菜单配置发生调整；
- 部门或岗位信息发生影响展示的变化。

底层刷新/失效机制的判定规则统一参考 `docs/auth/AUTH_SESSION_STRATEGY.md`。

---

## 7. 个人中心的前端落点

个人中心虽然属于系统管理能力的一部分，但实现上主要落在认证模块的个人资料子目录。

### 关键入口

- 视图注册：`frontend/src/shared/constants/viewsConfig.ts`
- 顶部入口：`frontend/src/components/TopBar.tsx`
- 个人中心：`frontend/src/modules/auth/profile/ProfileCenter.tsx`
- 账户设置：`frontend/src/modules/auth/profile/AccountSettings.tsx`
- 安全设置：`frontend/src/modules/auth/profile/views/SecuritySettings.tsx`

### 承载能力

- 个人资料维护；
- 安全设置；
- 2FA 管理；
- API Key 管理；
- 登录历史；
- 偏好设置。

因此，业务上它属于系统管理，代码上则横跨 `system` 与 `auth/profile` 两个区域。

---

## 8. 新业务模块的前端接入方式

以后续“主机管理”为例，前端建议按下面方式接入：

1. 新增模块目录，例如 `frontend/src/modules/host/`；
2. 新增页面组件，例如 `frontend/src/modules/host/views/HostManagement.tsx`；
3. 在 `viewsConfig.ts` 中注册视图映射；
4. 在菜单管理中配置对应 `component`；
5. 给角色分配菜单与权限；
6. 登录后通过动态菜单与动态视图自动显示。

这样新业务模块不需要硬编码到平台主导航里。

---

## 9. 前端继续完善时的优先落点

如果后续继续补系统管理前端，优先看这些位置：

- 页面与交互：`frontend/src/modules/system/views/`
- 复用表单与弹窗：`frontend/src/modules/system/components/`
- 数据请求：`frontend/src/modules/system/api/`
- 状态聚合：`frontend/src/stores/systemStore.ts`
- 动态挂载：`frontend/src/shared/constants/viewsConfig.ts`
- 导航展示：`frontend/src/components/SidebarNew.tsx`
- 授权刷新：`frontend/src/modules/auth/store/authStore.ts`
- refresh 联动：`frontend/src/shared/utils/apiInterceptor.ts`

这样可以避免在前端同时改很多层，路径更清晰。

