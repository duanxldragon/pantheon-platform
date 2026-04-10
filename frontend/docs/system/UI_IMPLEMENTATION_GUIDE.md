# 前端 UI 实现规范

> 本文从前端实现视角说明 Pantheon Platform 的 UI 如何真正落地。  
> 平台级视觉边界看 `docs/system/UI_DESIGN.md`；稳定设计描述与 AI 约束看 `frontend/DESIGN.md`。  
> 本文负责回答：token 在哪里、组件从哪里复用、管理页怎么拼、旧页面如何迁移。  
> 当前主线风格允许吸收 Figma 式的专业细节，但必须落到后台场景可执行的实现约束里。  
> 若需要直接套用页面结构，继续看 `./UI_PAGE_TEMPLATES.md`。
> 若需要交付说明、前后对照和验收口径，继续看 `./UI_DELIVERY_CHECKLIST.md`。

## 1. 文档定位

### 1.1 本文负责什么

- 对齐 `frontend/DESIGN.md` 与真实前端实现入口；
- 说明主题 token、基础组件、页面模板、弹层模板的实际位置；
- 说明系统管理页面的优先组合方式；
- 说明历史 UI 与当前主线 UI 的迁移边界。

### 1.2 本文不负责什么

- 不维护平台级品牌或气质原则；
- 不重复每个业务页面的操作手册；
- 不替代源码与组件 props 定义；
- 不承诺历史页面已全部完成统一。

## 2. 实现分层

前端 UI 当前按三层理解最稳定：

| 层级 | 作用 | 主要入口 |
| :--- | :--- | :--- |
| 设计描述层 | 统一视觉语言与 AI 生成约束 | `frontend/DESIGN.md` |
| 平台规范层 | 平台级边界、页面家族、交互原则 | `docs/system/UI_DESIGN.md` |
| 代码实现层 | token、组件、模板、状态协作 | `frontend/src/`、本文 |

## 3. Token 与主题入口

### 3.1 主线 token 入口

当前主线 token 应优先从以下位置消费：

- `frontend/src/styles/globals.css`

优先使用的语义 token：

- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--popover-foreground`
- `--primary`
- `--primary-foreground`
- `--secondary`
- `--muted`
- `--muted-foreground`
- `--accent`
- `--destructive`
- `--border`
- `--input`
- `--ring`
- `--sidebar-*`
- `--chart-1` 至 `--chart-5`

实现约束：

- 新页面优先消费语义 token，不直接绑定具体色阶；
- 暗色模式依赖 token 切换，不在页面里复制一套深色颜色；
- 图表、标签、边框也优先走语义变量，不另起体系。

### 3.2 圆角与深度

当前实现中应维持以下趋势：

- 小圆角：输入框、按钮、标签；
- 中圆角：卡片、筛选区、列表容器；
- 大圆角：弹窗、抽屉、重点容器。

约束：

- 页内普通卡片不要和弹层使用同等强度的圆角与阴影；
- 圆角和阴影在同一页面内保持稳定，不要每块都变；
- 需要强化层级时，先加边框和背景区分，再补阴影。

### 3.3 暗色模式

暗色模式基线：

- 由 `globals.css` 的暗色 token 驱动；
- 组件应自动响应 `.dark` 类；
- 避免在页面组件里写死亮暗两套内联色值。

### 3.4 Figma 风格的可执行落点

可以吸收的实现特征：

- 壳层和工具栏优先使用中性、低饱和 token；
- 标题、按钮、标签的层级通过字重差和间距建立；
- 分段控制器、筛选切换、页内 tab 可适度采用 pill 几何；
- 图标按钮保持圆形或近圆形，避免奇怪的独立造型；
- 焦点态可以做得更明确，但仍需服从现有组件体系。

不要直接照搬的部分：

- 不要把营销站式彩色渐变搬进后台壳层；
- 不要强制所有按钮、输入框都变成 50px pill；
- 不要为模仿 variable font 细节而破坏中文可读性；
- 不要为了模拟 Figma 而新造第二套 token 命名。

## 4. 基础组件基座

### 4.1 通用组件入口

基础组件主入口：

- `frontend/src/components/ui/`

优先复用：

- `button.tsx`
- `card.tsx`
- `dialog.tsx`
- `alert-dialog.tsx`
- `sheet.tsx`
- `drawer.tsx`
- `tabs.tsx`
- `select.tsx`
- `popover.tsx`
- `dropdown-menu.tsx`
- `table.tsx`
- `input.tsx`
- `textarea.tsx`
- `badge.tsx`
- `alert.tsx`
- `skeleton.tsx`

约束：

- 可以基于 `className` 做轻量语义增强；
- 不要在业务模块里复制出第二套基础按钮、输入框、弹层；
- 全局风格问题优先回到基座修，不要逐页打补丁。

推荐增强方向：

- `button.tsx` 可承接更明确的几何分层，如常规按钮、pill 按钮、icon-only 按钮；
- `tabs.tsx` 可承接更工具化的 segmented / pill 风格；
- `badge.tsx` 可补更克制的单色技术标签与状态标签变体；
- 焦点态优先在基座组件统一，不在业务页各写各的。
- 当前已补充 `mono`、`ghost-danger`、`pill`、`icon-sm`、`icon-lg`、`mono badge`、`segmented tabs` 等基础变体，可优先复用。

### 4.2 页面骨架

页面骨架优先复用：

- `frontend/src/components/layouts/PageLayout.tsx`
- `frontend/src/shared/components/ui/management_page_header.tsx`

职责：

- 页面标题；
- 描述文案；
- 右上角动作区；
- 主体内容的统一节奏。

规则：

- 系统管理新增页面优先从统一页面骨架进入；
- 不要在页面内部再手写第二套标题区；
- 主操作保持一主多辅，不要堆满首屏按钮。
- 列表型页面可优先使用 `ManagementPageHeader` 承载标题、说明、技术标签和动作区。

### 4.3 详情展示块

详情信息推荐复用：

- `frontend/src/shared/components/ui/detail_key_value_section.tsx`
- `frontend/src/shared/components/ui/detail_code_block.tsx`

适用：

- 用户详情；
- 角色详情；
- 系统字段块；
- 审计与元数据块。

规则：

- 标题与描述放在分组头部；
- 字段 label 使用更克制的技术标签语义；
- value 保持可复制、可换行、可读；
- 系统字段与主业务字段分组显示，不混排。
- 原始请求、响应、异常、配置快照等技术文本优先走 `DetailCodeBlock`，不要在业务页重复手写复制、折叠、格式化和下载逻辑。

## 5. 系统管理页组合方式

### 5.1 标准结构

系统管理页推荐结构：

1. 页面标题与说明；
2. 筛选区；
3. 操作区；
4. 结果容器；
5. 行内动作 / 批量动作；
6. 表单或详情弹层。

### 5.2 管理页容器

优先复用：

- `frontend/src/shared/components/ui/ManagementSurface.tsx`

其中通常包含：

- `ManagementActionBar`
- `ManagementFilterPanel`
- `ManagementContentCard`

约束：

- 新系统页优先复用这组容器；
- 不要把其 Tailwind class 复制到页面里重新拼一遍；
- 暗色模式适配应在容器层统一补齐，不在每个业务页各写一套。
- 若要增强专业感，优先通过更克制的中性表面、更明确的标题排版和更稳定的间距来做，而不是追加彩色装饰。

### 5.3 表格

优先复用：

- `frontend/src/shared/components/ui/EnhancedDataTable.tsx`
- `frontend/src/shared/components/ui/VirtualizedTable.tsx`

使用建议：

- 常规分页列表优先 `EnhancedDataTable`；
- 行数超大且性能确实受限时再考虑 `VirtualizedTable`；
- 不要在业务页裸写整套 `<table>` 结构来绕过基座。

### 5.4 行内动作

优先复用：

- `frontend/src/shared/components/ui/ActionButtons.tsx`
- `frontend/src/shared/components/ui/DeleteConfirmDialog.tsx`
- `frontend/src/shared/components/ui/StatusToggleDialog.tsx`
- `frontend/src/shared/components/ui/ConfirmDialog.tsx`

规则：

- 删除使用删除专用确认弹层；
- 启停使用状态切换专用弹层；
- 行内操作过多时收进“更多”菜单；
- 高风险动作的按钮文案必须明确对象。

## 6. 弹层体系

### 6.1 基础弹层

主入口：

- `frontend/src/components/ui/dialog.tsx`
- `frontend/src/components/ui/alert-dialog.tsx`
- `frontend/src/components/ui/sheet.tsx`
- `frontend/src/components/ui/drawer.tsx`

系统管理 UI 统一后的高频包装器：

- `frontend/src/shared/components/ui/form_dialog_wrapper.tsx`
- `frontend/src/shared/components/ui/detail_dialog_wrapper.tsx`

兼容入口：

- `frontend/src/shared/components/ui/form_dialog.tsx`
- `frontend/src/shared/components/ui/detail_dialog.tsx`

共享尺寸：

- `frontend/src/shared/constants/dialogSizes.ts`

约束：

- 新增表单弹层优先从 `FormDialogWrapper` 进入；
- 新增只读详情优先从 `DetailDialogWrapper` 进入；
- 历史兼容入口只承担迁移缓冲职责，不继续往里面堆新能力。

### 6.2 推荐封装

优先使用：

- `frontend/src/shared/components/ui/FormDialogWrapper.tsx`
- `frontend/src/shared/components/ui/DetailDialogWrapper.tsx`

规则：

- 表单弹层优先 `FormDialogWrapper`；
- 详情查看优先 `DetailDialogWrapper`；
- 只有流程非常特殊时才直接落到底层 `DialogContent`；
- 不要把多步骤流程挤进简单确认框；
- 若引入更强设计识别度，优先落在圆角、标题排版、按钮几何和焦点态，不要改坏交互语义。

## 7. 第二阶段只读详情模式

第二阶段的重点不是继续铺更多容器，而是把“看详情”这件事做成稳定模式。

### 7.1 系统设置

参考页面：

- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/system_settings/system_settings_copy.ts`

