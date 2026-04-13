# AI 协作指南

> 本文定义 Pantheon Platform 在使用 Codex、ChatGPT、Copilot 类 AI 工具时的推荐协作方式。  
> 目标不是“让 AI 自由发挥”，而是让 AI 在清晰边界、可验证流程和稳定文档入口下高效工作。

## 1. 适用范围

适用于：

- AI 辅助需求分析；
- AI 辅助编码与重构；
- AI 辅助测试设计；
- AI 辅助文档整理；
- AI 辅助排障和根因定位。

## 2. 核心原则

### 2.1 单一事实来源

AI 任务必须尽量指向明确入口，而不是给一串零散口头背景。

优先引用：

- `README.md`
- `docs/DOCS_INDEX.md`
- `docs/design/SYSTEM_ARCHITECTURE.md`
- `docs/development/DEVELOPER_GUIDE.md`
- `frontend/docs/FRONTEND_CODE_STANDARDS.md`
- `backend/docs/BACKEND_CODE_STANDARDS.md`

### 2.2 先定边界，再让 AI 动手

任务里至少说明：

- 目标；
- 主链路；
- 改动范围；
- 不要动什么；
- 验收标准；
- 预期验证方式。

### 2.3 让 AI 面对“结构化任务”，不要面对“模糊愿望”

不推荐：

- “你自己看看怎么改”
- “顺手全都优化了”
- “把这个项目整理一下”

推荐：

- “按 `auth` 主链路排查登录后菜单未刷新的根因，只改相关 store 和后端权限刷新链路”
- “补一份系统管理模块的 E2E 测试计划，不改代码”

### 2.4 输出必须可验证

AI 输出默认至少要能回答：

- 改了什么；
- 为什么这样改；
- 做了哪些验证；
- 还剩哪些风险或后续建议。

## 3. 推荐的 AI 任务输入结构

建议按下面结构给 AI：

1. 目标
2. 主链路
3. 范围
4. 非目标
5. 已知线索
6. 验收标准
7. 验证要求

可直接使用：

- `docs/development/AI_TASK_BRIEF_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/ai_task_brief.md`

## 4. AI 最舒服的仓库工作流

### 4.1 任务进入

先用 Issue、任务单或结构化 brief 固定：

- 问题背景；
- 主链路；
- 影响目录；
- 风险边界。

### 4.2 资料入口

让 AI 先看入口文档，而不是直接在代码海里乱搜：

- 平台规则看 `docs/`
- 后端实现看 `backend/BACKEND_GUIDE.md` 与 `backend/docs/`
- 前端实现看 `frontend/FRONTEND_GUIDE.md` 与 `frontend/docs/`

### 4.3 实施前计划

对多步任务，先要求 AI：

- 拆计划；
- 标出关键路径；
- 判断是否需要文档同步；
- 判断需要哪些测试。

### 4.4 实施中约束

让 AI 只改明确边界内的文件：

- 不顺手修 unrelated 问题；
- 不引入第二套机制；
- 不跳过测试和文档判断；
- 不把历史材料继续堆回主入口。

### 4.5 交付时收口

PR 或结果说明里统一给出：

- Summary
- Impact Boundary
- Verification
- Risks

这也是当前 PR 模板的默认结构。

## 5. 推荐的任务粒度

### 5.1 适合交给 AI 的任务

- 明确模块内的实现；
- 白盒测试补齐；
- E2E 计划整理；
- 文档整理与索引收口；
- 已有架构内的小到中型功能扩展。

### 5.2 不适合直接丢给 AI 的任务

- 缺少边界定义的大范围重写；
- 没有验收标准的“全面优化”；
- 涉及重大业务方向决策但没有人类 owner；
- 高风险上线决策本身。

## 6. 提示词最佳实践

### 6.1 推荐写法

- 明确主链路：`auth / tenant / system / shell / infra`
- 明确目录范围
- 明确不可改范围
- 明确需要同步的文档
- 明确测试层级

### 6.2 推荐示例

```text
按 team 模式处理这个需求。

目标：
修复角色权限更新后前端菜单未刷新的问题。

主链路：
auth + system + shell

范围：
- frontend/src/modules/auth/store/
- frontend/src/stores/
- backend/internal/modules/system/role/
- backend/internal/shared/authorization/

不要动：
- tenant 初始化链路
- 非权限相关页面样式

验收标准：
- 角色权限变更后，重新获取权限与菜单
- 当前标签页和动态视图行为正常
- 文档同步更新

验证：
- 前端 type-check / build
- 后端相关 go test
- 补最小回归说明
```

## 7. AI 任务的文档策略

- 现行规范留在 `docs/`、`backend/docs/`、`frontend/docs/`
- 任务 brief、PR 描述、Issue 模板尽量短且结构化
- 不再保留一次性归档材料
- 现状与建议必须分开写

## 8. 与 GitHub 模板的关系

当前推荐配套使用：

- PR 模板：`.github/pull_request_template.md`
- Bug 模板：`.github/ISSUE_TEMPLATE/bug_report.md`
- Feature 模板：`.github/ISSUE_TEMPLATE/feature_request.md`
- AI Task Brief：`.github/ISSUE_TEMPLATE/ai_task_brief.md`

## 9. 最小落地要求

如果希望 AI 真正高效，至少做到：

- 每个任务先说清主链路；
- 给出明确范围和非目标；
- 提供 1~3 个关键入口文档；
- 明确测试和交付口径；
- 让 AI 输出结果可 Review、可验证、可追踪。
