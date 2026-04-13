# Contributing to Pantheon Platform

> 本文是 Pantheon Platform 的统一协作入口。  
> 无论你是人工开发者，还是通过 Codex / ChatGPT / Copilot 等 AI 工具参与，都建议先从这里开始。

## 1. 先看什么

建议按下面顺序阅读：

1. `README.md`
2. `docs/DOCS_INDEX.md`
3. `docs/development/DEVELOPER_GUIDE.md`
4. `docs/governance/ENGINEERING_WORKFLOW.md`
5. `docs/governance/AI_COLLABORATION_GUIDE.md`

如果你要改实现，再继续看：

- 后端：`backend/BACKEND_GUIDE.md`、`backend/docs/BACKEND_DOCS_INDEX.md`
- 前端：`frontend/FRONTEND_GUIDE.md`、`frontend/docs/FRONTEND_DOCS_INDEX.md`

## 2. 协作原则

- 先理解边界，再修改代码；
- 不引入第二套机制；
- 修根因，不做表面补丁；
- 改动范围与验证范围相匹配；
- 文档、测试、Review 一起收口。

## 3. 标准开发流程

统一遵守：

- 开发流程：`docs/governance/ENGINEERING_WORKFLOW.md`
- 交付模板：`docs/development/FEATURE_DELIVERY_TEMPLATE.md`
- 发布验收：`docs/governance/RELEASE_ACCEPTANCE_CHECKLIST.md`
- 系统自查：`docs/governance/SYSTEM_CHECKLIST.md`

## 4. 编码规范

统一遵守：

- 前端：`frontend/docs/FRONTEND_CODE_STANDARDS.md`
- 后端：`backend/docs/BACKEND_CODE_STANDARDS.md`
- API：`docs/api/API_DESIGN_STANDARDS.md`
- 编码与换行：`docs/governance/ENCODING_AND_LINE_ENDINGS.md`

## 5. 测试规范

统一遵守：

- 测试策略：`docs/testing/TEST_STRATEGY.md`
- 白盒测试：`docs/testing/WHITE_BOX_TEST_GUIDE.md`
- E2E 测试：`docs/testing/E2E_TEST_PLAN.md`

最小原则：

- 改前端，至少判断是否需要 `type-check / lint / build / test`
- 改后端，至少判断是否需要 `make test / make verify / make migrate-only`
- 涉及认证、租户、权限、菜单、动态视图时，要补联动验证

## 6. GitHub 协作方式

仓库默认使用：

- Bug Issue 模板
- Feature Request 模板
- AI Task Brief 模板
- Pull Request 模板

参考：

- `docs/governance/GITHUB_REPOSITORY_GUIDE.md`
- `docs/governance/GITHUB_BRANCH_PROTECTION_CHECKLIST.md`

推荐的 GitHub PR 推进顺序：

1. 从 `main` 拉出主题分支；
2. 本地完成最小可审阅改动并自查；
3. 尽早创建 Draft PR，对齐范围、风险和 review 焦点；
4. 补齐测试、文档、截图或日志后转为 Ready for review；
5. 等待 required checks 与 review 通过；
6. 使用约定的 merge 策略合并；
7. 合并后补发布说明、回滚信息或后续任务。

## 7. AI 工具最佳实践

如果你使用 AI 工具，优先使用结构化输入，不要只给模糊描述。

推荐资料：

- AI 协作指南：`docs/governance/AI_COLLABORATION_GUIDE.md`
- AI 任务简报模板：`docs/development/AI_TASK_BRIEF_TEMPLATE.md`
- GitHub AI Task Brief：`.github/ISSUE_TEMPLATE/ai_task_brief.md`

推荐至少说明：

- 目标；
- 主链路；
- 范围；
- 不要动什么；
- 验收标准；
- 验证要求。

## 8. 提交与 Review

统一遵守：

- 提交规范：`docs/governance/GIT_COMMIT_GUIDE.md`
- Review 规范：`docs/governance/CODE_REVIEW_GUIDE.md`

PR 默认应说明：

- 改了什么；
- 为什么这样改；
- 做了哪些验证；
- 还剩哪些风险或后续建议。

建议直接按 `.github/pull_request_template.md` 填写，不要省略验证和风险部分。

## 9. 文档维护

- 平台规则放 `docs/`
- 后端实现放 `backend/docs/`
- 前端实现放 `frontend/docs/`
- 不再保留一次性归档材料
- 现状与建议必须分开写

## 10. 一句话版本

如果你只记住一件事：

**先看文档入口，按主链路拆任务，按标准流程交付，结果必须可验证。**
