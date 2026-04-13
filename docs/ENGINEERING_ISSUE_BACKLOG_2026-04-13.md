# Pantheon Platform 工程整改 Issue Backlog（2026-04-13）

## 1. 文档定位

本文把 `docs/ENGINEERING_REMEDIATION_PLAN_2026-04-13.md` 进一步拆成可直接录入 GitHub Issues 的任务清单。

默认对齐仓库现有模板：

- AI 任务：`.github/ISSUE_TEMPLATE/ai_task_brief.md`
- 功能增强：`.github/ISSUE_TEMPLATE/feature_request.md`
- 缺陷修复：`.github/ISSUE_TEMPLATE/bug_report.md`

建议用法：

1. 先按 `P0 / P1 / P2` 建 Milestone；
2. 再按本文的 issue 顺序录入；
3. 高风险 issue 优先走 `task(...)` 或 `feat(...)`，避免只写模糊标题。

---

## 2. Milestone 建议

### Milestone A：Runtime Quality Baseline（P0）

- 前端白盒测试基线
- E2E 套件治理
- E2E 纳入 CI
- Go 版本基线统一

### Milestone B：Security & Runtime Hardening（P0 / P1）

- API Key 高安全增强
- 前端访问控制职责收敛
- 权限拒绝 / 会话 / 租户联动 E2E

### Milestone C：Governance to Automation（P1 / P2）

- Review 风险矩阵
- ADR 机制
- 能力状态矩阵
- a11y / 视觉 / 发布门禁治理

---

## 3. P0 Issue 清单

## Issue P0-1

### 建议标题

`task(frontend-runtime): establish vitest baseline for stores and guards`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/ai_task_brief.md`

### 建议标签

- `task`
- `frontend`
- `test`
- `p0`

### 建议内容

**Goal**

建立前端核心运行时的正式 Vitest 白盒测试基线，覆盖全局状态、视图导航和权限边界的关键规则。

**Main Line**

- [x] system
- [x] shell / runtime

**Task Type**

- [x] implementation
- [x] test design

**In Scope**

- `frontend/src/modules/auth/store/auth_store.ts`
- `frontend/src/stores/system_store.ts`
- `frontend/src/stores/ui_store.ts`
- `frontend/src/shared/components/use_view_manager.ts`
- `frontend/src/shared/components/route_guard.tsx`
- `frontend/src/shared/components/query_access_boundary.tsx`

**Out Of Scope**

- 大规模重构页面 UI
- 替换当前路由体系

**Acceptance Criteria**

- [ ] `frontend/src/` 下新增正式测试文件
- [ ] 覆盖登录态 / 权限 / 菜单变化 / fallback 主逻辑
- [ ] `npm run test:coverage` 稳定通过
- [ ] 测试不依赖临时页面或手工环境

**Verification Expectation**

- [x] Static / build checks
- [x] White-box / module tests
- [ ] Integration validation
- [ ] E2E / smoke validation
- [ ] Docs sync

---

## Issue P0-2

### 建议标题

`task(testing): curate playwright suite and archive temporary specs`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/ai_task_brief.md`

### 建议标签

- `task`
- `testing`
- `frontend`
- `p0`

### 建议内容

**Goal**

把 `frontend/tests/` 中的正式 E2E 用例与临时排障用例分离，形成可长期维护的正式 Playwright 套件。

**Main Line**

- [x] system
- [x] shell / runtime
- [x] infra / tooling

**Task Type**

- [x] refactor
- [x] test design

**In Scope**

- 盘点 `frontend/tests/*.spec.ts`
- 清理或归档 `tmp-*` 用例
- 明确正式套件命名和目录约定
- 明确临时排障脚本的存放规则

**Acceptance Criteria**

- [ ] `frontend/tests/` 中不再混入临时主流程规格
- [ ] 正式 E2E 用例清单可明确列出
- [ ] 临时排障脚本有明确归档位置
- [ ] 测试目录命名规则形成文档或 README 说明

**Verification Expectation**

- [ ] Static / build checks
- [x] White-box / module tests
- [ ] Integration validation
- [x] E2E / smoke validation
- [x] Docs sync

---

## Issue P0-3

### 建议标题

`feat(ci): run official frontend e2e smoke suite in github actions`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/feature_request.md`

### 建议标签

- `enhancement`
- `ci`
- `testing`
- `p0`

### 建议内容

**Summary**

将正式 Playwright 主链路测试纳入 GitHub Actions，形成前端 E2E 门禁。

**Main Line**

- [x] shell / runtime
- [x] infra / tooling

**Problem**

当前前端 CI 只覆盖 lint、type-check、Vitest、build，主用户旅程并未进入自动门禁。

**Proposed Solution**

新增独立 E2E workflow 或在前端 CI 中追加 E2E job，仅运行已治理后的正式主链路套件，并上传 trace、report、screenshots。

**Scope**

- Module: `frontend/tests/` + `.github/workflows/`
- Backend impact: 测试环境编排
- Frontend impact: E2E 入口与脚本
- Data / migration impact: 测试数据准备
- Auth / permission impact: 需覆盖正式登录链路
- Docs impact: 测试执行说明

**Acceptance Criteria**

- [ ] GitHub Actions 可执行正式 Playwright 主链路
- [ ] 失败时保留 trace / report / screenshot
- [ ] 明确环境变量与测试数据要求
- [ ] 不依赖人工本地触发

**Test Expectation**

- [x] Static / build checks
- [ ] White-box / module tests
- [x] Integration validation
- [x] E2E / smoke validation

---

## Issue P0-4

### 建议标题

`fix(ci): align backend github actions with go 1.24 baseline`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/bug_report.md`

