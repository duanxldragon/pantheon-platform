# 前端 UI 交付对照清单

> 本文用于把 Pantheon Platform 当前这轮 UI 收口，整理成更接近设计交付物的对照说明。  
> 它不替代 `frontend/DESIGN.md`、`UI_IMPLEMENTATION_GUIDE.md` 或 `UI_PAGE_TEMPLATES.md`，而是回答：  
> “现在的页面已经具备哪些专业工作台特征、交付时应该重点看什么、前后差异如何描述。”

## 1. 文档定位

本文主要用于三类场景：

- 向团队解释这轮 UI 统一到底交付了什么；
- 给后续页面改造提供“前后对照”描述模板；
- 给 AI / 协作者一个更明确的验收口径。

本文不负责：

- 逐页列出所有 className 细节；
- 替代真实源码和组件 props；
- 把页面变成视觉稿操作手册。

## 2. 这轮交付的核心变化

这轮交付不是“换皮”，而是把后台工作台最影响专业感的部分统一下来：

- 页面首屏层级更稳定；
- 标题、筛选、工具动作区节奏更统一；
- 列表页、表单弹层、详情弹层进入同一套结构语言；
- 系统设置、系统监控、统一日志、租户管理补齐了更专业的结果反馈与只读检查链路。

当前已经形成的核心交付物包括：

- 稳定设计描述：`frontend/DESIGN.md`
- 实现规范：`frontend/docs/system/UI_IMPLEMENTATION_GUIDE.md`
- 页面模板：`frontend/docs/system/UI_PAGE_TEMPLATES.md`
- 页面交付对照：`frontend/docs/system/UI_DELIVERY_CHECKLIST.md`
- 前后对照模板：`frontend/docs/system/UI_BEFORE_AFTER_TEMPLATE.md`
- 前后对照示例：`frontend/docs/system/UI_BEFORE_AFTER_EXAMPLES.md`
- 改造进度：`frontend/docs/system/UI_REFACTOR_PROGRESS.md`
- 改造总结：`frontend/docs/system/UI_REFACTOR_SUMMARY.md`

## 3. 前后对照怎么描述

### 3.1 页面壳层

改造前常见问题：

- 标题区结构不一致；
- 工具按钮样式分裂；
- 页头、筛选区、结果区像来自不同页面家族；
- 首屏信息密度不稳定。

改造后统一表达：

- 统一使用 `ManagementPageHeader`；
- 统一使用 `ManagementContentCard` 和管理页表面语言；
- 工具动作优先收敛到 `mono` / `pill` / `icon-sm`；
- 页面在首屏就能清楚说明“对象、状态、动作、上下文”。

### 3.2 表单弹层

改造前常见问题：

- 标题、说明、滚动区、底部按钮结构不稳定；
- 同类新增 / 编辑弹层看起来不像一套系统；
- 表单反馈经常只有 toast，没有页面内语义。

改造后统一表达：

- 统一收敛到 `FormDialogWrapper`；
- 统一头部说明、主体滚动区、底部操作区；
- 保留业务表单逻辑不动，优先统一容器语言；
- 表单弹层更接近“专业后台工具窗”而不是自由拼接的对话框。

### 3.3 详情与只读链路

改造前常见问题：

- 详情页容易重新长成表单页；
- 审计、状态、原始数据混排；
- 日志、配置、监控缺少可核对的摘要结构。

改造后统一表达：

- 统一收敛到 `DetailDialogWrapper`；
- 统一使用 `DetailKeyValueSection` / `DetailKeyValueItem`；
- 请求、响应、异常、快照原文统一使用 `DetailCodeBlock`；
- 先给摘要与结构化信息，再给原始内容兜底。

## 4. 更接近 Figma 专业感的落点

这轮真正吸收的不是“视觉造型复制”，而是专业后台设计里更稳定的表达方式：

