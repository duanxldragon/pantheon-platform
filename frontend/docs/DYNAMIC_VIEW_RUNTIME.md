# 工作台导航运行时说明

> 本文只说明前端运行时的“Router + 菜单 + 标签页”协作模型。  
> 它不重复平台级业务规则，也不展开具体页面组件实现。

## 1. 为什么需要这份文档

Pantheon Platform 前端现在不是“纯动态视图壳层”，也不是“纯静态路由后台”，而是混合模型：

- React Router 负责顶层页面分流和 URL 导航；
- `MainLayout` 负责工作台壳层；
- 菜单仍然由后端配置驱动；
- 标签页仍然由 `uiStore` 管理；
- 视图注册表继续承担“菜单标识 -> 页面能力”的稳定映射。

因此需要单独说明这条运行时链路，避免把“路由”和“工作台状态”误写成两套相互独立的机制。

---

## 2. 核心参与者

这条链路主要由以下部分协作完成：

- `React Router`：负责 `/login`、`/tenant-setup`、主业务区以及业务子路由切分；
- `authStore`：提供认证态、租户初始化态、权限判断能力；
- `systemStore`：保存当前菜单树和系统初始化快照；
- `uiStore`：保存标签页、当前激活标签以及壳层 UI 状态；
- `useViewManager`：统一处理“打开标签 + 更新面包屑 + 路由跳转”；
- `viewsConfig`：维护视图 ID、路由路径、组件、权限与菜单映射关系；
- `MainLayout`：把侧栏、顶部栏、标签栏和 `Outlet` 组合成正式工作台。

---

## 3. 顶层分流

应用启动后，首先由 Router 做三段式分流：

1. 未登录用户进入 `/login`；
2. 已登录但需要租户初始化的用户进入 `/tenant-setup`；
3. 已登录且租户可用的用户进入主业务区 `/`。

也就是说，登录页、租户初始化页和正式业务页，已经由 URL 和路由守卫明确分开，不再依赖单一动态视图容器切换。

---

## 4. 主业务区运行时

进入主业务区后，运行时会切换到工作台模式：

1. `MainLayout` 挂载 `SidebarNew`、`TopBar`、`BreadcrumbNav`、`TabManager` 和 `Outlet`；
2. 菜单点击交给 `useViewManager.navigateToView()`；
3. `useViewManager` 先做权限校验，再写入 `uiStore.addTab()`；
4. 如果该视图在 `viewsConfig` 中声明了 `path`，则同步执行路由跳转；
5. React Router 根据当前 URL 在 `Outlet` 渲染实际页面；
6. `MainLayout` 再根据当前 `location.pathname` 反向同步激活标签。

这条链路的重点是：**标签状态和 URL 状态双向对齐**，而不是只保留其中一份。

---

## 5. 菜单、视图与路由的映射

当前映射关系主要分三层：

### 5.1 菜单实体

后端菜单实体仍提供：

- `id`
- `path`
- `component`
- `permissions`
- `visible`
- `status`

### 5.2 视图注册表

前端通过 `viewsConfig` 维护稳定的视图定义，包括：

- `id`
- `path`
- `component`
- `permissions`
- `breadcrumbPath`
- `label`

这样即使后端菜单名称、路径别名或组件标识存在兼容差异，前端仍有统一的注册层负责归一化。

### 5.3 路由树

真正渲染页面时，仍以 Router 路由树为准，例如：

- `/dashboard`
- `/system/users`
- `/system/roles`
- `/profile`
- `/notifications`

因此现在不是“视图注册表直接渲染页面”，而是“视图注册表帮助导航与对齐，Router 最终负责挂载页面”。

此外，当前 Router 还保留了一层旧路径兼容，例如：

- `/system/user` -> `/system/users`
- `/system/role` -> `/system/roles`
- `/system/dept` -> `/system/departments`
- `/profile/password` -> `/profile/settings`

这样可以兼容历史菜单配置、旧书签地址和部分回归测试路径，而不影响新的标准路径约定。

---

## 6. 权限校验模型

运行时至少有两次校验：

### 6.1 导航前校验

`useViewManager` 在打开视图前，会根据当前菜单、权限、角色判断页面是否仍可访问。

若不可访问：

- 不打开新标签；
- 不执行路由跳转；
- 统一提示菜单或权限已变化。

### 6.2 路由渲染校验

路由层还会通过 `RouteGuard` 对受保护页面做最终分流：

- 未登录回到 `/login`；
- 租户未完成初始化回到 `/tenant-setup`；
- 正常用户才进入主业务区。

页面级权限仍以前置导航校验和菜单可见性协作为主，避免用户停留在已失效页面上。

---

## 7. 路由与标签同步

当前同步策略主要有两条：

- **菜单/标签 -> 路由**：`useViewManager` 打开标签后，根据 `getViewPath(viewId)` 跳转到对应 URL；
- **路由 -> 标签**：`MainLayout` 监听 `location.pathname`，通过 `getViewIdByPath(path)` 回写当前激活标签。

这样做的目的包括：

- 支持浏览器前进、后退；
- 支持刷新后按 URL 恢复页面；
- 保留工作台多标签体验；
- 避免标签激活状态与真实页面脱节。

---

## 8. 授权变化后的处理

当角色、菜单、权限发生变化时，前端运行时仍会整体重建：

1. refresh 或重登录后恢复认证态；
2. `authStore` 重建用户与权限；
3. `systemStore` 重建菜单与系统快照；
4. 工作台根据新菜单重新判断当前视图是否可访问；
5. 不可访问页面不再允许继续打开；
6. URL 与激活标签同步切换到可访问页面。

因此“授权变化后无感恢复”依然成立，只是恢复目标从“纯动态视图容器”变成了“路由 + 工作台状态”的联合运行时。

---

## 9. 文档边界

- 本文只说明工作台导航运行时；
- 登录、refresh、2FA 细节请看认证专题文档；
- 系统初始化分层请看 `frontend/docs/system/SYSTEM_INITIALIZATION_LAYERS.md`；
- 系统管理业务模型请看平台级系统文档。
