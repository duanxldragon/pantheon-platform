# 系统管理 UI 页面模板

> 本文提供 Pantheon Platform 系统管理模块当前推荐的三套统一 UI 模板：列表页、表单弹窗、详情页。  
> 它不替代业务规则，也不替代组件源码；它回答“新页面应该优先怎么拼”。  
> 设计语义看 `frontend/DESIGN.md`，实现基座看 `./UI_IMPLEMENTATION_GUIDE.md`。

## 1. 文档定位

这份模板文档主要用于：

- 统一系统管理页面的结构节奏；
- 降低新增页面的 UI 分歧；
- 给 AI 生成、页面重构、组件抽象提供稳定蓝本；
- 让“专业感”落到可执行结构，而不是停留在抽象原则。

本文聚焦三类高频页面：

1. 列表页模板；
2. 表单弹窗模板；
3. 详情页模板。

## 2. 模板共通原则

无论哪类模板，都优先遵守以下共通原则：

- 壳层保持中性、克制、稳定；
- 页面层级靠标题、间距、边框、轻阴影建立；
- 彩色只用于状态、主操作、图表或必要强调；
- 所有危险操作都要单独分层；
- 同一页面不要出现两套完全不同的圆角、按钮或容器语言。

推荐优先复用的实现基座：

- 页面骨架：`frontend/src/components/layouts/PageLayout.tsx`
- 管理容器：`frontend/src/shared/components/ui/ManagementSurface.tsx`
- 数据表格：`frontend/src/shared/components/ui/EnhancedDataTable.tsx`
- 表单弹层：`frontend/src/shared/components/ui/FormDialogWrapper.tsx`
- 详情弹层：`frontend/src/shared/components/ui/DetailDialogWrapper.tsx`
- 行内动作：`frontend/src/shared/components/ui/ActionButtons.tsx`

## 3. 模板一：系统管理列表页

### 3.1 适用场景

适用于：

- 用户管理；
- 角色管理；
- 菜单管理；
- 岗位管理；
- 日志管理；
- 大多数“筛选 + 表格 + 操作”系统页。

### 3.2 标准结构

推荐页面结构：

1. 页面标题区；
2. 筛选区；
3. 操作区；
4. 结果区；
5. 批量操作反馈区；
6. 新增 / 编辑 / 详情弹层。

推荐视觉顺序：

```text
PageLayout
  ├─ 页面标题 / 描述 / 右上角主动作
  ├─ ManagementFilterPanel
  ├─ ManagementActionBar
  ├─ ManagementContentCard
  │    ├─ 表格工具信息
  │    ├─ EnhancedDataTable
  │    └─ 分页 / 结果统计
  └─ Dialog / Drawer
```

### 3.3 页面标题区

标题区回答三件事：

- 当前管理的对象是什么；
- 当前页的主要目的是什么；
- 主动作是什么。

建议：

- 标题清晰，描述一句话即可；
- 主按钮只保留一个最高优先级动作；
- 次级工具动作放到操作区，不堆在标题行。

### 3.4 筛选区

筛选区优先使用：

- `ManagementFilterPanel`

推荐内容：

- 关键词搜索；
- 状态筛选；
- 类型 / 角色 / 部门等分类筛选；
- 重置与展开更多筛选。

规则：

- 默认展示最常用 2-4 个筛选项；
- 次要筛选收纳到“更多筛选”或折叠区；
- 查询与重置按钮位置固定；
- 筛选区不承载批量操作。

### 3.5 操作区

操作区优先使用：

- `ManagementActionBar`

推荐内容：

- 新增；
- 批量删除；
- 批量启停；
- 导出；
- 刷新；
- 列显隐或视图切换。

规则：

- 操作按“主动作 / 批量动作 / 工具动作”分组；
- 批量动作只有在选中后才显性增强；
- 刷新、导出、列设置优先靠右；
- 高风险批量动作与普通工具动作分开。

### 3.6 结果区

结果区优先使用：

- `ManagementContentCard`
- `EnhancedDataTable`

表格列建议分层：

