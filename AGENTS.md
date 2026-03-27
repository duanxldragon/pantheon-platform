# Pantheon Platform 协作说明

> 写给刚接手项目的新同事，也写给进入仓库执行任务的 Codex。  
> 这份文件只讲项目背景、架构边界、目录规划、流程约束与安全注意事项；代码格式交给 `ESLint`、`Prettier`、`gofmt` 和现有测试。

## 1. 先建立全局认知

- 这是一个**面向企业内部系统与 SaaS 产品的多租户后台平台底座**，不是单纯页面集合。
- 当前核心主线只有三条：`auth`、`tenant`、`system`；`notification`、`i18n`、`storage` 等属于配套能力。
- 平台的关键目标是：**同一套底座同时支持单租户交付、平台化底座和 SaaS 多租户运营**。
- 做改动前先判断：你碰到的是**平台级设计问题**、**后端实现问题**，还是**前端挂载/交互问题**。

## 2. 你需要记住的架构事实

- 后端是 `Go 1.23 + Gin + GORM + Casbin + Redis + Swagger`。
- 前端是 `React 19 + TypeScript + Vite + Zustand + Tailwind CSS + shadcn/ui + i18next`。
- 数据分层非常关键：
  - `Master DB`：平台级配置、租户主数据、公共元数据。
  - `Tenant DB`：租户内业务数据。
  - `Redis`：会话、刷新、撤销、授权版本、锁和临时状态。
- 前端不是传统“纯 URL 路由后台”，而是**菜单 + 标签页 + 动态视图挂载**模型；不要轻易把它改回静态路由驱动。
- 新模块优先走“**权限码 + 菜单 + 前端视图注册 + 租户隔离**”接入，不要随意改平台主骨架。

## 3. 仓库怎么读

### 根目录

- `README.md`：项目总入口。
- `docs/`：平台级设计，不讲具体代码落点。
- `backend/`：后端实现、配置、工具、Swagger 产物。
- `frontend/`：前端实现、页面壳层、状态流转与测试。

### 文档分工

- `docs/`：回答“平台怎么设计、模块怎么协作”。
- `backend/BACKEND_GUIDE.md`：回答“后端怎么组织、怎么启动、链路怎么走”。
- `frontend/FRONTEND_GUIDE.md`：回答“前端怎么初始化、怎么挂载、状态怎么流转”。
- `backend/docs/`、`frontend/docs/`：专题实现细节。
- `backend/api/swagger/`：生成产物，不是人工主文档。

### 推荐阅读顺序

1. `README.md`
2. `docs/DOCS_INDEX.md`
3. `docs/system/SYSTEM_MANAGEMENT.md`
4. `docs/auth/AUTH_SECURITY.md`
5. `docs/auth/AUTH_SESSION_STRATEGY.md`
6. `docs/tenant/TENANT_INITIALIZATION.md`
7. 再按需要进入 `backend/` 或 `frontend/` 总览与专题文档

## 4. 目录规划与落点规则

### 后端

- 主要代码在 `backend/internal/`：
  - `app/`：启动、装配、依赖注入。
  - `modules/`：业务模块，当前以 `auth`、`tenant`、`system`、`notification` 为主。
  - `shared/`：跨模块公共能力，如 `authorization`、`database`、`middleware`、`response`、`storage`。
- 服务入口在 `backend/cmd/server/main.go`，保持薄；不要把业务逻辑堆到入口里。
- 后端分层按现有约定走：`handler` / `service` / `dao` / `model` / `router` / `dto`。
- 一次性工具放 `backend/cmd/tools/`，不要混进正式服务入口。

### 前端

- 主要代码在 `frontend/src/`：
  - `modules/`：业务模块代码。
  - `stores/`：全局状态，如 `authStore`、`systemStore`、`uiStore`。
  - `shared/`：共享组件、工具、错误处理、安全能力。
  - `components/`：应用壳层组件。
- 新页面优先进入 `frontend/src/modules/<module>/views/`。
- 模块内接口放 `api/`，子组件放 `components/`，类型放 `types/`。
- 全局能力才进入 `stores/` 或 `shared/`；不要把模块私有逻辑提前“共享化”。

## 5. 开发时默认遵守这些约束

- 优先做**小而准**的修改，先修根因，再谈补丁。
- 不要手工修改明显的生成产物，除非你同时处理生成链路。
- 不要引入第二套权限体系、第二套路由体系、第二套主题体系。
- 后端改动若涉及租户级数据，记得检查是否要注册**租户迁移器**。
- 前端改动若涉及菜单/权限/标签页，先理解 `authStore`、`systemStore`、`uiStore` 和 `ViewManager` 的协作关系。
- 改架构、目录、初始化链路时，要同步更新对应文档；过时文档比没有文档更糟。

## 6. Git 协作规则

这部分是给 Codex 和新同事的明确 Git 约束，默认遵守。

### 分支规则

