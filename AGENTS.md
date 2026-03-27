# Pantheon Platform AGENTS

> 这份文件用于约束 Codex CLI 在本仓库中的默认行为。  
> 目标不是解释所有实现细节，而是让代理先理解项目，再动手修改。

## 0. 规则作用域

本仓库使用分层 `AGENTS.md` 规则。进入对应目录工作时，除了本文件，还要继续遵守该目录下更具体的规则：

- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `docs/AGENTS.md`
- `backend/docs/AGENTS.md`
- `frontend/docs/AGENTS.md`

原则：

- 根目录 `AGENTS.md` 负责全局行为约束
- 子目录 `AGENTS.md` 负责该目录下更具体的实现约束
- 如果规则冲突，优先遵守离当前工作目录更近的 `AGENTS.md`

## 1. 总原则

- 先理解，再修改；先查文档，再查代码。
- 优先做小范围、可解释、可验证的改动。
- 修根因，不做表面补丁；不顺手修无关问题。
- 保持现有架构，不随意引入第二套机制。

## 2. 进入仓库后的默认动作

收到任务后，先判断问题属于哪一层：

- 平台设计：先看 `docs/`
- 后端实现：先看 `backend/BACKEND_GUIDE.md`
- 前端实现：先看 `frontend/FRONTEND_GUIDE.md`

默认阅读顺序：

1. `README.md`
2. `docs/DOCS_INDEX.md`
3. `docs/system/SYSTEM_MANAGEMENT.md`
4. `docs/auth/AUTH_SECURITY.md`
5. `docs/auth/AUTH_SESSION_STRATEGY.md`
6. `docs/tenant/TENANT_INITIALIZATION.md`

如果任务已经明确限定在 `backend/` 或 `frontend/`，再进入对应总览和专题文档。

## 3. 项目事实

- 这是一个多租户后台平台底座，不是普通单体后台页面工程。
- 核心主线模块只有：`auth`、`tenant`、`system`。
- 后端技术栈：`Go 1.23`、`Gin`、`GORM`、`Casbin`、`Redis`。
- 前端技术栈：`React 19`、`TypeScript`、`Vite`、`Zustand`、`Tailwind CSS`、`shadcn/ui`、`i18next`。
- 数据分层必须牢记：
  - `Master DB`：平台级与租户主数据
  - `Tenant DB`：租户业务数据
  - `Redis`：会话、刷新、撤销、授权版本、锁、临时态
- 前端是“菜单 + 标签页 + 动态视图”模型，不是纯静态路由后台。

## 4. 目录落点规则

### 后端

- 业务代码放 `backend/internal/modules/`
- 共享基础设施放 `backend/internal/shared/`
- 启动与装配放 `backend/internal/app/`
- 服务入口保持在 `backend/cmd/server/main.go`
- 开发工具放 `backend/cmd/tools/`

后端默认分层：

- `handler`：参数、权限入口、响应
- `service`：业务规则、事务、模块协作
- `dao`：数据库读写
- `model`：持久化模型
- `dto`：请求响应模型
- `router`：路由注册

### 前端

- 业务代码放 `frontend/src/modules/`
- 全局状态放 `frontend/src/stores/`
- 共享能力放 `frontend/src/shared/`
- 壳层组件放 `frontend/src/components/`

前端新增模块时，优先使用：

- `modules/<name>/api/`
- `modules/<name>/components/`
- `modules/<name>/views/`
- `modules/<name>/types/`

## 5. 明确禁止

- 不要绕开租户隔离，不能只依赖前端传参判断租户。
- 不要新造第二套权限体系、路由体系、主题体系、状态体系。
- 不要把业务逻辑堆到后端入口文件或前端壳层里。
- 不要手工改明显的生成产物，除非同时处理生成链路。
- 不要把 `node_modules`、构建产物、覆盖率产物、临时文件提交进仓库。
- 不要硬编码密码、密钥、DSN、Token、API Key。

## 6. 重点注意事项

### 认证与安全

- 改认证前先看 `docs/auth/`
- 不要破坏 `JWT + Refresh Token + Redis 会话态 + revoked/version` 协作链路
- 改 2FA、备份码、登录锁定、会话踢出时，要同时考虑前后端联动

### 多租户

- 涉及租户数据的后端改动，要检查是否需要租户迁移器
- 涉及租户初始化的改动，要同时检查 `tenant` 文档、初始化流程和数据库连接管理

### 前端挂载

- 涉及菜单、权限、标签页时，先理解 `authStore`、`systemStore`、`uiStore`、`ViewManager`
- 新页面优先按“权限码 + 菜单 + 视图注册”方式接入

## 7. Git 规则

### 分支

- 默认主分支是 `main`
- 功能、修复、文档改动走主题分支
- 分支命名建议：`<type>/<scope>-<topic>`

示例：

- `feat/auth-session-revoke`
- `fix/system-menu-refresh`
- `docs/agent-rules`

### 提交

- 提交信息格式：`type(scope): summary`
- 常用类型：
  - `feat`
  - `fix`
  - `refactor`
  - `docs`
  - `test`
  - `chore`

示例：

- `feat(auth): add session revoke endpoint`
- `fix(system): refresh menu permissions after role update`
- `docs(agent): tighten codex behavior rules`

提交约束：

- 一次提交只做一件主题明确的事
- 配置、迁移、文档变更尽量和代码一起提交
- 推送前保证工作区干净、变更范围清晰

### 远端

- 默认远端使用 `origin`
- 默认目标仓库：`https://github.com/duanxldragon/pantheon-platform.git`
- 非必要不要强推，不要改写共享历史

## 8. 开发与验证基线

### 后端

- 配置入口：`backend/config.yaml`
- 示例配置：`backend/config.yaml.example`
- 常用命令：
  - `make run`
  - `make migrate-only`
  - `make test`
  - `make lint`
  - `make swagger`

### 前端

- 常用命令：
  - `npm ci`
  - `npm run dev`
  - `npm run type-check`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

### 最低要求

- 改后端前，确认是否影响迁移、鉴权、租户上下文
- 改前端前，确认是否影响菜单、权限、初始化、视图挂载
- 提交前至少做与改动范围相称的最小验证

## 9. 文档维护规则

- 文档只写边界、链路、入口、约束
- 格式规则交给 `ESLint`、`Prettier`、`gofmt`
- 项目演进时同步更新文档
- 过时文档比没有文档更糟

## 10. 回答用户时

默认说明四件事：

- 改了什么
- 为什么这样改
- 做了哪些验证
- 还剩哪些风险或后续建议
