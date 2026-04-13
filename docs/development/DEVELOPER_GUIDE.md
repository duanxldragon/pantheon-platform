# Pantheon Platform 开发者指南

> 本文是开发流程入口文档。
> 它不替代专题设计和实现文档，而是回答“接到需求后按什么顺序做、查什么、改什么、验什么”。

## 1. 推荐阅读顺序

### 平台级任务

1. `README.md`
2. `docs/DOCS_INDEX.md`
3. `docs/design/SYSTEM_ARCHITECTURE.md`
4. `docs/system/SYSTEM_MANAGEMENT.md`
5. `docs/auth/AUTH_SECURITY.md`
6. `docs/auth/AUTH_SESSION_STRATEGY.md`
7. `docs/tenant/TENANT_INITIALIZATION.md`

### 后端任务

1. `backend/BACKEND_GUIDE.md`
2. `backend/docs/BACKEND_DOCS_INDEX.md`
3. `backend/docs/BACKEND_CODE_STANDARDS.md`

### 前端任务

1. `frontend/FRONTEND_GUIDE.md`
2. `frontend/docs/FRONTEND_DOCS_INDEX.md`
3. `frontend/docs/FRONTEND_CODE_STANDARDS.md`
4. `docs/system/UI_DESIGN.md`
5. `frontend/docs/system/UI_IMPLEMENTATION_GUIDE.md`

## 2. 标准开发流程

### 2.1 需求分解

先判断本次变更主要影响哪条主链路：

- `auth`
- `tenant`
- `system`
- `notification`
- 前端壳层 / 初始化 / 菜单 / 权限
- 基础设施 / 中间件 / 数据层

不要先粗暴按“前端 / 后端”二分。

### 2.2 设计确认

编码前至少明确：

- 数据边界：主库还是租户库；
- 权限边界：是否影响角色、菜单、Casbin、会话刷新；
- 生命周期边界：是否影响登录、刷新、初始化、停用；
- UI 边界：是否影响菜单、标签页、动态视图、工作台壳层；
- 测试边界：需要补白盒、集成还是 E2E。

标准流程参考：

- `docs/governance/ENGINEERING_WORKFLOW.md`
- `docs/governance/AI_COLLABORATION_GUIDE.md`
- `docs/development/AI_TASK_BRIEF_TEMPLATE.md`
- `docs/development/FEATURE_DELIVERY_TEMPLATE.md`

### 2.3 实施约束

- 前端遵守：`frontend/docs/FRONTEND_CODE_STANDARDS.md`
- 后端遵守：`backend/docs/BACKEND_CODE_STANDARDS.md`
- UI 遵守：`docs/system/UI_DESIGN.md`
- 文档遵守：`docs/governance/DOCUMENTATION_CONVENTIONS.md`

### 2.4 Review

提交前使用：

- `docs/governance/CODE_REVIEW_GUIDE.md`

重点检查：

- 架构边界是否被破坏；
- 是否引入重复机制；
- 是否破坏租户隔离或认证链路；
- 是否遗漏文档和测试。

### 2.5 测试

统一遵守：

- `docs/testing/TEST_STRATEGY.md`

重点补齐：

- 白盒测试：`docs/testing/WHITE_BOX_TEST_GUIDE.md`
- E2E 测试：`docs/testing/E2E_TEST_PLAN.md`

## 3. 规范文档地图

### 架构与设计

- 系统架构：`docs/design/SYSTEM_ARCHITECTURE.md`
- API 规范：`docs/api/API_DESIGN_STANDARDS.md`
- UI 设计：`docs/system/UI_DESIGN.md`

### 编码与实现

- 编码与换行：`docs/governance/ENCODING_AND_LINE_ENDINGS.md`
- 前端代码规范：`frontend/docs/FRONTEND_CODE_STANDARDS.md`
- 后端代码规范：`backend/docs/BACKEND_CODE_STANDARDS.md`
- 前端命名规范：`frontend/docs/FRONTEND_NAMING_CONVENTIONS.md`
- 后端命名规范：`backend/docs/BACKEND_NAMING_CONVENTIONS.md`

### 过程与质量

- 工程开发流程：`docs/governance/ENGINEERING_WORKFLOW.md`
- AI 协作指南：`docs/governance/AI_COLLABORATION_GUIDE.md`
- 发布验收清单：`docs/governance/RELEASE_ACCEPTANCE_CHECKLIST.md`
- AI 任务简报模板：`docs/development/AI_TASK_BRIEF_TEMPLATE.md`
- 功能交付模板：`docs/development/FEATURE_DELIVERY_TEMPLATE.md`
- Code Review：`docs/governance/CODE_REVIEW_GUIDE.md`
- Team 模式：`docs/governance/TEAM_MODE_GUIDE.md`
- 测试策略：`docs/testing/TEST_STRATEGY.md`
- 白盒测试：`docs/testing/WHITE_BOX_TEST_GUIDE.md`
- E2E 计划：`docs/testing/E2E_TEST_PLAN.md`

## 4. 交付完成定义

一次合格交付至少应满足：

- 设计边界清楚；
- 改动落在正确目录；
- 未引入第二套机制；
- 文案、编码、i18n 无明显问题；
- 有与改动相称的测试；
- 相关文档已同步；
- Review 清单可通过。

## 5. 常用命令

### 前端

```bash
cd frontend
npm run type-check
npm run lint
npm run test
npm run build
```

### 后端

```bash
cd backend
make test
make verify
make migrate-only
```

## 6. 文档维护原则

- 入口文档保持短；
- 平台规则写在 `docs/`；
- 前端实现写在 `frontend/docs/`；
- 后端实现写在 `backend/docs/`；
- 阶段性评估、报告、过程材料不作为规范主入口。
