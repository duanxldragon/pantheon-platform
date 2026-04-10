# 前端 UI 文档总览

> 本文用于汇总 Pantheon Platform 当前这轮前端 UI 相关文档。  
> 如果你只想知道“先看哪篇、每篇负责什么、现在已经做到什么程度”，优先从这里进入。

## 1. 建议从这里开始

如果当前任务是继续完善前端 UI，建议按下面顺序阅读：

1. 稳定设计描述：`../../DESIGN.md`
2. UI 实现规范：`./UI_IMPLEMENTATION_GUIDE.md`
3. 页面模板：`./UI_PAGE_TEMPLATES.md`
4. 交付对照清单：`./UI_DELIVERY_CHECKLIST.md`
5. 前后对照模板：`./UI_BEFORE_AFTER_TEMPLATE.md`
6. 前后对照示例：`./UI_BEFORE_AFTER_EXAMPLES.md`
7. 当前进度：`./UI_REFACTOR_PROGRESS.md`
8. 阶段总结：`./UI_REFACTOR_SUMMARY.md`

## 2. 每篇文档负责什么

### 设计与边界

- `../../DESIGN.md`
  - 给前端开发、AI 代理和设计协作者使用的稳定视觉描述
- `../../../docs/system/UI_DESIGN.md`
  - 平台级 UI 设计边界与术语

### 实现与模板

- `./UI_IMPLEMENTATION_GUIDE.md`
  - 真实前端实现如何落地：token、组件、弹层、结果反馈
- `./UI_PAGE_TEMPLATES.md`
  - 列表页、表单弹层、详情页、结果反馈的页面模板

### 交付与验收

- `./UI_DELIVERY_CHECKLIST.md`
  - 交付口径、验收点和设计走查关注点
- `./UI_BEFORE_AFTER_TEMPLATE.md`
  - 单页前后对照说明模板
- `./UI_BEFORE_AFTER_EXAMPLES.md`
  - 已完成页面的示例版前后对照文案

### 改造状态

- `./UI_REFACTOR_TODO.md`
  - 当前保留的增强项和后续方向
- `./UI_REFACTOR_PROGRESS.md`
  - 实际完成面与关键落点
- `./UI_REFACTOR_SUMMARY.md`
  - 阶段性总结与下一轮建议

## 3. 现在已经做到什么程度

当前状态可以概括为：

- 第一轮统一已经完成；
- 第二阶段结果反馈与只读详情收口已经完成；
- 当前没有未完成主任务；
- 后续继续做，已经属于增强项而不是补缺项。

代表页面包括：

- `frontend/src/modules/system/views/system_settings/index.tsx`
- `frontend/src/modules/system/views/system_monitor/index.tsx`
- `frontend/src/modules/system/views/unified_log_management/index.tsx`
- `frontend/src/modules/system/views/data_dictionary/index.tsx`
- `frontend/src/modules/tenant/views/tenant_management/index.tsx`

## 4. 如果继续增强，先做什么

后续更适合按增强项推进：

- 补正式截图、前后对照图和设计走查材料；
- 继续抽象更稳定的管理页骨架；
- 结合真实业务反馈微调摘要卡信息密度；
- 在后续新页面接入时继续复用当前基座。

## 5. 最后看源码时优先关注哪里

- 页面壳层与结果反馈：`frontend/src/modules/system/views/`
- 租户工作台：`frontend/src/modules/tenant/views/tenant_management/`
- 共享 UI 基座：`frontend/src/shared/components/ui/`
- 基础变体：`frontend/src/components/ui/`
