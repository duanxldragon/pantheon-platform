# 前端文档中心

> `frontend/docs/` 只承载人工维护的前端专题实现文档。  
> 这里回答“前端状态如何流转、界面如何挂载、交互如何承接”，不重复平台级业务规则。

## 入口文档

- [项目入口](../../README.md)
- [平台文档中心](../../docs/DOCS_INDEX.md)
- [前端实现总览](../FRONTEND_GUIDE.md)

## 前端专题

### 通用入口

- [前端 DESIGN.md 稳定设计描述](../DESIGN.md)
- [前端命名规范](FRONTEND_NAMING_CONVENTIONS.md)
- [动态视图运行时说明](DYNAMIC_VIEW_RUNTIME.md)

### 系统管理与 UI

- [前端 UI 文档总览](system/UI_DOCS_OVERVIEW.md)
- [系统管理前端实现](system/SYSTEM_FRONTEND.md)
- [系统初始化分层说明](system/SYSTEM_INITIALIZATION_LAYERS.md)
- [前端 UI 实现规范](system/UI_IMPLEMENTATION_GUIDE.md)
- [系统管理 UI 页面模板](system/UI_PAGE_TEMPLATES.md)
- [前端 UI 交付对照清单](system/UI_DELIVERY_CHECKLIST.md)
- [前端 UI 前后对照模板](system/UI_BEFORE_AFTER_TEMPLATE.md)
- [前端 UI 前后对照示例](system/UI_BEFORE_AFTER_EXAMPLES.md)
- [前端 UI 统一改造 TODO](system/UI_REFACTOR_TODO.md)
- [前端 UI 统一改造进度](system/UI_REFACTOR_PROGRESS.md)
- [前端 UI 统一改造总结](system/UI_REFACTOR_SUMMARY.md)
- [系统管理功能测试矩阵](system/SYSTEM_MANAGEMENT_TEST_MATRIX.md)

### 业务专题

- [认证前端实现](auth/AUTH_FRONTEND.md)
- [租户前端实现](tenant/TENANT_FRONTEND.md)

## 按任务场景阅读

### 想先理解前端工程全貌

建议顺序：

1. `../../README.md`
2. `../../docs/DOCS_INDEX.md`
3. `../FRONTEND_GUIDE.md`

适合场景：

- 刚进入仓库；
- 想理解前端目录、启动链路、状态协作；
- 需要先建立整体上下文。

### 想看 UI 设计、模板和交付口径

建议顺序：

1. `../DESIGN.md`
2. `system/UI_IMPLEMENTATION_GUIDE.md`
3. `system/UI_PAGE_TEMPLATES.md`
4. `system/UI_DELIVERY_CHECKLIST.md`
5. `system/UI_REFACTOR_PROGRESS.md`
6. `system/UI_REFACTOR_SUMMARY.md`

适合场景：

- 需要继续统一页面；
- 需要参考 Figma / 设计风格完善前端；
- 需要写交付说明、验收口径或前后对照。

### 想看系统初始化、动态视图和运行时链路

建议顺序：

1. `DYNAMIC_VIEW_RUNTIME.md`
2. `system/SYSTEM_INITIALIZATION_LAYERS.md`
3. `system/SYSTEM_FRONTEND.md`

适合场景：

- 需要理解菜单、标签页、动态视图如何挂载；
- 需要理解登录后初始化、refresh 重建、系统快照；
- 需要评估页面改动对运行时链路的影响。

### 想按业务专题继续深入

建议入口：

- 系统管理：`system/SYSTEM_FRONTEND.md`
- 认证：`auth/AUTH_FRONTEND.md`
- 租户：`tenant/TENANT_FRONTEND.md`

适合场景：

- 已经知道要改哪条业务线；
- 需要结合专题文档继续看页面、状态和接口；
- 需要同时对照平台级文档与前端实现。

## 文档边界

- `frontend/FRONTEND_GUIDE.md`：前端工程总览
- `frontend/DESIGN.md`：给前端与 AI 代理使用的稳定视觉描述
- `frontend/docs/DYNAMIC_VIEW_RUNTIME.md`：动态视图、菜单、标签页、权限协作
- `frontend/docs/system/SYSTEM_INITIALIZATION_LAYERS.md`：登录后初始化、refresh 重建、系统快照分层
- `frontend/docs/`：前端专题实现细节
- 模块源码：实际页面、状态管理与组件实现