当前推荐结构：

- 分组摘要
- 单项配置详情
- 当前分组差异摘要
- 当前分组差异详情弹窗
- 跨分组变更总览
- 提交前确认弹窗

实现原则：

- 设置页不要只有输入控件，还要有可核对的只读摘要；
- 变更前后对比优先在分组内完成，不要强迫用户离开当前上下文；
- 文案、标签、状态说明优先沉淀在 copy 文件，不在页面里继续扩散硬编码。

### 7.2 系统监控

参考页面：

- `frontend/src/modules/system/views/system_monitor/index.tsx`
- `frontend/src/modules/system/views/system_monitor/system_monitor_copy.ts`

当前推荐结构：

- 概览摘要
- 服务详情
- 磁盘详情
- 快照详情
- 概览面板与详情弹窗之间的联动跳转

实现原则：

- 监控页优先做“概览到对象”的工作流，不只是摆多张卡片；
- 服务、磁盘、快照这类对象应共享一致的详情结构；
- 监控文案持续沉淀到 copy 文件，避免详情扩展后又回到散落硬编码。

### 7.3 统一日志

参考页面：

- `frontend/src/modules/system/views/unified_log_management/components/log_detail_drawer.tsx`
- `frontend/src/modules/system/views/unified_log_management/unified_log_management_copy.ts`

当前推荐结构：

- 摘要信息
- 用户与环境信息
- 操作与影响范围
- 原始请求 / 响应 / 异常代码块
- 结构化字段摘要
- 字段值级差异摘要

