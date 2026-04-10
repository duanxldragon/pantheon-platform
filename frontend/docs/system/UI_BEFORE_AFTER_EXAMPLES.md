# 前端 UI 前后对照示例

> 本文基于 `UI_BEFORE_AFTER_TEMPLATE.md`，提供三页已经完成改造的示例版前后对照文案。  
> 适合直接用于设计走查、交付说明或后续页面继续套用。

## 1. `system_settings`

### 基本信息

- 页面名称：系统设置
- 页面路径：`frontend/src/modules/system/views/system_settings/index.tsx`
- 关联模块：`system`
- 改造目标：补齐配置差异核对、提交确认、提交成功反馈
- 参考基座：`ManagementPageHeader`、`DetailDialogWrapper`、`DetailKeyValueSection`

### 改造前

- 页面首屏：首屏更接近普通分组表单页，虽然能编辑配置，但缺少稳定的审阅结构。
- 操作反馈：提交结果主要依赖 toast，用户难以直接判断本次影响范围与重点复核对象。
- 详情结构：单项配置、分组差异、跨分组差异之间没有完整的只读核对链路。
- 主要问题：页面“能改”，但还不够像专业后台里的配置工作台。

### 改造后

- 页面首屏：页头统一到 `ManagementPageHeader`，当前分组摘要、修改数量、关键动作都在首屏稳定呈现。
- 操作反馈：补齐当前分组差异摘要、跨分组总览、提交前确认和提交成功结果摘要。
- 详情结构：单项配置详情、before / after 对比、已同步键与重点复核分组进入同一套详情语义。
- 交付结果：页面从“配置表单”收口为“可核对、可确认、可回看”的配置工作台。

### 对照结论

- 改造前更像：可编辑但反馈偏弱的普通系统配置页
- 改造后更像：带审阅感和 staged commit 气质的后台配置工作台
- 本次最核心变化：把提交结果和配置差异正式纳入页面上下文
- 后续是否还有增强项：可继续补截图对照和更细的分组示意

### 截图占位建议

- `system-settings-overview-after`
- `system-settings-detail-after`
- `system-settings-feedback-after`

## 2. `system_monitor`

### 基本信息

- 页面名称：系统监控
- 页面路径：`frontend/src/modules/system/views/system_monitor/index.tsx`
- 关联模块：`system`
- 改造目标：补齐概览到对象详情的联动工作流，并补充巡检结论
- 参考基座：`ManagementPageHeader`、`DetailDialogWrapper`、`DetailKeyValueSection`

### 改造前

- 页面首屏：页面更偏向监控卡片展示，信息存在但缺少稳定的工作流顺序。
- 操作反馈：缺少明确的巡检结论，用户需要自己从指标中判断下一步重点。
- 详情结构：服务、磁盘、快照等对象的详情入口和关系不够清晰。
- 主要问题：页面“能看指标”，但还不够像一个可操作的监控中心。

### 改造后

- 页面首屏：概览指标、焦点对象、快照入口和巡检清单进入稳定布局。
- 操作反馈：新增巡检结论与下一步动作，可根据异常服务、磁盘压力、Redis 状态直接给出复核入口。
- 详情结构：服务详情、磁盘详情、快照详情之间支持跳转，形成“概览 → 对象 → 快照”的工作流。
- 交付结果：页面从“监控卡片集合”收口为更专业的巡检与分析工作台。

### 对照结论

- 改造前更像：信息可读但偏静态的监控概览页
- 改造后更像：能辅助判断和复核的后台监控中心
- 本次最核心变化：把巡检结论和下一步动作补进当前页面上下文
- 后续是否还有增强项：可继续补更正式的快照对照截图

### 截图占位建议

- `system-monitor-overview-after`
- `system-monitor-detail-after`
- `system-monitor-feedback-after`

## 3. `tenant_management`

### 基本信息

- 页面名称：租户管理
- 页面路径：`frontend/src/modules/tenant/views/tenant_management/index.tsx`
- 关联模块：`tenant`
- 改造目标：把租户页从列表管理页收口为更完整的租户工作台，并补齐初始化成功反馈
- 参考基座：`ManagementPageHeader`、`ManagementContentCard`、`DetailDialogWrapper`

### 改造前

- 页面首屏：以列表管理为主，虽然能做操作，但总览、详情、初始化结果之间联系偏弱。
- 操作反馈：租户初始化完成后缺少完整的页内成功摘要，结果信息分散。
- 详情结构：概览、配额、数据库、状态等信息没有形成足够稳定的只读链路。
- 主要问题：页面更像“带租户数据的管理列表”，还不像成熟的租户工作台。

### 改造后

