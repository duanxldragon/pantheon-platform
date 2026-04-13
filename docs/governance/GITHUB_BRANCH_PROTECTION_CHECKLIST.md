# GitHub 分支保护落地清单

> 本文不是原则说明，而是给仓库管理员直接操作 GitHub Settings 用的执行清单。  
> 目标是把 Pantheon Platform 当前推荐的 PR 流程、Review 流程和 CI 检查真正落到仓库配置中。

## 1. 适用对象

适用于负责仓库治理的管理员或 Maintainer。

建议在以下场景执行：

- 仓库初始化；
- 新增 CI workflow 后；
- 引入正式 E2E 后；
- 调整分支策略或 merge 策略后。

## 2. 建议保护的分支

至少保护：

- `main`

如果后续引入长期维护分支，也建议同步保护：

- `develop`
- 发布分支或稳定分支

## 3. GitHub 页面操作入口

进入：

`Repository -> Settings -> Branches -> Branch protection rules`

如果仓库使用新的 Rulesets，也可以在：

`Repository -> Settings -> Rules -> Rulesets`

按同样思路配置。

## 4. `main` 推荐设置

建议开启：

- Require a pull request before merging
- Require approvals
- Dismiss stale pull request approvals when new commits are pushed
- Require review from Code Owners
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require conversation resolution before merging
- Restrict force pushes
- Do not allow deletions

按团队规模可选：

- Require approval of the most recent reviewable push
- Require merge queue
- Restrict who can push to matching branches

## 5. 建议纳入 required checks

当前建议至少纳入：

- `Backend CI / Test`
- `Backend CI / Build`
- `Frontend CI / Lint`
- `Frontend CI / Test`
- `Frontend CI / Build`
- `Frontend E2E System / System Management E2E`
- `Frontend E2E API Key / API Key Security E2E`
- `Text Hygiene / Check Encoding And Line Endings`

如果 workflow 或 job 名变化，要同步更新分支保护规则。

## 6. `CODEOWNERS` 配置检查

仓库当前建议同时启用：

- `.github/CODEOWNERS`

管理员需要确认：

- GitHub 用户名与实际 reviewer 一致；
- 需要 owner review 的路径已经覆盖；
- `Require review from Code Owners` 已开启。

如果后续引入多人协作，建议按目录拆分 owner，例如：

- `backend/`
- `frontend/`
- `docs/`
- `.github/`

## 7. Merge 策略建议

建议优先保留：

- `Squash and merge`

按需保留：

- `Merge commit`

一般不建议默认依赖：

- `Rebase and merge`

原因：

- `Squash and merge` 更适合主题分支开发；
- 可以让 `main` 历史更聚焦；
- 更适合 AI 协作和多次中间提交的场景。

## 8. 合并后仓库建议

建议在仓库设置中同时开启：

- Automatically delete head branches

这样可以减少主题分支残留。

## 9. 每次新增 CI 后的复核动作

新增 workflow 或调整 job 名后，管理员建议立即复核：

1. workflow 是否已在默认分支存在；
2. PR 页面是否能看到新 check；
3. 分支保护 required checks 是否已经同步；
4. PR 模板是否需要补新的验证项；
5. 文档是否需要同步更新。

## 10. 管理员操作完成定义

当以下事项都满足时，可以认为 GitHub 分支保护已经落地：

- `main` 必须通过 PR 才能合并；
- required checks 已配置并正常阻塞失败 PR；
- CODEOWNERS 已生效；
- review 与 comment resolution 已纳入强制要求；
- merge 策略与团队预期一致；
- 协作入口文档已同步。
