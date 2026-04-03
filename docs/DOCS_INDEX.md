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
- [认证与安全设计](auth/AUTH_SECURITY.md)
- [会话失效与权限刷新策略](auth/AUTH_SESSION_STRATEGY.md)
- [租户初始化与生命周期设计](tenant/TENANT_INITIALIZATION.md)

## 治理与部署

- [系统检查清单](governance/SYSTEM_CHECKLIST.md)
- [Team 模式协作指南](governance/TEAM_MODE_GUIDE.md)
- [Git 提交规范](governance/GIT_COMMIT_GUIDE.md)
- [GitHub 仓库治理建议](governance/GITHUB_REPOSITORY_GUIDE.md)
- [文档编码与换行规范](governance/ENCODING_AND_LINE_ENDINGS.md)
- [部署说明](deploy/DEPLOYMENT.md)

## 实现视角入口

### 后端

- [后端文档中心](../backend/docs/BACKEND_DOCS_INDEX.md)
- [系统管理后端实现](../backend/docs/system/SYSTEM_BACKEND.md)
- [认证后端实现](../backend/docs/auth/AUTH_BACKEND.md)
- [租户后端实现](../backend/docs/tenant/TENANT_BACKEND.md)

### 前端

- [前端文档中心](../frontend/docs/FRONTEND_DOCS_INDEX.md)
- [系统管理前端实现](../frontend/docs/system/SYSTEM_FRONTEND.md)
- [认证前端实现](../frontend/docs/auth/AUTH_FRONTEND.md)
- [租户前端实现](../frontend/docs/tenant/TENANT_FRONTEND.md)

## 推荐阅读顺序

1. 先读 `README.md` 了解平台整体定位
2. 再读 `docs/system/SYSTEM_MANAGEMENT.md` 理解系统管理核心业务模型
3. 再读 `docs/system/UI_DESIGN.md` 理解平台级界面设计约束
4. 再读 `docs/auth/AUTH_SECURITY.md` 与 `docs/auth/AUTH_SESSION_STRATEGY.md`
5. 再读 `docs/tenant/TENANT_INITIALIZATION.md` 理解租户初始化与生命周期
6. 部署与验收时再读 `docs/deploy/DEPLOYMENT.md` 与 `docs/governance/SYSTEM_CHECKLIST.md`
7. 需要看代码落地时，再进入 `backend/docs/` 与 `frontend/docs/`

## 文档边界

- `README.md`：平台总览与入口
- `docs/`：平台级设计
- `backend/docs/`：后端专题实现
- `frontend/docs/`：前端专题实现
- `backend/api/swagger/`：接口生成产物



