# 系统管理模块前端实现

## 定位

本文件只说明系统管理模块在前端的页面组织、状态管理、动态挂载与交互链路，不重复业务规则。

## 导航

### 平台规则

- 业务边界与对象关系：`docs/system/SYSTEM_MANAGEMENT.md`
- 登录、会话、2FA：`docs/auth/AUTH_SECURITY.md`
- 权限刷新与强制失效：`docs/auth/AUTH_SESSION_STRATEGY.md`
- 租户初始化：`docs/tenant/TENANT_INITIALIZATION.md`

### UI 设计与实现

- UI 文档总览：`./UI_DOCS_OVERVIEW.md`
- UI 实现入口与组件基座：`./UI_IMPLEMENTATION_GUIDE.md`
- 页面模板与拼装方式：`./UI_PAGE_TEMPLATES.md`
- 交付对照与验收口径：`./UI_DELIVERY_CHECKLIST.md`

### 改造与验证

- 当前统一改造进度：`./UI_REFACTOR_PROGRESS.md`
- 阶段总结：`./UI_REFACTOR_SUMMARY.md`
- 后续统一优先级清单：`./UI_REFACTOR_TODO.md`
- 功能回归覆盖：`./SYSTEM_MANAGEMENT_TEST_MATRIX.md`

### 运行时与初始化

- 初始化分层与系统快照：`./SYSTEM_INITIALIZATION_LAYERS.md`

---

## 推荐阅读顺序

如果当前任务是系统管理前端 UI 或页面接入，建议按下面顺序阅读：

1. `docs/system/SYSTEM_MANAGEMENT.md`
2. `./UI_IMPLEMENTATION_GUIDE.md`
3. `./UI_PAGE_TEMPLATES.md`
4. `./UI_DELIVERY_CHECKLIST.md`
5. `./UI_REFACTOR_PROGRESS.md`
6. `./SYSTEM_INITIALIZATION_LAYERS.md`

---

## 1. 前端总入口

系统管理模块的前端展示依赖“认证态 + 动态视图 + 系统状态”三条链路共同完成。

### 应用级入口

- 应用入口：`frontend/src/App.tsx`
- 左侧菜单：`frontend/src/components/sidebar_new.tsx`
- 顶部导航：`frontend/src/components/top_bar.tsx`
- 动态视图渲染：`frontend/src/shared/components/view_renderer.tsx`
- 动态视图导航：`frontend/src/shared/components/use_view_manager.ts`
- 视图配置：`frontend/src/shared/constants/views_config.ts`
- 系统状态：`frontend/src/stores/system_store.ts`
- 标签页状态：`frontend/src/stores/ui_store.ts`

### 系统模块目录

- 模块入口：`frontend/src/modules/system/`
- API 聚合：`frontend/src/modules/system/api/system_api.ts`
- 类型定义：`frontend/src/modules/system/types/index.ts`
- 视图页面：`frontend/src/modules/system/views/`
- 复用组件：`frontend/src/modules/system/components/`
- 业务 Hook：`frontend/src/modules/system/hooks/`

---

## 2. 登录后的前端初始化链路

登录成功后，前端不是直接进入固定页面，而是执行一轮系统初始化。

### 关键链路

1. 登录成功或 refresh 成功后，认证链路进入统一恢复入口；
2. `useAuthStore().refreshTenantContext()` 先执行 `reloadAuthorization()`；
3. 再执行租户状态检查；
4. 若租户已就绪，调用 `useSystemStore().initialize()` 重建系统快照；
5. `SidebarNew` 根据菜单与视图配置渲染导航；
6. `ViewRenderer` 根据当前视图标识动态加载页面组件。

### 初始化的数据范围

`systemStore.initialize()` 当前会并发拉取：

- 用户列表；
- 部门列表；
- 角色列表；
- 菜单列表；
- 岗位列表；
- 登录日志；
- 操作日志；
- 系统设置。

这保证系统管理页面进入后可以直接工作，而不是每个页面都从零开始拼装。

同时也意味着当前初始化更偏向“系统管理全量快照”，而不是最小壳层数据。更细的分层说明见 `./SYSTEM_INITIALIZATION_LAYERS.md`。

---

## 3. 状态管理分工

前端系统管理相关状态目前主要分成三层：

### 3.1 `authStore`

位置：`frontend/src/modules/auth/store/auth_store.ts`

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

位置：`frontend/src/stores/system_store.ts`

负责：

- 用户、部门、岗位、角色、菜单；
- 操作日志；
- 系统设置；
- 系统管理页面初始化；
- 本地增删改后的即时状态更新。

### 3.3 `uiStore`

位置：`frontend/src/stores/ui_store.ts`

负责：

- 标签页；
- 当前激活视图；
- 多页签切换与关闭。

系统管理模块的大量页面都依赖标签页和动态视图切换来提供后台体验。

---

## 4. 视图组织方式

系统管理前端按“功能页 + 组件 + Hook”组织。

### 当前主要页面

