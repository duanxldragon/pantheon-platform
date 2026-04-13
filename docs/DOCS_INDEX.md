# 平台文档中心

> `docs/` 只承载平台级设计文档。  
> 这里回答“平台怎么设计、模块如何分工、能力如何协作”，不展开前后端具体代码实现。

## 入口文档

- [项目入口](../README.md)
- [后端总览](../backend/BACKEND_GUIDE.md)
- [前端总览](../frontend/FRONTEND_GUIDE.md)

## 平台级专题

- [系统管理模块设计](system/SYSTEM_MANAGEMENT.md)
- [平台 UI 设计规范](system/UI_DESIGN.md)
- [前端 DESIGN.md 稳定设计描述](../frontend/DESIGN.md)
- [认证与安全设计](auth/AUTH_SECURITY.md)
- [会话失效与权限刷新策略](auth/AUTH_SESSION_STRATEGY.md)
- [租户初始化与生命周期设计](tenant/TENANT_INITIALIZATION.md)
- [数据库命名规划](tenant/DATABASE_NAMING_STRATEGY.md)
- [通知模块设计](notification/NOTIFICATION.md)

## 补充专题

- [API 设计规范](api/API_DESIGN_STANDARDS.md)
- [系统架构设计](design/SYSTEM_ARCHITECTURE.md)
- [开发者指南](development/DEVELOPER_GUIDE.md)
- [AI 任务简报模板](development/AI_TASK_BRIEF_TEMPLATE.md)
- [功能交付模板](development/FEATURE_DELIVERY_TEMPLATE.md)
- [前端架构现状与演进建议](frontend/FRONTEND_ARCHITECTURE.md)

## 开发流程与治理

- [工程开发流程](governance/ENGINEERING_WORKFLOW.md)
- [AI 协作指南](governance/AI_COLLABORATION_GUIDE.md)
- [发布验收清单](governance/RELEASE_ACCEPTANCE_CHECKLIST.md)
- [系统检查清单](governance/SYSTEM_CHECKLIST.md)
- [文档维护约定](governance/DOCUMENTATION_CONVENTIONS.md)
- [Code Review 规范](governance/CODE_REVIEW_GUIDE.md)
- [Team 模式协作指南](governance/TEAM_MODE_GUIDE.md)
- [Git 提交规范](governance/GIT_COMMIT_GUIDE.md)
- [GitHub 仓库治理建议](governance/GITHUB_REPOSITORY_GUIDE.md)
- [文档编码与换行规范](governance/ENCODING_AND_LINE_ENDINGS.md)

## 专项规范与专题指南

- [i18n 最佳实践](I18N_BEST_PRACTICES.md)
- [i18n 键值规范](I18N_KEY_CONVENTIONS.md)
- [i18n 使用示例](I18N_USAGE_EXAMPLES.md)
- [TanStack Query 指南](TANSTACK_QUERY_GUIDE.md)
- [性能优化指南](PERFORMANCE_GUIDE.md)

## 治理与部署

- [部署说明](deploy/DEPLOYMENT.md)

## 测试与质量

- [测试策略](testing/TEST_STRATEGY.md)
- [白盒测试规范](testing/WHITE_BOX_TEST_GUIDE.md)
- [E2E 测试计划](testing/E2E_TEST_PLAN.md)
- [集成测试计划](testing/INTEGRATION_TEST_PLAN.md)
- [安全测试计划](testing/SECURITY_TEST_PLAN.md)
- [性能测试计划](testing/PERFORMANCE_TEST_PLAN.md)

## 实现视角入口

### 后端

- [后端文档中心](../backend/docs/BACKEND_DOCS_INDEX.md)
- [后端代码规范](../backend/docs/BACKEND_CODE_STANDARDS.md)
- [系统管理后端实现](../backend/docs/system/SYSTEM_BACKEND.md)
- [认证后端实现](../backend/docs/auth/AUTH_BACKEND.md)
- [租户后端实现](../backend/docs/tenant/TENANT_BACKEND.md)

### 前端

- [前端文档中心](../frontend/docs/FRONTEND_DOCS_INDEX.md)
- [前端代码规范](../frontend/docs/FRONTEND_CODE_STANDARDS.md)
- [系统管理前端实现](../frontend/docs/system/SYSTEM_FRONTEND.md)
- [认证前端实现](../frontend/docs/auth/AUTH_FRONTEND.md)
- [租户前端实现](../frontend/docs/tenant/TENANT_FRONTEND.md)

## 推荐阅读顺序

1. 先读 `README.md` 了解平台整体定位
2. 再读 `docs/system/SYSTEM_MANAGEMENT.md` 理解系统管理核心业务模型
3. 再读 `docs/system/UI_DESIGN.md` 理解平台级界面设计约束
4. 再读 `frontend/DESIGN.md` 了解给前端与 AI 代理使用的稳定视觉描述
5. 再读 `docs/auth/AUTH_SECURITY.md` 与 `docs/auth/AUTH_SESSION_STRATEGY.md`
6. 再读 `docs/tenant/TENANT_INITIALIZATION.md` 理解租户初始化与生命周期
7. 部署与验收时再读 `docs/deploy/DEPLOYMENT.md` 与 `docs/governance/SYSTEM_CHECKLIST.md`
8. 需要看代码落地时，再进入 `backend/docs/` 与 `frontend/docs/`

## 文档边界

- `README.md`：平台总览与入口
- `docs/`：平台级设计
- `docs/notification/`：通知等补充平台能力设计
- `backend/docs/`：后端专题实现
- `frontend/docs/`：前端专题实现
- `backend/api/swagger/`：接口生成产物



