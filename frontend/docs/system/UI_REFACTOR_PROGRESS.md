# 前端 UI 统一改造进度

> 本文记录 Pantheon Platform 当前这轮前端 UI 统一的实际完成面。  
> 设计语义看 `../../DESIGN.md`，实现规范看 `./UI_IMPLEMENTATION_GUIDE.md`，交付口径看 `./UI_DELIVERY_CHECKLIST.md`。

## 1. 当前状态

当前第一轮统一与第二阶段结果反馈收口已经完成，核心待办已清零。

这轮完成的重点，不是“重画全部页面”，而是把后台工作台最关键的结构语言稳定下来：

- 页面页头、筛选区、结果区进入统一节奏；
- 表单弹层、详情弹层进入统一容器体系；
- 设置、监控、日志、租户等高频页补齐了更完整的只读详情与结果反馈；
- 历史入口保留兼容壳，但新视觉规则只维护一条主线。

## 2. 已完成的完成面

### 2.1 页面壳层

已完成统一页头 / 容器语言的页面：

- `frontend/src/modules/system/views/position_management/index.tsx`
- `frontend/src/modules/system/views/role_management/index.tsx`
- `frontend/src/modules/system/views/user_management/index.tsx`
- `frontend/src/modules/system/views/department_management/index.tsx`
- `frontend/src/modules/system/views/menu_management/index.tsx`
- `frontend/src/modules/system/views/permission_management/index.tsx`
- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/system_dashboard/index.tsx`
- `frontend/src/modules/system/views/system_monitor/index.tsx`
- `frontend/src/modules/system/views/unified_log_management/index.tsx`
- `frontend/src/modules/system/views/data_dictionary/index.tsx`
- `frontend/src/modules/tenant/views/tenant_management/index.tsx`

统一基座：

- `ManagementPageHeader`
- `ManagementFilterPanel`
- `ManagementContentCard`
- `Button` 的 `mono` / `pill` / `ghost-danger` / `icon-sm`

### 2.2 弹层体系

已完成第一轮统一的表单弹层代表：

- `frontend/src/modules/system/views/role_management/components/add_role_dialog.tsx`
- `frontend/src/modules/system/views/position_management/components/position_dialog_manager.tsx`
- `frontend/src/modules/system/views/department_management/components/department_dialog_manager.tsx`
- `frontend/src/modules/system/views/menu_management/components/menu_dialog_manager.tsx`
- `frontend/src/modules/system/views/permission_management/components/permission_dialog_manager.tsx`
- `frontend/src/modules/system/views/data_dictionary/components/dict_dialog_manager.tsx`
- `frontend/src/modules/system/views/user_management/components/user_dialog_manager.tsx`
- `frontend/src/modules/system/views/user_management/components/reset_password_dialog.tsx`
- `frontend/src/modules/system/views/role_management/components/permission_config_dialog.tsx`
- `frontend/src/modules/tenant/views/tenant_management/components/tenant_dialog_manager.tsx`

详情弹层代表：

- `frontend/src/modules/system/views/role_management/components/role_detail_dialog.tsx`
- `frontend/src/modules/system/views/user_management/components/enhanced_user_detail_dialog.tsx`

兼容层现状：

- `frontend/src/shared/components/ui/form_dialog.tsx`
- `frontend/src/shared/components/ui/detail_dialog.tsx`

### 2.3 组件级收敛

已完成第一轮组件级统一：

- `frontend/src/modules/system/views/permission_management/components/permission_stats.tsx`
- `frontend/src/modules/system/views/permission_management/components/permission_group_view.tsx`
- `frontend/src/modules/system/views/permission_management/components/permission_table.tsx`
- `frontend/src/modules/system/views/user_management/components/user_permission_panel.tsx`
- `frontend/src/modules/tenant/views/tenant_management/components/tenant_stats_cards.tsx`
- `frontend/src/modules/tenant/views/tenant_management/components/tenant_table.tsx`
- `frontend/src/shared/components/ui/action_buttons.tsx`
- `frontend/src/components/layouts/page_layout.tsx`
- `frontend/src/shared/components/ui/detail_code_block.tsx`

## 3. 第二阶段重点成果

### 3.1 `system_settings`

当前已形成完整的配置审阅链路：

- 单项配置详情；
- 当前分组差异摘要；
- 跨分组差异总览；
- 提交前确认；
- 提交成功结果摘要；
- 提交后的建议复核清单。

关键落点：

- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/system_settings/hooks/use_settings_logic.ts`
- `frontend/src/modules/system/views/system_settings/system_settings_copy.ts`

### 3.2 `system_monitor`

当前已形成“概览 → 对象详情 → 快照”的监控链路：

- 服务详情；
- 磁盘详情；
- 快照详情；
- 风险等级摘要；
- 巡检清单；
- 巡检结论与下一步动作。

关键落点：

- `frontend/src/modules/system/views/system_monitor/index.tsx`
- `frontend/src/modules/system/views/system_monitor/system_monitor_copy.ts`

### 3.3 `unified_log_management`

当前日志详情已经具备结构化分析能力：

- 摘要信息；
- 审计结论摘要；
- 请求 / 响应 / 异常代码块；
- 结构化字段摘要；
- 请求 / 响应差异摘要；
- 值级 diff 结果。

关键落点：

- `frontend/src/modules/system/views/unified_log_management/components/log_detail_drawer.tsx`
- `frontend/src/modules/system/views/unified_log_management/unified_log_management_copy.ts`

### 3.4 `data_dictionary`

当前已形成“类型摘要 + 维护焦点 + 类型详情 + 条目详情”的稳定只读链路。

关键落点：

- `frontend/src/modules/system/views/data_dictionary/index.tsx`
- `frontend/src/modules/system/views/data_dictionary/components/dict_dialog_manager.tsx`

### 3.5 `tenant_management`

当前已从列表页收口为更完整的租户工作台：

- 租户概览详情；
- 配额 / 数据库 / 状态摘要；
- 初始化完成后自动回看概览；
- 初始化成功摘要补齐数据库、策略、管理员、菜单和权限模板结果；
- 初始化成功后的下一步检查清单。

关键落点：

- `frontend/src/modules/tenant/views/tenant_management/index.tsx`
- `frontend/src/modules/tenant/views/tenant_management/components/tenant_stats_cards.tsx`
- `frontend/src/modules/tenant/views/tenant_management/components/tenant_table.tsx`
- `frontend/src/modules/tenant/views/tenant_management/components/tenant_dialog_manager.tsx`

## 4. 当前剩余项

当前没有未完成主任务。

如需继续推进，下一步更适合作为增强项处理：

- 补正式截图、前后对照或设计走查材料；
- 结合真实业务反馈微调监控 / 日志 / 租户摘要卡信息密度；
- 继续抽象更稳定的管理页骨架与只读详情模板。

## 5. 最小回归要求

后续继续 UI 改造时，至少保持：

- `cmd /c npm run type-check`
- 不引入第二套主题 / 状态 / 按钮 / 弹层体系
- 不破坏动态视图、菜单、权限判断链路
