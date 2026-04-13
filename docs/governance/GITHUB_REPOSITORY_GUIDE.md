# GitHub 仓库治理建议

> 这份文档用于规范 Pantheon Platform 在 GitHub 上的协作方式。  
> 目标是让仓库具备稳定的提交流程、PR 入口和基础保护规则。

如果你是仓库管理员，想直接在 GitHub Settings 中落地这些规则，请同时看：

- `docs/governance/GITHUB_BRANCH_PROTECTION_CHECKLIST.md`

## 1. 建议启用的模板

仓库当前建议启用：

- Bug Issue 模板
- Feature Request 模板
- AI Task Brief 模板
- Pull Request 模板

它们已经放在：

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/ISSUE_TEMPLATE/ai_task_brief.md`
- `.github/pull_request_template.md`
- `.github/CODEOWNERS`

## 2. 建议的分支保护

建议对 `main` 开启分支保护：

- Require a pull request before merging
- Require at least 1 approval
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Restrict force pushes
- Restrict branch deletion

## 3. 建议纳入的状态检查

根据当前 CI，建议至少保护这些检查：

- `Backend CI / Test`
- `Backend CI / Build`
- `Frontend CI / Lint`
- `Frontend CI / Test`
- `Frontend CI / Build`
- `Frontend E2E System / System Management E2E`
- `Frontend E2E API Key / API Key Security E2E`
- `Text Hygiene / Check Encoding And Line Endings`

如果后续新增更细的 job，可以按实际 job 名调整。

其中 `Text Hygiene` 用于阻止以下问题进入主分支：

- 非 `UTF-8` 文本文件
- 带 `BOM` 的 UTF-8 文件
- 不符合仓库约定的换行风格

## 4. 推荐协作流程

1. 从 `main` 拉出主题分支
2. 本地开发并按规则提交
3. 推送分支到 GitHub
4. 尽早创建 Draft Pull Request
5. 按模板补齐范围、验证、风险、review focus
6. 转为 Ready for review
7. 等待 CI 通过与 review 完成
8. 合并回 `main`

### 4.1 推荐 PR 状态机

- `Draft`：范围还在收敛、验证未完成、提前对齐方向
- `Ready for review`：代码、测试、文档和风险说明已基本收口
- `Approved`：review 已通过，等待 required checks
- `Merged`：按约定策略合并，并同步发布说明或后续任务

### 4.2 Draft PR 最低要求

即使是 Draft PR，也建议至少说明：

- 主链路和目标；
- 影响模块；
- 当前已完成部分；
- 主要风险或阻塞项；
- 预计还要补哪些测试 / 文档。

### 4.3 Ready for review 最低要求

转为正式评审前，建议至少满足：

- PR 模板已填写完整；
- 与改动相称的验证已完成；
- 需要的截图、日志或接口样例已附上；
- 未覆盖项和原因已写明；
- reviewer 能快速知道重点看哪里。

## 5. PR 合并建议

建议优先使用：

- `Squash and merge`

适用原因：

- 保持 `main` 历史简洁
- 适合功能开发过程中存在多次本地小提交的情况

如果某些提交本身已经按主题拆分得很好，也可以保留普通 merge 策略，但不建议把混乱的提交历史直接并入主分支。

### 5.1 合并前最后检查

建议在点击 merge 前最后确认：

- 分支已与目标分支同步；
- required checks 全绿；
- 必须修改项已经关闭；
- PR 描述中的验证和最终提交一致；
- 回滚方式和发布影响明确。

### 5.2 合并后动作

如果 PR 涉及主链路或运行时行为，建议合并后继续做：

- 补一条简短发布说明；
- 记录风险观察项；
- 把未完成增强项转回 Issue 或任务系统；
- 如有必要，补充发布验收或回滚演练。

## 6. Issue 使用建议

- 缺陷、回归、线上异常走 Bug 模板
- 新功能、增强建议走 Feature Request 模板
- 需要 AI 辅助执行、分析、补文档或设计测试时，优先走 AI Task Brief 模板
- 纯提问、讨论、临时沟通可以不强制使用模板

## 7. 与文档和 Codex 的关系

- 协作入口建议统一从 `CONTRIBUTING.md` 开始
- 仓库协作流程以 `README.md`、`docs/` 和 `AGENTS.md` 为准
- AI 协作建议以 `docs/governance/AI_COLLABORATION_GUIDE.md` 为准
- 如果 CI、分支策略、提交流程变化，要同步更新这份文档

## 8. 推荐仓库设置清单

建议仓库管理员在 GitHub 页面实际落地：

- 开启分支保护；
- 配置 required checks；
- 使用默认 PR 模板；
- 打开自动删除已合并分支；
- 统一合并策略，优先 `Squash and merge`；
- 在需要的仓库启用 CODEOWNERS 或 reviewer 路由规则。