### 建议标签

- `bug`
- `backend`
- `ci`
- `p0`

### 建议内容

**Summary**

后端仓库使用 `Go 1.24.0`，但 GitHub Actions 仍使用 `Go 1.23`，存在技术基线不一致问题。

**Main Line**

- [x] infra / tooling

**Scope**

- Module: `.github/workflows/backend-ci.yml`
- Affected area: backend CI
- Severity: `P0`

**Current Behavior**

本地和 CI 使用的 Go 版本不一致，可能导致构建、依赖和行为差异。

**Expected Behavior**

CI 与仓库声明版本一致，避免“本地可用 / CI 失败”或相反情况。

**Suspected Boundary**

- [x] migration / configuration / deployment

**Expected Verification**

- [x] Static / build check
- [ ] White-box / module test
- [ ] Integration validation
- [ ] E2E / smoke validation

---

## Issue P0-5

### 建议标题

`feat(auth): harden api key security model and validation chain`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/feature_request.md`

### 建议标签

- `enhancement`
- `auth`
- `security`
- `backend`
- `frontend`
- `p0`

### 建议内容

**Summary**

增强 API Key 的权限边界与安全控制，补齐 scope、速率限制、IP allowlist、有效期与使用审计。

**Main Line**

- [x] auth
- [x] infra / tooling

**Problem**

当前 API Key 能力可用，但安全边界仍偏弱，尚未达到高安全场景的产品级要求。

**Proposed Solution**

在后端扩展 API Key 数据模型与验证链路，在前端管理页同步呈现范围、有效期与安全限制，并补齐白盒和 E2E。

**Scope**

- Module: `backend/internal/modules/auth/` + `frontend/src/modules/auth/`
- Backend impact: DAO / service / middleware / model
- Frontend impact: API Key 管理页面与交互
- Data / migration impact: API Key 模型字段变更
- Auth / permission impact: API Key 独立权限与限流校验
- Docs impact: `docs/auth/AUTH_SECURITY.md`

**Acceptance Criteria**

- [ ] API Key 支持独立权限范围
- [ ] API Key 支持独立速率限制
- [ ] API Key 支持 IP allowlist
- [ ] API Key 支持有效期与最近使用时间
- [ ] 前后端交互与测试闭环完成

**Test Expectation**

- [x] Static / build checks
- [x] White-box / module tests
- [x] Integration validation
- [x] E2E / smoke validation

---

## 4. P1 Issue 清单

## Issue P1-1

### 建议标题

`task(frontend-runtime): define and enforce access-control responsibility matrix`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/ai_task_brief.md`

### 建议标签

- `task`
- `frontend`
- `architecture`
- `p1`

### 建议内容

**Goal**

梳理并收敛前端访问控制职责，明确路由守卫、视图守卫、查询权限边界各自负责的范围。

**In Scope**

- `frontend/src/router/index.tsx`
- `frontend/src/shared/components/route_guard.tsx`
- `frontend/src/shared/components/query_access_boundary.tsx`
- `frontend/src/shared/components/use_view_manager.ts`
- 相关文档同步

**Acceptance Criteria**

- [ ] 形成职责矩阵
- [ ] 消除明显重复判断
- [ ] 新页面接入路径更清晰
- [ ] 有对应白盒测试

---

## Issue P1-2

### 建议标题

`feat(testing): add e2e coverage for permission denial and session governance`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/feature_request.md`

### 建议标签

- `enhancement`
- `testing`
- `auth`
- `system`
- `p1`

### 建议内容

**Summary**

补齐权限拒绝矩阵、会话管理与异常态的正式 E2E 覆盖。

**Problem**

当前 E2E 以正向主流程为主，高风险异常态仍缺稳定自动化。

**Acceptance Criteria**

- [ ] 覆盖权限丢失后的页面回退
- [ ] 覆盖会话查看 / 终止 / 终止其他会话
- [ ] 覆盖 API Key 主流程
- [ ] 覆盖错误边界或白屏回归的最小场景

---

## Issue P1-3

### 建议标题

`task(ui-governance): reduce hard-coded visual semantics and strengthen token usage`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/ai_task_brief.md`

### 建议标签

- `task`
- `frontend`
- `ui`
- `p1`

### 建议内容

**Goal**

降低业务页面中直接使用 `slate/amber/white` 等视觉类名的比例，提高 token 语义化一致性。

