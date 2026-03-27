# GitHub 仓库治理建议

> 这份文档用于规范 Pantheon Platform 在 GitHub 上的协作方式。  
> 目标是让仓库具备稳定的提交流程、PR 入口和基础保护规则。

## 1. 建议启用的模板

仓库当前建议启用：

- Bug Issue 模板
- Feature Request 模板
- Pull Request 模板

它们已经放在：

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/pull_request_template.md`

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

如果后续新增更细的 job，可以按实际 job 名调整。

## 4. 推荐协作流程

1. 从 `main` 拉出主题分支
2. 本地开发并按规则提交
3. 推送分支到 GitHub
4. 创建 Pull Request
5. 等待 CI 通过与 review 完成
6. 合并回 `main`

## 5. PR 合并建议

建议优先使用：

- `Squash and merge`

适用原因：

- 保持 `main` 历史简洁
- 适合功能开发过程中存在多次本地小提交的情况

如果某些提交本身已经按主题拆分得很好，也可以保留普通 merge 策略，但不建议把混乱的提交历史直接并入主分支。

## 6. Issue 使用建议

- 缺陷、回归、线上异常走 Bug 模板
- 新功能、增强建议走 Feature Request 模板
- 纯提问、讨论、临时沟通可以不强制使用模板

## 7. 与文档和 Codex 的关系

- 仓库协作流程以 `README.md`、`docs/` 和 `AGENTS.md` 为准
- 如果 CI、分支策略、提交流程变化，要同步更新这份文档