| 列类型 | 示例 | 处理方式 |
| :--- | :--- | :--- |
| 标识列 | 用户名、角色名、菜单名 | 靠左、权重更高、必要时首列冻结 |
| 状态列 | 启用、停用、已删除 | 使用语义标签 |
| 关系列 | 部门、角色、父级菜单 | 保持简洁，必要时 Tooltip |
| 元数据列 | 创建时间、更新人 | 低强调，窄列 |
| 操作列 | 编辑、详情、删除 | 使用 `ActionButtons`，超出收纳 |

规则：

- 标识列优先保证可读性；
- 元数据列在窄屏下最先隐藏；
- 行内操作超过 3 个时必须收纳；
- 结果区顶部可附带统计信息，但不要替代筛选区。

### 3.7 状态表现

加载：

- 已知结构优先骨架屏；
- 不使用整页大 Spinner 覆盖列表。

空态：

- 说明是“暂无数据”还是“筛选无结果”；
- 提供“重置筛选”或“立即新增”动作。

错误：

- 结果区内显示错误说明；
- 支持重试，而不是只弹 toast。

### 3.8 列表页模板关键词

适合给 AI/协作者的简写提示：

- 中性壳层
- 标题 + 筛选 + 操作 + 结果四段式
- 筛选区与结果区为统一圆角容器
- 表格高信息密度但低噪音
- 状态标签语义化
- 操作列收纳

## 4. 模板二：表单弹窗

### 4.1 适用场景

适用于：

- 新增用户；
- 编辑角色；
- 新建岗位；
- 菜单配置；
- 中短流程配置表单。

### 4.2 推荐入口

优先使用：

- `FormDialogWrapper`

只有在以下情况才考虑抽屉：

- 字段非常多；
- 需要保留页面上下文对照；
- 右侧查看更自然。

### 4.3 标准结构

```text
FormDialogWrapper
  ├─ Header
  │    ├─ 标题
  │    └─ 一句说明
  ├─ Body
  │    ├─ 基本信息分组
  │    ├─ 权限 / 关系分组
  │    └─ 高级配置分组
  └─ Footer
       ├─ Cancel
       └─ Submit
```

### 4.4 头部

头部要明确：

- 当前动作是新增、编辑还是复制；
- 当前对象是什么；
- 当前弹层的边界是什么。

规则：

- 标题用动作 + 对象；
- 描述只保留一行说明，不写成长段帮助；
- 关闭按钮始终可见。

### 4.5 主体

主体推荐按分组组织：

- 基本信息；
- 关联信息；
- 状态与权限；
- 高级选项。

规则：

- 相关字段放在同一组；
- 必填项与可选项区分明确；
- 帮助文本靠近字段，不放到页尾；
- 极长表单必须分组或分步，不要堆成长墙。

### 4.6 底部操作区

底部按钮建议：

- 左侧：取消或关闭；
- 右侧：主提交；
- 高风险附加动作单独处理，不与提交并排混放。

规则：

- 主按钮文案明确，如“创建用户”“保存角色”；
- 提交中显示 loading；
- 无效表单禁止提交；
- 危险动作不放在普通表单底部主按钮旁边。

### 4.7 校验与反馈

校验规则：

- 优先字段内校验；
- 关联字段错误要明确指出影响项；
- 提交失败时保留用户输入。

反馈规则：

- 成功后关闭并刷新对应列表；
- 失败先在表单内解释，再用 toast 补充；
- 敏感字段错误不要只显示通用失败。

### 4.8 表单弹窗模板关键词

- 大圆角弹窗
- 清晰头部
- 分组字段
- 底部固定操作区
- 主按钮强语义
- 校验贴近字段

## 5. 模板三：详情页 / 详情弹层

### 5.1 适用场景

适用于：

- 用户详情；
- 角色详情；
- 操作日志详情；
- 配置项只读查看；
- 需要“先看后决定是否编辑”的页面。

### 5.2 推荐入口

优先使用：

- `DetailDialogWrapper`

若详情本身是主工作区页面，也应沿用同一结构语义。

### 5.3 标准结构

推荐结构：

1. 头部摘要；
2. 状态与关键属性；
3. 详情分组；
4. 审计信息；
5. 可选后续动作。

```text
DetailDialogWrapper / PageLayout
  ├─ Header Summary
  │    ├─ 对象名称
  │    ├─ 当前状态
  │    └─ 关键动作
  ├─ Key Facts
  ├─ Detail Sections
  ├─ Audit Section
  └─ Footer Actions
```