- 中性、低噪音的壳层表面；
- 更清晰的标题字重和信息分层；
- 更克制的技术标签与状态标签；
- pill / segmented 几何只用于需要聚焦的控件；
- 摘要先行、详情分组、原文兜底；
- 成功态、确认态、巡检态都给出下一步动作。

明确没有做的事：

- 没有新造第二套 token；
- 没有把后台改成营销落地页；
- 没有堆大量渐变、高饱和色块和花哨装饰；
- 没有破坏现有菜单 + 标签页 + 动态视图模型。

## 5. 当前重点页面的交付验收口径

### 5.1 `system_settings`

验收重点：

- 是否同时具备分组摘要、单项详情、差异预览、提交前确认、提交成功反馈；
- 是否可以在当前上下文直接核对 before / after；
- 提交成功后是否能看到同步结果与重点复核分组。

当前落点：

- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/system_settings/system_settings_copy.ts`

### 5.2 `system_monitor`

验收重点：

- 是否形成“概览 → 对象详情 → 快照”的工作流；
- 是否能根据健康状态直接得到巡检结论；
- 是否给出明确下一步动作，而不是只展示指标。

当前落点：

- `frontend/src/modules/system/views/system_monitor/index.tsx`
- `frontend/src/modules/system/views/system_monitor/system_monitor_copy.ts`

### 5.3 `unified_log_management`

验收重点：

- 是否不仅能看原始 JSON，还能看结构化摘要与 diff；
- 请求 / 响应 / 异常是否进入统一代码块组件；
- 详情是否具备审计分析感，而不是单纯技术转储。

当前落点：

- `frontend/src/modules/system/views/unified_log_management/components/log_detail_drawer.tsx`
- `frontend/src/modules/system/views/unified_log_management/unified_log_management_copy.ts`

### 5.4 `tenant_management`

验收重点：

- 是否形成“总览 → 单租户概览 → 初始化 / 授权动作”的工作台链路；
- 初始化完成后是否能直接看到结果摘要；
- 成功态是否补齐数据库、策略、管理员、菜单和权限模板结果。

当前落点：

- `frontend/src/modules/tenant/views/tenant_management/index.tsx`
- `frontend/src/modules/tenant/views/tenant_management/components/tenant_dialog_manager.tsx`
- `frontend/src/modules/tenant/components/tenant_setup_wizard/index.tsx`

## 6. 可复用的交付描述模板

如果后续继续做页面统一，建议用下面的描述方式写变更说明：

### 6.1 页面类

- 页面标题区统一到 `ManagementPageHeader`
- 工具动作统一到 `mono` / `pill`
- 内容区统一到 `ManagementContentCard`
- 补齐摘要、状态、下一步动作

### 6.2 表单类

- 表单容器统一到 `FormDialogWrapper`
- 保持业务表单逻辑不动，只统一结构语言
- 提交按钮、取消按钮、滚动区和说明区进入统一节奏

### 6.3 详情类

- 详情容器统一到 `DetailDialogWrapper`
- 摘要 / 状态 / 审计 / 原文分组明确
- 技术内容统一到 `DetailCodeBlock`

## 7. 最小验收清单

- [ ] 页面是否还保持单一视觉语言，而不是混出第二套体系？
- [ ] 页头、筛选区、内容区、详情区是否能被一眼识别为同一家族？
- [ ] 状态标签、技术标签、危险动作是否有明确语义分层？
- [ ] 成功态、确认态、巡检态是否给出下一步动作？
- [ ] 是否仍兼容动态视图、权限、菜单、标签页链路？
- [ ] 是否通过最小前端校验？

## 8. 下一轮更适合继续做什么

这轮收口完成后，更适合进入下一轮增强项：

- 补正式截图、前后对照图或设计走查材料；
- 继续抽象更稳定的管理页骨架；
- 结合真实业务反馈微调摘要卡信息密度。

这些属于增强，不再是当前版本的缺口。

如果需要正式补前后对照材料，可直接从：

- `frontend/docs/system/UI_BEFORE_AFTER_TEMPLATE.md`

开始填充。