- 用户管理：`frontend/src/modules/system/views/user_management/index.tsx`
- 部门管理：`frontend/src/modules/system/views/department_management/index.tsx`
- 岗位管理：`frontend/src/modules/system/views/position_management/index.tsx`
- 角色管理：`frontend/src/modules/system/views/role_management/index.tsx`
- 权限管理：`frontend/src/modules/system/views/permission_management/index.tsx`
- 菜单管理：`frontend/src/modules/system/views/menu_management/index.tsx`
- 数据字典：`frontend/src/modules/system/views/data_dictionary/index.tsx`
- 统一日志：`frontend/src/modules/system/views/unified_log_management/index.tsx`
- 系统设置：`frontend/src/modules/system/views/system_settings/index.tsx`
- 系统监控：`frontend/src/modules/system/views/system_monitor/index.tsx`
- 仪表盘：`frontend/src/modules/system/views/system_dashboard/index.tsx`

### 当前 UI 统一主线

系统管理主链路页面当前已经基本收口到统一工作台风格，重点参考：

- 统一页头与容器：`frontend/src/shared/components/ui/management_page_header.tsx`
- 表单弹层基座：`frontend/src/shared/components/ui/form_dialog_wrapper.tsx`
- 详情弹层基座：`frontend/src/shared/components/ui/detail_dialog_wrapper.tsx`
- 字段分组基座：`frontend/src/shared/components/ui/detail_key_value_section.tsx`
- 技术代码块基座：`frontend/src/shared/components/ui/detail_code_block.tsx`

代表性的第二阶段页面包括：

- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/system_monitor/index.tsx`
- `frontend/src/modules/system/views/unified_log_management/index.tsx`
- `frontend/src/modules/system/views/data_dictionary/index.tsx`

它们分别承接了：

- 配置差异核对与提交确认；
- 监控概览到服务 / 磁盘 / 快照的联动详情；
- 审计日志的结构化字段摘要与值级 diff；
- 数据字典类型与条目两层详情链路。

其中当前又补齐了两条交互约束：

- `frontend/src/modules/system/views/system_settings/index.tsx` 中所有“立即同步 / 保存”入口统一先进入提交前摘要，再执行真实保存；
- `frontend/src/modules/system/views/permission_management/index.tsx` 已接入 CSV 导入导出，导入按权限编码做新增 / 更新，导出默认基于当前筛选结果或当前选择。
- `frontend/src/modules/system/views/user_management/index.tsx` 与 `frontend/src/modules/system/views/role_management/index.tsx` 的 CSV 导入导出也已接入真实数据流，不再只是本地提示。
- `frontend/src/modules/system/views/department_management/index.tsx` 与 `frontend/src/modules/system/views/position_management/index.tsx` 的 CSV 导入导出也已接入真实数据流：部门导入会解析父级与负责人，岗位导入会解析部门、级别与类别，导出统一回到模板字段。
- `frontend/src/modules/system/views/data_dictionary/index.tsx` 的 JSON 导入现已按“类型编码 + 字典值/标签”做更新或新增，重复导入不会再无条件重复创建整套类型与字典项；类型级刷新也改为优先基于最新类型快照定位当前类型，避免新增或改名后短暂落回旧选中态；当刷新后总页数缩减时，分页会自动回落到有效页码，避免列表短暂显示为空页。
- `frontend/src/modules/system/views/unified_log_management/index.tsx` 已恢复真实选择态：日志表格支持勾选记录，导出会优先导出当前选择；未选择时再回落到当前页签与筛选结果。
- `frontend/src/modules/system/views/system_settings/index.tsx` 的配置导出现在只导出已保存快照，不会混入本地未同步草稿；导入时也只接受当前前端支持的配置键，避免未知键直接写入；导入完成后改为在设置页内重新拉取配置快照，而不是整页强制刷新。
- `frontend/src/modules/system/views/system_settings/index.tsx` 现在会在开始新一轮本地编辑时自动清空上一轮保存摘要；切换分组后如果当前详情弹层对应的配置项已不在新分组中，也会立即关闭详情态，避免旧配置项在返回分组时意外再次弹出；重置草稿时会同时收口差异/提交相关弹层，保持设置页的草稿态一致。
- `frontend/src/modules/system/views/system_dashboard/index.tsx` 现在使用真实登录日志参与“登录异常”和最近活动摘要，不再用操作日志去近似登录风险；`systemStore.initialize()` 也同步拉取登录日志快照。
- `frontend/src/modules/system/views/system_dashboard/index.tsx` 的卡片与快捷入口现统一复用 `useViewManager` 导航，不再单独拼装标签页元数据；这样仪表盘、侧边栏和顶部入口会共用同一套访问校验、面包屑和视图跳转规则。
- `frontend/src/modules/system/views/system_monitor/index.tsx` 中“查看快照”现归属监控查询权限；只有“导出快照”继续要求导出权限，避免把只读巡检入口误绑到导出能力上。
- `frontend/src/modules/system/views/system_monitor/index.tsx` 在自动轮询刷新后，会基于服务名和磁盘路径回填当前已打开的详情对象；如果对象已经从最新快照中消失，则自动关闭对应详情态，避免服务详情、磁盘详情或快照上下文继续停留在旧快照数据上。
- `frontend/src/modules/system/views/role_management/components/permission_config_dialog.tsx` 中角色菜单授权树已补齐父子层级约束：勾选子项时会自动补齐祖先节点，取消父项时会一并移除后代节点，避免提交不完整的菜单结构。
- 当前登录用户若在用户管理或角色成员管理中被调整角色，或其所属角色、菜单、权限在系统管理中被命中修改，前端会主动执行 `refreshTenantContext()`，立即刷新授权快照、菜单和系统初始化数据，避免当前会话继续停留在旧权限视图。
- `frontend/src/modules/system/views/user_management/index.tsx` 现在会区分“当前登录用户的资料摘要变化”和“当前登录用户的授权上下文变化”：前者刷新 `refreshCurrentUser()`，后者刷新 `refreshTenantContext()`；CSV 导入如果命中当前登录用户，也会同步刷新当前会话，避免顶部身份信息、权限和菜单继续停留在旧快照。
- `frontend/src/modules/system/views/department_management/index.tsx` 现在会在当前登录用户所属部门被改名、批量启停、成员调入调出或导入覆盖后，主动刷新 `refreshCurrentUser()`，避免顶部用户摘要继续停留在旧部门名称或旧归属。
- `frontend/src/modules/system/views/position_management/index.tsx` 现在会在当前登录用户所属岗位被改名、批量启停、成员调入调出或导入覆盖后，主动刷新 `refreshCurrentUser()`，避免顶部用户摘要继续停留在旧岗位名称或旧归属。
- `frontend/src/modules/system/views/role_management/components/role_users_dialog.tsx` 在成员调入调出后，除了当前会话授权刷新外，也会回传父页面重新拉取角色列表；这样角色表格、统计卡片和 `userCount` 不会停留在旧值。
- `frontend/src/modules/system/views/menu_management/index.tsx` 的 CSV 导入导出已接入真实数据流：导入按菜单编码新增 / 更新，并补齐父级、类型、组件路径映射；导出默认基于当前筛选结果。
- `frontend/src/modules/system/views/menu_management/index.tsx` 现在会在菜单列表重新加载后回填当前编辑目标与批量选择集合；如果已打开的编辑/删除目标已不存在，则自动关闭相关弹层，避免菜单树刷新后批量统计、启停数量和删除目标继续停留在旧节点引用上。
- `frontend/src/modules/system/views/permission_management/index.tsx` 现在会在权限列表重新加载后回填当前选中权限与批量选择集合；如果已打开的编辑/删除目标已不存在，则自动关闭相关弹层，避免批量统计、启停数量和删除目标继续停留在旧对象引用上。
- `frontend/src/modules/system/views/unified_log_management/index.tsx` 现在会在日志列表刷新、切页或筛选后回填当前勾选记录与详情对象；如果详情目标已经不在当前结果集中，则自动关闭详情抽屉，避免继续查看旧分页或旧筛选上下文中的日志内容。
- `frontend/src/modules/system/views/data_dictionary/index.tsx` 现在会在切换字典类型时主动收口旧类型下的字典项弹层；列表刷新后若当前详情/编辑/删除目标已不在最新结果中，也会自动关闭对应弹层，避免把旧类型或旧分页中的字典项继续带入当前上下文。

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
- 菜单项与 `views_config.ts` 中的视图配置共同决定页面如何打开；
- 菜单里的 `component` 标识与前端实际组件形成映射关系。

### 5.3 动态页面挂载

- `ViewRenderer` 负责按视图标识动态加载组件；
- `views_config.ts` 维护静态视图注册与动态组件映射；
- 菜单一旦配置正确并授权给角色，登录后即可自动显示对应页面入口。

这也是后续扩展“主机管理”等模块的前端基础能力。

---

## 6. 在线授权变更后的前端协同

前端已经接入“授权变化后刷新当前用户与权限”的链路。

### 当前关键点

- `authStore.reloadAuthorization()` 会重新拉取当前用户与权限；
- `api_client.ts` 在 refresh 成功后会重新执行统一恢复链路；
- `authStore.refreshTenantContext()` 会串联授权重载、租户检查与系统快照重建。

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

- 视图注册：`frontend/src/shared/constants/views_config.ts`
- 顶部入口：`frontend/src/components/top_bar.tsx`
- 个人中心：`frontend/src/modules/auth/profile/profile_center/index.tsx`
- 账户设置：`frontend/src/modules/auth/profile/account_settings/index.tsx`
- 安全设置：`frontend/src/modules/auth/profile/views/security_settings/index.tsx`

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
2. 新增页面组件，例如 `frontend/src/modules/host/views/host_management/index.tsx`；
3. 在 `views_config.ts` 中注册视图映射；
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
- 状态聚合：`frontend/src/stores/system_store.ts`
- 动态挂载：`frontend/src/shared/constants/views_config.ts`
- 导航展示：`frontend/src/components/sidebar_new.tsx`
- 授权刷新：`frontend/src/modules/auth/store/auth_store.ts`
- refresh 联动：`frontend/src/shared/utils/api_client.ts`

这样可以避免在前端同时改很多层，路径更清晰。