### 5.4 头部摘要

头部优先回答：

- 这是谁 / 这是什么；
- 当前状态是什么；
- 下一步最常见动作是什么。

建议：

- 标题 + 状态标签并列；
- 可在摘要区展示 ID、编码、类型等技术信息；
- 编辑、启停、删除等动作靠近头部，但分层清楚。

### 5.5 详情分组

详情内容按业务语义分组：

- 基本信息；
- 关系信息；
- 权限信息；
- 说明备注；
- 系统字段。

规则：

- 系统字段弱化处理；
- 审计信息放在靠后位置；
- 每组字段数量适中，避免单组过长；
- 长文本允许换行并保留可复制能力。

### 5.6 审计区

审计区通常包含：

- 创建时间；
- 创建人；
- 更新时间；
- 更新人；
- 最近操作记录。

规则：

- 审计区低强调但不隐藏；
- 与主业务字段区分明显；
- 日志型详情可把审计区提升为主内容。

### 5.7 后续动作

详情页常见动作：

- 编辑；
- 启停；
- 重置；
- 删除；
- 关闭。

规则：

- 主动作与危险动作分开；
- 删除需要二次确认；
- 详情页不是第二个表单页，避免塞入过多可编辑字段。

### 5.8 详情模板关键词

- 摘要优先
- 状态清晰
- 分组阅读
- 审计信息弱化
- 动作靠近对象

## 6. 三套模板如何选

| 需求 | 优先模板 |
| :--- | :--- |
| 查找、筛选、批量操作 | 列表页模板 |
| 创建、编辑、短配置 | 表单弹窗模板 |
| 查看对象全貌、审计信息 | 详情页模板 |

组合规则：

- 列表页是入口；
- 表单弹窗负责改；
- 详情页负责看；
- 不要把三者揉成一个超重页面。

## 7. 适合先抽象的组件能力

如果后续要继续统一 UI，优先抽这些能力：

- 列表页标题区模板；
- 筛选区字段栅格；
- 结果区统计条；
- 详情页 key-value 展示块；
- 技术标签 `Mono Label` 变体；
- segmented / pill tabs 变体；
- icon-only 按钮变体。

## 8. 当前示范落地

当前已优先在以下页面试落地新基座：

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

示范点包括：

- `ManagementPageHeader` 标题区；
- `Button` 的 `mono` / `success` / `warning` / `ghost-danger` / `pill` 变体；
- 筛选区重置按钮的统一工具化样式。

详情模板当前示范：

- `frontend/src/modules/system/views/role_management/components/role_detail_dialog.tsx`
- `frontend/src/modules/system/views/user_management/components/enhanced_user_detail_dialog.tsx`

示范点包括：

- `DetailDialogWrapper` 统一详情弹层容器；
- `DetailKeyValueSection` / `DetailKeyValueItem` 分组字段展示；
- `mono` / `success` / `warning` / `info` 标签在摘要区与状态区的组合。

表单模板当前示范：

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

示范点包括：

- `FormDialogWrapper` 统一表单弹层容器；
- 统一头部说明、滚动区与底部操作区；
- 表单内容由 `RoleForm` 负责，弹层容器只负责结构与交互节奏。

补充示范点：

- `ManagementPageHeader` 已从系统管理扩展到租户管理；
- `PageLayout` 已收敛到相同标题区语言，用于兼容尚未完全迁移的模块；
- `ActionButtons` 已支持 `surface="ghost"`，适合表格行内的轻量操作区。

## 9. 页面交付示例

这一节不写组件源码，而是给后续改造提供“交付时怎么描述”的模板。

### 9.1 列表页交付示例

适合参考：

- `frontend/src/modules/system/views/permission_management/index.tsx`
- `frontend/src/modules/system/views/user_management/index.tsx`
- `frontend/src/modules/tenant/views/tenant_management/index.tsx`

推荐交付描述：

- 页头统一到 `ManagementPageHeader`，首屏同时说明对象、状态、动作；
- 筛选区统一到 `ManagementFilterPanel`，查询入口和重置逻辑节奏一致；
- 内容区统一到 `ManagementContentCard`，表格、统计和分页处于同一视觉表面；
- 行内动作统一到共享动作区，不再出现多套按钮几何和危险态语言。