- 页面首屏：统计卡、筛选区、结果区和概览动作保持统一的后台页节奏。
- 操作反馈：初始化成功后直接展示数据库、策略、管理员、菜单、权限模板等结果摘要。
- 详情结构：租户概览拆成状态、配额、数据库等分组，并能在初始化完成后自动回到该租户概览。
- 交付结果：页面从“列表操作页”收口为“总览 + 单租户详情 + 初始化反馈”的租户工作台。

### 对照结论

- 改造前更像：带租户 CRUD 的普通后台列表页
- 改造后更像：具备总览、详情和初始化反馈的租户工作台
- 本次最核心变化：把初始化完成结果和单租户概览真正连成一条链路
- 后续是否还有增强项：可继续补授权场景和初始化结果的正式截图

### 截图占位建议

- `tenant-management-overview-after`
- `tenant-management-detail-after`
- `tenant-management-feedback-after`

## 4. `unified_log_management`

### 基本信息

- 页面名称：统一日志
- 页面路径：`frontend/src/modules/system/views/unified_log_management/index.tsx`
- 关联模块：`system`
- 改造目标：把日志详情从原始数据展示收口为更稳定的审计分析链路
- 参考基座：`ManagementPageHeader`、`DetailDialogWrapper`、`DetailCodeBlock`

### 改造前

- 页面首屏：日志列表可用，但详情阅读更偏向原始字段和原始载荷堆叠。
- 操作反馈：用户进入日志详情后，需要自行在请求、响应和异常信息中找重点。
- 详情结构：摘要、环境信息、原始 JSON、差异分析之间没有足够稳定的阅读顺序。
- 主要问题：页面“能查日志”，但还不够像专业后台里的审计分析面板。

### 改造后

- 页面首屏：列表页继续保持统一后台页骨架，详情链路重点收口到抽屉 / 详情结构。
- 操作反馈：日志详情不再只给原始内容，而是先给结构化摘要和字段差异，再给原文兜底。
- 详情结构：请求、响应、异常说明统一进入 `DetailCodeBlock`，并补充结构化字段摘要和值级 diff。
- 交付结果：页面从“日志查看页”收口为更专业的审计与问题定位面板。

### 对照结论

- 改造前更像：以原始数据为主的日志详情页
- 改造后更像：具备摘要、差异和原文三层阅读结构的审计分析页
- 本次最核心变化：把原始日志阅读升级为结构化差异分析
- 后续是否还有增强项：可继续补更强的字段高亮与截图对照

### 截图占位建议

- `unified-log-overview-after`
- `unified-log-detail-after`
- `unified-log-feedback-after`

## 5. `data_dictionary`

### 基本信息

- 页面名称：数据字典
- 页面路径：`frontend/src/modules/system/views/data_dictionary/index.tsx`
- 关联模块：`system`
- 改造目标：把字典管理页补齐为“类型摘要 + 类型详情 + 条目详情”的稳定只读链路
- 参考基座：`ManagementPageHeader`、`DetailDialogWrapper`、`DetailKeyValueSection`

### 改造前

- 页面首屏：页面以管理操作为主，类型与条目的只读查看能力偏弱。
- 操作反馈：用户更容易进入编辑动作，而不是先稳定查看类型状态和条目细节。
- 详情结构：类型信息和条目信息缺少清晰的摘要与分组关系。
- 主要问题：页面“能管理字典”，但还不像成熟后台里的字典工作台。

### 改造后

- 页面首屏：类型侧栏、类型摘要、列表区保持统一的工作台式节奏。
- 操作反馈：类型与条目都补齐详情入口，能先看状态、描述、规模和元信息，再决定是否编辑。
- 详情结构：类型详情和条目详情统一进入 `DetailDialogWrapper`，形成稳定的两层只读链路。
- 交付结果：页面从“偏 CRUD 的字典页”收口为“管理 + 检查”并重的数据字典工作台。

### 对照结论

- 改造前更像：偏操作导向的数据字典管理页
- 改造后更像：同时适合查看和维护的数据字典工作台
- 本次最核心变化：把类型与条目的只读检查正式纳入页面主线
- 后续是否还有增强项：可继续补类型规模和状态的截图对照

### 截图占位建议

- `data-dictionary-overview-after`
- `data-dictionary-detail-after`
- `data-dictionary-feedback-after`

## 6. 如何继续复用

如果后续还要继续补其它页面，可以直接复用本文结构：

1. 基本信息
2. 改造前
3. 改造后
4. 对照结论
5. 截图占位建议

推荐下一批如果还要继续补示例，可优先考虑：

- `frontend/src/modules/system/views/user_management/index.tsx`
- `frontend/src/modules/system/views/permission_management/index.tsx`