- 默认主分支使用 `main`。
- 功能、修复、文档改动都走主题分支，不直接在长期分支上堆杂项提交。
- 分支命名建议：`<type>/<scope>-<topic>`，例如：
  - `feat/auth-session-revoke`
  - `fix/system-menu-refresh`
  - `docs/agent-rules`

### 提交规则

- 推荐格式：`type(scope): summary`
- 常用 `type`：
  - `feat`：新功能
  - `fix`：缺陷修复
  - `refactor`：重构
  - `docs`：文档
  - `test`：测试
  - `chore`：构建、脚本、依赖
- `scope` 用模块名或目录语义：`auth`、`tenant`、`system`、`backend`、`frontend`、`docs`
- 示例：
  - `feat(auth): add session revoke endpoint`
  - `fix(system): refresh menu permissions after role update`
  - `docs(agent): add codex git workflow`

### 提交内容约束

- 一次提交只做一件主题明确的事。
- 涉及配置、迁移、文档时，尽量和代码一起提交。
- 不要把 `node_modules`、构建产物、真实密钥、脱敏前日志带进提交。
- 非必要不要提交 `frontend/build/`、覆盖率产物、临时脚本输出。
- 推送前至少做最小自检，保证提交不是明显损坏状态。

### 推送规则

- 默认推送到项目正式远端，不随意改 `origin` 指向。
- 不强推，不改写共享历史，除非仓库维护者明确要求。
- 推送前先看清本次变更只包含目标内容。
- 如果只是更新文档或规则，也照样提交并推送，保持仓库状态可追踪。

## 7. 安全注意事项

- **不要硬编码密钥、密码、DSN、Token、API Key。**
- `JWT secret`、租户数据库加密 key、数据库密码、Redis 密码都应该走配置或环境变量。
- `backend/config.yaml.example` 里的默认管理员、默认密钥只是示例，不能照搬到生产环境。
- 多租户隔离必须以后端租户上下文和租户库连接为准，不能只依赖前端传参。
- 改认证逻辑时，不要破坏现有 `JWT + Refresh Token + Redis 会话态 + revoked/version` 协作机制。
- 改 2FA、备份码、登录锁定、会话踢出等逻辑时，先读 `docs/auth/` 相关文档。
- 日志、截图、调试输出里避免泄露手机号、邮箱、身份证明、数据库连接串和访问令牌。
- `backend/cmd/tools/` 主要用于开发、演示、排障，不要直接当生产运维脚本使用。
- Windows PowerShell 下不要写 `> nul`，会在仓库里制造异常文件；用 `> $null` 或 `Out-Null`。

## 8. 本地开发与验证

### 后端

- 配置入口：`backend/config.yaml`，可从 `backend/config.yaml.example` 复制。
- 常用命令：
  - `make run`
  - `make migrate-only`
  - `make test`
  - `make lint`
  - `make swagger`

### 前端

- 本地开发：
  - `cd frontend`
  - `npm ci`
  - `npm run dev`
- 提交前至少检查：
  - `npm run type-check`
  - `npm run lint`
- 页面或构建链路改动较大时，再补：
  - `npm run test`
  - `npm run build`

### CI 基线

- 后端 CI 会跑测试、lint、build。
- 前端 CI 会跑 `lint`、`type-check`、`format:check`、测试和构建。
- 本地改动尽量不要低于 CI 的最低验证标准。

## 9. 部署步骤的最小认知

- 本项目提供 `docker-compose.yml`，默认包含 `mysql`、`redis`、`backend`、`frontend`，以及可选监控组件。
- 初始化或首发场景优先记住 `migrate-only`：先迁移和引导默认数据，再决定是否启动服务。
- 前端依赖 `VITE_API_BASE_URL`；后端依赖数据库、Redis、JWT、多租户相关配置。
- 部署前至少确认：
  - 数据库和 Redis 可达；
  - JWT 密钥、租户加密 key 已替换默认值；
  - 默认管理员密码已改；
  - CORS、域名、反向代理配置与环境一致。
- 更完整的部署说明以 `docs/deploy/DEPLOYMENT.md` 和实际部署脚本为准；如果部署方式变化，记得同步更新文档。

## 10. 文档维护原则

- 保持简洁，优先写**边界、链路、入口、约束**，不要堆大段实现细节。
- 一份文档只回答一类问题，避免在多个地方重复同一套规则。
- 格式和样式规则交给工具链，这里只保留项目背景、架构和流程约束。
- 文档体积控制在易读范围内；如果一节变长，拆去专题文档。

## 11. 给 Codex 的最后提醒

- 动手前先定位改动属于 `docs/`、`backend/` 还是 `frontend/`。
- 优先复用现有模块、Store、共享能力和工具脚本，不要平地再造一套。
- 不确定业务规则时，先查文档再改代码。
- 回答或提交结果时，要说明：改了什么、为什么这样改、跑了哪些验证、还有什么风险。
