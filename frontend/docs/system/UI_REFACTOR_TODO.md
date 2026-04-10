# 前端 UI 增强项清单

> 本文不再记录第一轮统一的历史过程，而只保留当前阶段仍值得继续推进的增强方向。  
> 当前第一轮统一与第二阶段结果反馈收口已经完成，因此这里记录的是“下一轮增强项”，不是“未完成主任务”。  
> 设计边界看 `../../DESIGN.md`，实现规范看 `./UI_IMPLEMENTATION_GUIDE.md`，交付口径看 `./UI_DELIVERY_CHECKLIST.md`。

## 1. 当前状态

当前没有未完成主任务。

这一轮已经完成的内容，统一参考：

- 完成面：`./UI_REFACTOR_PROGRESS.md`
- 阶段总结：`./UI_REFACTOR_SUMMARY.md`
- UI 文档总览：`./UI_DOCS_OVERVIEW.md`

## 2. 下一轮增强项

如果继续推进，建议优先按下面顺序处理：

### 2.1 补正式交付材料

目标：

- 补截图、前后对照图、设计走查材料；
- 让当前这轮 UI 收口更适合用于团队同步和交付说明。

优先参考：

- `./UI_DELIVERY_CHECKLIST.md`
- `./UI_BEFORE_AFTER_TEMPLATE.md`
- `./UI_BEFORE_AFTER_EXAMPLES.md`

### 2.2 继续抽象稳定骨架

目标：

- 继续抽象更稳定的管理页骨架；
- 尽量减少后续新页面继续手拼页头、结果区、摘要区。

优先方向：

- 管理页首屏摘要骨架；
- 结果反馈卡骨架；
- 只读详情模板进一步收口。

### 2.3 微调高价值页面的信息密度

目标：

- 根据真实业务反馈，继续微调高价值页面的信息密度和节奏；
- 重点不是重做结构，而是优化摘要卡、重点对象、下一步动作的表达。

优先页面：

- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/system_monitor/index.tsx`
- `frontend/src/modules/system/views/unified_log_management/index.tsx`
- `frontend/src/modules/system/views/data_dictionary/index.tsx`
- `frontend/src/modules/tenant/views/tenant_management/index.tsx`

## 3. 当前不建议做的事

当前不建议马上做：

- 全仓库一次性替换所有历史页面；
- 为了统一而重写业务逻辑；
- 新造第二套按钮、弹层、详情或结果反馈体系；
- 在没有真实反馈前，继续把页面装饰做得更重。

## 4. 每次继续增强时的最小检查项

- 是否仍沿用统一的页面 / 弹层 / 详情基座？
- 是否仍保持中性、克制、专业的工作台气质？
- 是否仍兼容权限、动态菜单、标签页和动态视图链路？
- 是否通过最小前端校验？

## 5. 文档联动

后续如果继续做增强项，优先同步这些文档：

- `./UI_PAGE_TEMPLATES.md`
- `./UI_DELIVERY_CHECKLIST.md`
- `./UI_BEFORE_AFTER_TEMPLATE.md`
- `./UI_BEFORE_AFTER_EXAMPLES.md`
- `./UI_REFACTOR_PROGRESS.md`
- `./UI_REFACTOR_SUMMARY.md`
