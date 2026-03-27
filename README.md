# Pantheon Platform

> 面向企业内部系统与 SaaS 产品的多租户后台管理平台底座。

[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![React Version](https://img.shields.io/badge/React-19+-cyan.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 项目定位

Pantheon Platform 不是单纯的“管理后台页面集合”，而是一套可持续扩展的后台管理系统底座，目标是同时支持：

- 私有化单租户交付；
- PaaS 平台化底座建设；
- SaaS 多租户产品化运营；
- 后续业务模块按统一规范接入与扩展。

当前平台重点围绕三条主线建设：

- `auth/`：登录、退出、会话安全、二次认证；
- `tenant/`：租户开通、初始化、部署模式、生命周期；
- `system/`：租户内系统管理核心能力。

## 核心能力

### 平台底座

- 多租户与可配置部署模式；
- 多语言支持；
- JWT + Refresh Token 会话体系；
- 可配置二次认证（2FA / TOTP / 备份码）；
- 权限动态初始化与会话刷新策略；
- 动态菜单、动态路由、动态页面挂载。

### 系统管理模块

系统管理模块是当前阶段的核心模块，覆盖：

- 用户管理；
- 部门管理；
- 岗位管理；
- 角色管理；
- 权限管理；
- 菜单管理；
- 日志管理；
- 系统设置；
- 系统监控；
- 个人中心。

它负责租户内部“管人、管权、管菜单、管日志、管设置”，并为后续主机管理、CMDB、作业平台、流程引擎等模块提供统一接入方式。

## 架构概览

```text
Frontend (React + Vite + Zustand)
        |
        v
API Gateway / Gin Middleware
  |- Auth
  |- Tenant Context
  |- Authorization
  |- I18n
  |- Audit / Logging
        |
        v
Backend Modules
  |- auth
  |- tenant
  |- system
  |- notification
  |- i18n
        |
        v
Infrastructure
  |- Master DB
  |- Tenant DB Pool
  |- Redis
```

### 设计原则

- `Master DB` 保存平台级配置、租户主数据与公共元数据；
- `Tenant DB Pool` 保存租户侧业务数据，支持隔离与扩展；
- 登录成功后按租户上下文动态初始化用户、权限、菜单；
- 权限、菜单、页面挂载通过统一配置链路动态生效；
- 新业务模块尽量通过“菜单 + 路由 + 权限码 + 前端视图”方式接入，而不是改动平台主骨架。

## 模块边界

| 模块 | 作用 |
| :--- | :--- |
| `auth/` | 登录、退出、2FA、令牌、会话、账户安全 |
| `tenant/` | 租户注册、初始化、部署模式、数据库接入、租户生命周期 |
| `system/` | 用户、组织、角色、权限、菜单、日志、设置、监控、个人中心 |
| `i18n/` | 多语言资源与翻译加载 |
| `notification/` | 站内信、邮件、短信等通知能力 |
| 业务扩展模块 | 如主机管理、CMDB、作业平台、流程引擎等 |

## 文档导航

### 平台级设计

- `docs/DOCS_INDEX.md`
- `docs/system/SYSTEM_MANAGEMENT.md`
- `docs/auth/AUTH_SECURITY.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/tenant/TENANT_INITIALIZATION.md`
- `docs/governance/SYSTEM_CHECKLIST.md`
- `docs/deploy/DEPLOYMENT.md`

### 后端实现

- `backend/BACKEND_GUIDE.md`
- `backend/docs/BACKEND_DOCS_INDEX.md`
- `backend/docs/system/SYSTEM_BACKEND.md`
- `backend/docs/auth/AUTH_BACKEND.md`
- `backend/docs/tenant/TENANT_BACKEND.md`
- `backend/cmd/tools/README.md`
- `backend/api/swagger/`

### 前端实现

- `frontend/FRONTEND_GUIDE.md`
- `frontend/docs/FRONTEND_DOCS_INDEX.md`
- `frontend/docs/system/SYSTEM_FRONTEND.md`
- `frontend/docs/auth/AUTH_FRONTEND.md`
- `frontend/docs/tenant/TENANT_FRONTEND.md`

## 推荐阅读顺序

1. 先读 `README.md` 了解平台总体边界；
2. 再读 `docs/system/SYSTEM_MANAGEMENT.md` 理解系统管理业务模型；
3. 再读 `docs/auth/AUTH_SECURITY.md` 与 `docs/auth/AUTH_SESSION_STRATEGY.md`；
4. 再读 `docs/tenant/TENANT_INITIALIZATION.md` 理解租户初始化与部署模式；
5. 部署与验收时再读 `docs/deploy/DEPLOYMENT.md` 与 `docs/governance/SYSTEM_CHECKLIST.md`；
6. 最后按实现视角进入 `backend/docs/` 与 `frontend/docs/`。

## 快速开始

后端启动、配置、数据库与 Swagger 说明见：

- `backend/BACKEND_GUIDE.md`
- `backend/api/swagger/`

前端启动、构建与开发说明见：

- `frontend/FRONTEND_GUIDE.md`

## 扩展路径

平台后续扩展业务模块时，建议遵循统一接入方式：

1. 定义后端领域模块与接口；
2. 增加权限码与角色授权点；
3. 配置菜单与前端路由；
4. 在前端视图注册组件；
5. 通过租户上下文完成隔离与初始化。

这样在“主机管理”等新模块完成后，可以通过菜单挂载、路由注册和权限绑定动态接入现有平台。