实现原则：

- 日志详情不要只展示原始 JSON，还要给出可快速扫读的结构化摘要；
- 请求体、响应体、异常说明统一走 `DetailCodeBlock`；
- 结构化分析应优先突出字段数量、共享字段、差异字段，再把原文作为兜底。

### 7.4 数据字典

参考页面：

- `frontend/src/modules/system/views/data_dictionary/index.tsx`
- `frontend/src/modules/system/views/data_dictionary/components/dict_dialog_manager.tsx`

当前推荐结构：

- 类型摘要
- 类型详情弹窗
- 条目详情弹窗

实现原则：

- 数据字典页不仅要支持增删改，也要支持稳定的只读检查；
- 类型信息与条目信息分开组织，避免详情页重新长成编辑页。

## 8. 反馈组件与状态表现

### 8.1 加载

优先顺序：

1. 页面初始化使用全局加载；
2. 结构已知页面使用骨架屏；
3. 局部动作使用按钮 loading 或区域 loading；
4. 避免对已知列表长期使用全屏 spinner。

### 8.2 空态与错误

规则：

- 空态要告诉用户为空原因和下一步；
- 错误提示不能只靠 toast，阻断性错误要落到页面或弹层；
- 表单错误要和字段绑定，不要只在顶部提示一句。

### 8.3 结果反馈

当前推荐把“结果反馈”也当成主线 UI 的一部分，而不是只交给 toast：

- 成功提交后，优先补页内结果摘要；
- 结果摘要应说明影响范围、关键对象和下一步动作；
- 巡检类页面应给出结论，而不是只罗列指标；
- 成功态、确认态、巡检态都保持统一的卡片与标签语义。

当前示范页面：

- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/system_monitor/index.tsx`
- `frontend/src/modules/tenant/views/tenant_management/index.tsx`

## 9. 动态视图与 UI 协作边界

UI 设计在本项目里不能脱离运行时理解。涉及菜单、标签页、权限、页面挂载时，要一起考虑：

- `authStore`
- `systemStore`
- `uiStore`
- `ViewRenderer`
- `useViewManager`

实现约束：

- 工作台主标签页不是普通页内 tab；
- 页面切换、权限刷新、菜单重建后，UI 不应出现失控状态；
- 新页面接入优先按“权限码 + 菜单 + 视图注册”方式，而不是只挂一个静态路由。

## 10. 历史 UI 迁移策略

仓库中仍存在一部分历史实现：

- 依赖 `themeStore` 的内联样式；
- 旧壳层区域的直接颜色读取；
- 一些历史页面的局部自定义视觉表达。

迁移原则：

- 新增页面只接入主线 token 体系；
- 修改旧页面时优先做“局部归一化”，不要顺手大翻修；
- 同一页面内避免大面积混用 token 体系与内联主题色；
- 迁移顺序优先：基础组件 -> 页面容器 -> 弹层 -> 旧页面局部细节。

兼容层现状：

- `frontend/src/shared/components/ui/form_dialog.tsx` 已作为 `FormDialogWrapper` 的兼容入口保留；
- `frontend/src/shared/components/ui/detail_dialog.tsx` 已作为 `DetailDialogWrapper` 的兼容入口保留；
- 新代码应优先直接使用 `FormDialogWrapper` / `DetailDialogWrapper`，旧入口仅用于渐进迁移。

## 11. 开发检查清单

- [ ] 是否优先使用 `frontend/DESIGN.md` 与平台规范，而不是自由发挥？
- [ ] 是否复用了 `components/ui/` 或 `shared/components/ui/` 的现有基座？
- [ ] 是否避免了业务页里的硬编码颜色、阴影、圆角和表格结构？
- [ ] 是否考虑了亮色、暗色、长文案、状态标签和危险操作？
- [ ] 是否检查了菜单、标签页、动态视图挂载与权限刷新的协作影响？