**Acceptance Criteria**

- [ ] 梳理高频硬编码视觉类名场景
- [ ] 优先收敛共享组件和高影响页面
- [ ] 形成可持续替换策略
- [ ] 同步 UI 实现文档

---

## Issue P1-4

### 建议标题

`task(governance): define reviewer matrix for high-risk changes`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/ai_task_brief.md`

### 建议标签

- `task`
- `governance`
- `review`
- `p1`

### 建议内容

**Goal**

建立高风险改动的 reviewer / owner 矩阵，明确哪些改动必须额外复核。

**Acceptance Criteria**

- [ ] 定义高风险改动分类
- [ ] 定义 reviewer 要求
- [ ] 定义 blocking / non-blocking 约定
- [ ] 同步 PR / review 文档

---

## Issue P1-5

### 建议标题

`task(docs): distinguish implemented capabilities from recommended enhancements`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/ai_task_brief.md`

### 建议标签

- `task`
- `docs`
- `governance`
- `p1`

### 建议内容

**Goal**

继续收紧平台文档表述，明确哪些是当前事实，哪些只是推荐增强，减少预期偏差。

**In Scope**

- `docs/auth/AUTH_SECURITY.md`
- 其他包含增强建议的大型设计文档

**Acceptance Criteria**

- [ ] 建议态内容有明确标识
- [ ] 当前事实描述与代码一致
- [ ] 不再混淆现状能力和未来规划

---

## 5. P2 Issue 清单

## Issue P2-1

### 建议标题

`feat(governance): introduce architecture decision record workflow`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/feature_request.md`

### 建议标签

- `enhancement`
- `architecture`
- `docs`
- `p2`

### 建议内容

**Summary**

为重大架构变更引入 ADR 机制，沉淀长期可追踪的设计决策。

**Acceptance Criteria**

- [ ] ADR 模板建立
- [ ] ADR 目录建立
- [ ] 明确哪些变更必须写 ADR
- [ ] 文档入口同步

---

## Issue P2-2

### 建议标题

`task(governance): create capability status matrix for platform docs`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/ai_task_brief.md`

### 建议标签

- `task`
- `docs`
- `architecture`
- `p2`

### 建议内容

**Goal**

建立“已实现 / 部分实现 / 规划中”的能力状态矩阵，统一平台文档中的能力口径。

**Acceptance Criteria**

- [ ] 有统一状态定义
- [ ] 有首版矩阵文档
- [ ] 能与功能评估和工程评估联动

---

## Issue P2-3

### 建议标题

`feat(frontend-quality): pilot accessibility and visual regression gates`

### 建议模板

使用 `.github/ISSUE_TEMPLATE/feature_request.md`

### 建议标签

- `enhancement`
- `frontend`
- `testing`
- `ui`
- `p2`

### 建议内容

**Summary**

试点接入 a11y 与视觉回归门禁，把 UI 规范中的可访问性和一致性要求进一步自动化。

**Acceptance Criteria**

- [ ] 确定试点页面
- [ ] 确定 a11y 检查方式
- [ ] 确定视觉回归工具或策略
- [ ] 形成试点 workflow 与执行说明

---

## 6. 建议录入顺序

建议按以下顺序录入和排期：

1. `P0-4`：Go 版本基线统一
2. `P0-1`：前端白盒测试基线
3. `P0-2`：E2E 套件治理
4. `P0-3`：E2E 纳入 CI
5. `P0-5`：API Key 高安全增强
6. `P1-1`：前端访问控制职责收敛
7. `P1-2`：权限拒绝 / 会话治理 E2E
8. `P1-4`：Review 风险矩阵
9. `P1-5`：文档能力口径收紧
10. `P2-1`：ADR 机制
11. `P2-2`：能力状态矩阵
12. `P2-3`：a11y / 视觉回归试点

---

## 7. 使用建议

### 7.1 如果由 AI 协作执行

优先使用：

- `task(...)` 用于分析、重构、测试设计、治理类任务；
- `feat(...)` 用于能力增强；
- `fix(...)` 用于明确的缺陷或基线不一致问题。

### 7.2 如果由人工团队执行

建议每个 issue 最少补充：

- 责任人
- 目标迭代
- 风险等级
- 依赖 issue

### 7.3 如果要形成项目板

建议建立以下列：

- `Backlog`
- `Ready`
- `In Progress`
- `In Review`
- `Blocked`
- `Done`

并至少加 4 个自定义字段：

- `Priority`
- `Main Line`
- `Risk`
- `Verification Level`

---

## 8. 最终建议

如果你准备真正把这套流程跑起来，建议先不要一次性录入太多 issue。

更高效的方式是：

1. 先录入全部 `P0`；
2. 从 `P0-4`、`P0-1`、`P0-2` 开始执行；
3. 等正式测试门禁稳定后，再推进 `API Key` 与治理类任务；
4. `P2` 保留为制度建设，不要抢 `P0/P1` 的节奏。