推荐验收观察点：

- 首屏是否能一眼看清“这个页面是做什么的”；
- 筛选、批量动作、工具动作是否混在一起；
- 表格列层级是否清楚，状态列和标识列是否可快速扫读；
- 行内动作是否过多，是否需要收纳。

### 9.2 表单弹层交付示例

适合参考：

- `frontend/src/modules/system/views/department_management/components/department_dialog_manager.tsx`
- `frontend/src/modules/system/views/user_management/components/user_dialog_manager.tsx`
- `frontend/src/modules/tenant/views/tenant_management/components/tenant_dialog_manager.tsx`

推荐交付描述：

- 表单弹层统一到 `FormDialogWrapper`；
- 标题、说明、滚动区、底部按钮保持一致的结构节奏；
- 保持表单业务逻辑不动，优先统一容器与交互反馈；
- 高风险动作不与普通提交动作混排。

推荐验收观察点：

- 新增 / 编辑弹层是否像同一家族；
- 底部按钮是否稳定，主次关系是否清楚；
- 表单字段是否按业务语义分组，而不是堆成长墙；
- 提交失败时是否仍保留当前输入状态。

### 9.3 详情页交付示例

适合参考：

- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/unified_log_management/components/log_detail_drawer.tsx`
- `frontend/src/modules/system/views/system_monitor/index.tsx`

推荐交付描述：

- 详情入口统一到 `DetailDialogWrapper`；
- 摘要、状态、审计、原始内容采用稳定的分组结构；
- 技术原文统一走 `DetailCodeBlock`；
- 详情不仅能“看原文”，还要先给出可快速核对的摘要与下一步动作。

推荐验收观察点：

- 详情是否先给摘要，再给原始数据；
- 技术信息和业务信息是否分组清楚；
- 状态标签、风险提示、技术标签是否有明确语义；
- 详情页是否错误地重新长成编辑页。

### 9.4 结果反馈交付示例

适合参考：

- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/system_monitor/index.tsx`
- `frontend/src/modules/tenant/views/tenant_management/index.tsx`

推荐交付描述：

- 成功态不只依赖 toast，还需要页内结果摘要；
- 巡检态、确认态、成功态都要给出下一步动作；
- 成功反馈优先展示影响范围、关键对象、重点复核入口；
- 结果反馈风格保持克制，避免做成营销式大横幅。

推荐验收观察点：

- 用户在结果出现后，是否知道下一步做什么；
- 成功态是否能说明“影响了什么”；
- 巡检结论是否能直接带到重点对象；
- 结果卡是否和页面整体视觉语言保持一致。

## 10. 给 AI / 协作者的描述模板

如果后续需要继续让 AI 或协作者扩展页面，可以直接复用下面的短描述：

### 10.1 列表页

- 参考现有 `ManagementPageHeader + ManagementFilterPanel + ManagementContentCard` 组合
- 保持中性后台壳层，不增加第二套按钮或标签体系
- 强化首屏层级、状态标签、结果区节奏

### 10.2 表单弹层

- 参考 `FormDialogWrapper`
- 不重写业务表单，只统一标题、说明、滚动区、底部操作区
- 提交反馈贴近当前弹层上下文

### 10.3 详情页

- 参考 `DetailDialogWrapper + DetailKeyValueSection + DetailCodeBlock`
- 先摘要、后详情、最后原文
- 让状态、审计、技术载荷分组更稳定

### 10.4 结果反馈

- 参考系统设置、系统监控、租户管理当前的成功态和巡检态
- 结果摘要要说明影响范围、重点对象、下一步动作
- 反馈风格保持专业工作台感，不做夸张装饰

## 11. 相关文档

- 稳定视觉描述：`../../DESIGN.md`
- 前端 UI 实现规范：`./UI_IMPLEMENTATION_GUIDE.md`
- 前端 UI 交付对照清单：`./UI_DELIVERY_CHECKLIST.md`
- 前端 UI 前后对照模板：`./UI_BEFORE_AFTER_TEMPLATE.md`
- 前端 UI 前后对照示例：`./UI_BEFORE_AFTER_EXAMPLES.md`
- 系统管理前端实现：`./SYSTEM_FRONTEND.md`
- 动态视图运行时：`../DYNAMIC_VIEW_RUNTIME.md`
