# Pantheon Platform

> 面向企业内部系统与 SaaS 产品的多租户后台管理平台底座。

[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![React Version](https://img.shields.io/badge/React-19+-cyan.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 项目简介

Pantheon Platform 不是单纯的“管理后台页面集合”，而是一套可持续扩展的后台平台底座，目标是同时支持：

- 私有化单租户交付
- PaaS 平台化底座建设
- SaaS 多租户产品化运营
- 后续业务模块按统一规范接入与扩展

当前平台围绕三条主线建设：

- `auth`：登录、退出、会话安全、2FA、API Key
- `tenant`：租户开通、初始化、部署模式、生命周期
- `system`：租户内系统管理核心能力

## 核心能力

### 平台底座

- 多租户与可配置部署模式
- 多语言支持
- `JWT + Refresh Token` 会话体系
- 可配置二次认证：`2FA / TOTP / 备份码`
- 权限动态初始化与会话刷新策略
- 动态菜单、动态页面挂载、动态权限生效

### 系统管理模块

- 用户管理
- 部门管理
- 岗位管理
- 角色管理
- 权限管理
- 菜单管理
- 日志管理
- 系统设置
- 系统监控
- 个人中心

## 技术栈

### 后端

- `Go 1.23`
- `Gin`
- `GORM`
- `Casbin`
- `Redis`
- `Swagger`

### 前端

- `React 19`
- `TypeScript`
- `Vite`
- `Zustand`
- `Tailwind CSS`
- `shadcn/ui`
- `i18next`
- `Vitest`
- `Playwright`

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

关键设计原则：

- `Master DB` 保存平台级配置、租户主数据与公共元数据
- `Tenant DB` 保存租户侧业务数据，保证隔离与扩展
- 登录成功后按租户上下文动态初始化用户、权限、菜单
- 新业务模块优先按“菜单 + 权限码 + 前端视图注册”方式接入

## 目录结构

```text
pantheon-platform/
├── backend/                # 后端服务、配置、脚本、Swagger、后端文档
├── frontend/               # 前端应用、状态管理、前端文档
├── docs/                   # 平台级设计文档
├── .github/workflows/      # CI 配置
├── docker-compose.yml      # 本地 / 演示部署入口
├── scripts/                # 本地开发辅助脚本
├── AGENTS.md               # Codex CLI 项目规则
└── README.md               # 项目入口文档
```

## 快速开始

### 方式一：本地开发

#### 1. 环境准备

- Go `1.23+`
- Node.js `18+`
- MySQL `8+`
- Redis `7+`

#### 2. 启动后端

```bash
cd backend
cp config.yaml.example config.yaml
make run
```

常用命令：

```bash
make test
make lint
make migrate-only
make swagger
```

#### 3. 启动前端

```bash
cd frontend
npm ci
npm run dev
```

常用命令：

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

#### 4. Windows 一键联调

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev-windows.ps1
```

停止：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-dev-windows.ps1
```

### 方式二：Docker Compose

适合本地联调、演示和快速验证：

```bash
docker compose up -d
```

如果是首次初始化场景，建议先执行迁移或使用迁移模式完成默认数据引导。

## 文档导航

### 平台级设计

- `docs/DOCS_INDEX.md`
- `docs/system/SYSTEM_MANAGEMENT.md`
- `docs/auth/AUTH_SECURITY.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/tenant/TENANT_INITIALIZATION.md`
- `docs/governance/GIT_COMMIT_GUIDE.md`
- `docs/governance/GITHUB_REPOSITORY_GUIDE.md`
- `docs/governance/SYSTEM_CHECKLIST.md`
- `docs/deploy/DEPLOYMENT.md`

### 后端实现

- `backend/README.md`
- `backend/BACKEND_GUIDE.md`
- `backend/docs/BACKEND_DOCS_INDEX.md`
- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
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

1. `README.md`
2. `docs/DOCS_INDEX.md`
3. `docs/system/SYSTEM_MANAGEMENT.md`
4. `docs/auth/AUTH_SECURITY.md`
5. `docs/auth/AUTH_SESSION_STRATEGY.md`
6. `docs/tenant/TENANT_INITIALIZATION.md`
7. `backend/README.md`、`backend/BACKEND_GUIDE.md`
8. `frontend/FRONTEND_GUIDE.md`
9. `docs/deploy/DEPLOYMENT.md`

## 扩展方式

新增业务模块时，建议按以下顺序接入：

1. 定义后端领域模块与接口
2. 增加权限码与角色授权点
3. 配置菜单与前端视图映射
4. 接入租户上下文与初始化链路
5. 补充测试、文档和部署说明

这样可以在不破坏平台主骨架的前提下，把新模块动态接入现有系统。
