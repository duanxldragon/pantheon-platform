# Pantheon Platform - 前端实现总览

> 本文是前端工程实现总览，只讲项目结构、应用启动、状态流转、路由与工作台运行时、API 约定、样式规范和测试构建。  
> 认证、租户、系统管理的业务规则与交互边界，请分别进入专题文档阅读：
>
> - `docs/auth/AUTH_SECURITY.md`
> - `docs/auth/AUTH_SESSION_STRATEGY.md`
> - `docs/tenant/TENANT_INITIALIZATION.md`
> - `docs/system/SYSTEM_MANAGEMENT.md`
> - `frontend/DESIGN.md`
> - `frontend/docs/FRONTEND_DOCS_INDEX.md`
> - `frontend/docs/DYNAMIC_VIEW_RUNTIME.md`
> - `frontend/docs/system/SYSTEM_INITIALIZATION_LAYERS.md`
> - `frontend/docs/system/UI_IMPLEMENTATION_GUIDE.md`
> - `frontend/docs/system/UI_PAGE_TEMPLATES.md`
> - `frontend/docs/system/UI_DELIVERY_CHECKLIST.md`
> - `frontend/docs/system/UI_REFACTOR_PROGRESS.md`

## 1. 文档定位

`frontend/FRONTEND_GUIDE.md` 负责回答：

- 前端项目目录怎么组织；
- 应用是如何启动和初始化的；
- 为什么采用 React Router + 工作台壳层的混合导航模型；
- Zustand、认证状态、系统状态如何协作；
- API 请求、错误处理、国际化、主题如何统一；
- 新业务模块如何按平台规范接入。

本文**不再重复**以下内容：

- 系统管理业务对象关系；
- 认证安全与 2FA 规则；
- 租户初始化业务流程；
- 后端权限模型与租户数据库实现细节。

### 1.1 UI 文档导航

如果当前任务主要是前端 UI 设计、页面统一或交付说明，建议按下面顺序阅读：

1. 稳定设计描述：`frontend/DESIGN.md`
2. 前端文档中心：`frontend/docs/FRONTEND_DOCS_INDEX.md`
3. UI 实现规范：`frontend/docs/system/UI_IMPLEMENTATION_GUIDE.md`
4. 页面模板：`frontend/docs/system/UI_PAGE_TEMPLATES.md`
5. 交付对照清单：`frontend/docs/system/UI_DELIVERY_CHECKLIST.md`
6. 改造进度：`frontend/docs/system/UI_REFACTOR_PROGRESS.md`
7. 阶段总结：`frontend/docs/system/UI_REFACTOR_SUMMARY.md`

---

## 2. 技术栈与前端定位

前端当前核心技术栈：

- `React 19`
- `TypeScript`
- `Vite`
- `Zustand`
- `Axios / Fetch 封装`
- `Tailwind CSS`
- `shadcn/ui`
- `i18next`
- `Vitest`
- `Playwright`

前端在平台中的职责可以概括为：

- 负责登录、初始化、导航与交互呈现；
- 根据后端返回的权限和菜单动态渲染界面；
- 在认证刷新后无感重建用户、权限、菜单和系统状态；
- 为后续业务模块提供统一的挂载方式。

---

## 3. 目录结构

### 3.1 顶层结构

```text
frontend/
├─ src/
├─ docs/
├─ package.json
├─ FRONTEND_GUIDE.md
└─ FRONTEND_GUIDE.en.md  # 英文版总览（可选维护）
```

### 3.2 `src/` 结构

```text
frontend/src/
├─ api/           # 通用 API 入口封装
├─ components/    # 布局级组件
├─ constants/     # 常量
├─ hooks/         # 通用 Hooks
├─ i18n/          # 语言资源与初始化
├─ modules/       # 业务模块
│  ├─ auth/
│  ├─ notification/
│  ├─ system/
│  └─ tenant/
├─ shared/        # 前端共享能力
├─ stores/        # 全局 Store
├─ styles/        # 样式资源
├─ types/         # 通用类型
├─ App.tsx        # 应用主入口
└─ main.tsx       # React 挂载入口
```

### 3.3 分层约定

建议按以下原则组织代码：

- `modules/`：模块内页面、API、类型、局部状态；
- `components/`：全局布局与壳层组件；
- `shared/`：跨模块共享的组件、工具、错误处理、安全能力；
- `stores/`：真正全局共享的状态；
- `i18n/`：语言包与国际化初始化。

---

## 4. 应用启动链路

### 4.1 入口文件

应用入口主要是：

- `frontend/src/main.tsx`
- `frontend/src/App.tsx`

`main.tsx` 只负责挂载 React；真正的 Provider 装配、运行时能力初始化和 Router 入口收敛在 `App.tsx`。

### 4.2 `App.tsx` 启动流程

当前 `App.tsx` 的职责更接近“前端运行时根节点”，关键链路如下：

1. 装配主题、语言、Query Client、错误边界等全局 Provider；
2. 启动认证恢复、系统初始化同步等全局 Hook；
3. 创建并挂载 `AppRouter`；
4. 由路由守卫统一处理未登录、租户未初始化、已登录三种主状态；
5. 进入主业务区后，再交给 `MainLayout` 管理工作台壳层。

更细的初始化与恢复分层，见 `frontend/docs/system/SYSTEM_INITIALIZATION_LAYERS.md`。

### 4.3 三种主界面分流

`App.tsx` 通过 React Router 分流到三类界面：

- **未登录**：路由到 `/login`，显示 `Login` 组件；
- **已登录但租户未初始化**：路由到 `/tenant-setup`，显示 `TenantSetupWizard` 组件；
- **已登录且租户就绪**：路由到主业务路由，显示正式业务壳层（`MainLayout`）和对应业务页面。

这也是平台前端初始化最关键的设计点之一。更多架构变更细节请参考 `docs/ARCHITECTURE_MIGRATION_2026.md`。

---

## 5. 布局与运行时体系

### 5.1 正式业务壳层

正式业务界面的基础壳层（`MainLayout`）由以下部分组成：

- `SidebarNew`：侧边导航；
- `TopBar`：顶部栏；
- `BreadcrumbNav`：面包屑；
- `TabManager`：多标签容器；
- `Outlet`：React Router 渲染子路由的位置；
- `Footer`：页脚。

### 5.2 为什么是混合模型

当前项目既不是纯静态路由后台，也不是完全脱离 URL 的动态视图容器，而是混合模型：

- Router 负责顶层页面切分与地址栏同步；
- 菜单仍然由后端配置驱动；
- 标签页仍然由 `uiStore` 管理；
- `viewsConfig` 继续承担“菜单/视图标识 -> 页面元数据”的稳定映射；
- 权限变化后仍然可以重建导航和标签页状态。

因此这里更像“带 URL 的桌面工作台式前端壳层”，而不是标准内容站模式。

### 5.3 工作台导航链路

一个菜单到页面的基本链路如下：

```text
后端菜单配置
  -> 前端菜单树
  -> SidebarNew
  -> useViewManager.navigateToView()
  -> 权限校验
  -> uiStore.addTab()
  -> 路由跳转
  -> TabManager
  -> MainLayout
  -> Outlet
  -> 实际页面组件
```

`MainLayout` 还会根据当前 `pathname` 反向同步激活标签，保证标签状态和 URL 状态一致。

更完整的运行时说明，见 `frontend/docs/DYNAMIC_VIEW_RUNTIME.md`。

---

## 6. 状态管理设计

### 6.1 全局 Store 分工

当前全局状态大致分为：

| Store | 作用 |
| :--- | :--- |
| `uiStore` | 标签页、激活页、界面壳层状态 |
| `systemStore` | 系统级缓存与初始化数据 |
| `languageStore` | 当前语言 |
| `themeStore` | 当前主题 |
| `authStore` | 认证状态、用户信息、租户初始化态 |

### 6.2 `authStore` 的角色

`authStore` 不只是 token 仓库，还承担：

- 登录与 2FA 登录完成；
- 当前用户刷新；
- 权限加载；
- 登录后租户状态检查；
- logout 清理；
- 权限判断能力输出。

这也是认证、租户、系统初始化三条链路在前端汇合的地方。

### 6.3 `systemStore` 的角色

`systemStore` 负责系统级数据初始化和缓存，通常在以下时机重建：

- 首次登录成功；
- refresh token 成功；
- 授权发生变更后重新初始化；
- logout 后清空。

当前 `initialize()` 更偏向“系统管理快照”而不是“最小壳层初始化”，详见 `frontend/docs/system/SYSTEM_INITIALIZATION_LAYERS.md`。

### 6.4 `uiStore` 的角色

`uiStore` 负责：

- 打开标签页；
- 切换标签页；
- 关闭标签页；
- 保存当前工作台式导航状态。

因此它仍然是“动态菜单 -> 多标签工作台”这一交互模型的核心状态源。

---

## 7. 认证、系统、租户的前端协作

### 7.1 登录成功后并不会直接进入页面

前端登录成功后至少还要继续完成：

- 刷新当前用户；
- 拉取权限；
- 初始化系统数据；
- 检查租户是否已完成初始化；
- 构建菜单与标签页可用状态。

### 7.2 refresh 成功后的重建链路

全局拦截器在 refresh 成功后会继续执行：

- 更新 token；
- `authStore.refreshTenantContext()`；
- 在该入口内部再串联 `reloadAuthorization()`、`checkTenantStatus()`、`systemStore.initialize()`。

所以“权限变更后无感更新”不只是后端问题，前端也已经有明确承接链路。

### 7.3 专题文档入口

具体实现细节建议分别看：

- `frontend/docs/auth/AUTH_FRONTEND.md`
- `frontend/docs/system/SYSTEM_FRONTEND.md`
- `frontend/docs/system/SYSTEM_INITIALIZATION_LAYERS.md`
- `frontend/docs/DYNAMIC_VIEW_RUNTIME.md`
- `frontend/docs/tenant/TENANT_FRONTEND.md`

---

## 8. API 集成规范

### 8.1 API 封装原则

建议遵循：

- 不在组件里直接裸调 HTTP；
- 每个模块自己的接口放在 `modules/<name>/api/`；
- 通用客户端和拦截器放在 `shared/utils/`；
- 统一处理 token 注入、refresh、错误提示。

### 8.2 当前 API 基础设施

关键文件包括：

- `frontend/src/shared/utils/api_client.ts`
- `frontend/src/modules/auth/api/auth_api.ts`
- `frontend/src/modules/tenant/api/tenant_database_api.ts`

### 8.3 错误处理原则

建议：

- 后端返回稳定错误码或 i18n key；
- 前端统一翻译并 toast；
- 认证失效类错误统一回到登录态；
- 不要在每个页面重复写同样的认证失败处理逻辑。

---

## 9. 国际化与主题

### 9.1 国际化

国际化相关入口：

- `frontend/src/i18n/`
- `frontend/src/stores/language_store.ts`

约束建议：

- 页面文案统一进入语言资源；
- 后端错误消息优先使用 i18n key；
- 新模块接入时，先补语言资源再补页面文案。

### 9.2 主题

主题状态入口：

- `frontend/src/stores/theme_store.ts`

当前前端已支持主题配置与应用壳层联动，后续业务页面应尽量复用现有主题变量与组件风格，不要在模块内重新造一套主题体系。

---

## 10. 组件与样式规范

### 10.1 组件层级

建议保持：

- 壳层组件放 `components/`；
- 业务页面放 `modules/<name>/views/`；
- 业务子组件放 `modules/<name>/components/`；
- 共享组件放 `shared/components/` 或 `components/ui/`。

### 10.2 样式约束

当前前端以 `Tailwind CSS` + `shadcn/ui` 为主，建议：

- 优先使用现有 UI 组件；
- 优先使用 Tailwind 原子类；
- 避免重复造基础表单和弹窗；
- 除非确有必要，不要引入新的样式体系。

### 10.3 命名建议

- 文件名：优先使用 `snake_case`，与后端职责命名保持一致
- 组件名：`PascalCase`
- Hook：`useXxx`
- Store Hook：`useXxxStore`
- API 方法：`fetchXxx` / `createXxx` / `updateXxx` / `deleteXxx`
- 布尔变量：`isXxx` / `hasXxx` / `canXxx`
- 详细规则见 `frontend/docs/FRONTEND_NAMING_CONVENTIONS.md`

---

## 11. 新业务模块接入方式

新增模块时，建议按以下顺序实现：

1. 在 `src/modules/` 下新建模块目录；
2. 划分 `api/`、`components/`、`views/`、`types/`；
3. 补前端页面组件；
4. 在路由树和视图注册表中接入页面；
5. 接入菜单配置与权限判断；
6. 补语言资源、错误提示、必要测试；
7. 在专题文档中记录模块实现方式。

### 11.1 为什么这样设计

因为平台希望新增业务模块时：

- 不改主框架；
- 不改固定静态导航；
- 通过菜单 + 权限 + 路由/视图注册即可挂载；
- 与租户隔离和系统初始化天然兼容。

这也是你后续扩展“主机管理”等模块时最重要的前端接入原则。

---

## 12. 测试与质量保障

### 12.1 当前脚本

`package.json` 中当前常用脚本包括：

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run lint:fix
npm run type-check
npm run test
npm run test:coverage
npm run test:e2e
npm run format
npm run format:check
```

### 12.2 建议实践

- 改状态管理逻辑时优先补单测；
- 改核心登录流、租户初始化流时优先补集成或 E2E；
- 提交前至少跑 `type-check` 和 `lint`；
- 大范围页面调整后再跑 `build`。

---

## 13. 开发与构建

### 13.1 开发启动

```bash
cd frontend
npm install
npm run dev
```

如果开发环境是受限的 Windows 主机，并且浏览器报错：

- `The requested module '/node_modules/react-dom/client.js?...' does not provide an export named 'createRoot'`
- 或终端里出现 `esbuild spawn EPERM`

优先按下面顺序判断：

1. 这通常不是 `react-dom` 版本本身损坏，而是 **Vite 开发态依赖预构建** 没有成功；
2. 当前仓库已经切回 **标准 `Vite + esbuild` 链路**，不再保留仓库内兼容层；
3. 如果此前起过旧的 dev server，先删除 `node_modules/.vite` 缓存后再重启：

```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

在 Windows PowerShell 下可使用：

```powershell
cd frontend
if (Test-Path node_modules/.vite) { Remove-Item node_modules/.vite -Recurse -Force }
npm run dev
```

### 13.2 Windows 受限环境说明

标准链路下，如果你的 Windows 主机仍然被安全策略拦截：

- 某些 Windows 安全策略会拦截 Node 拉起 `esbuild` 子进程；
- Vite dev server 在预构建或处理 React 相关入口时依赖该子进程；
- 一旦预构建失败，浏览器就可能直接请求原始 CommonJS 入口，进而出现 `createRoot` 命名导出缺失。

这类问题需要在**主机环境**里解决，而不是继续在仓库里叠加兼容层。推荐优先：

- 放开 Node / `esbuild.exe` 的执行权限；
- 清理 `node_modules/.vite` 后重新执行 `npm run dev`；
- 统一团队 Node、npm 与安全策略；
- 或迁移到 WSL2、容器、Linux 开发环境。

### 13.3 生产构建

```bash
cd frontend
npm run type-check
npm run lint
npm run build
```

### 13.4 长期方案

当前仓库已经采用长期方案：**恢复标准 `Vite + esbuild` 配置，并把环境问题留在环境层解决**。

推荐团队基线：

1. 固定 Node 版本；
2. 固定 npm 与锁文件；
3. 对 Windows 安全软件、终端策略、企业管控策略做白名单；
4. 对确实无法放开的机器，改用 WSL2、容器或 Linux 开发环境。

### 13.5 部署边界

前端部署说明尽量只保留：

- 如何构建；
- 如何反代后端；
- 如何注入 API 地址。

更完整的部署级说明建议统一沉淀到：

- `docs/deploy/DEPLOYMENT.md`

---

## 14. 推荐阅读顺序

1. 先读 `README.md`
2. 再读 `docs/DOCS_INDEX.md`
3. 再读 `frontend/DESIGN.md`
4. 再读 `frontend/docs/FRONTEND_DOCS_INDEX.md`
5. 再按专题进入：
   - `frontend/docs/system/SYSTEM_FRONTEND.md`
   - `frontend/docs/auth/AUTH_FRONTEND.md`
   - `frontend/docs/tenant/TENANT_FRONTEND.md`

---

## 15. 当前文档的边界总结

后续如果继续补前端文档，建议保持以下分工：

- `README.md`：平台入口
- `docs/`：平台级业务设计
- `frontend/FRONTEND_GUIDE.md`：前端工程实现总览
- `frontend/DESIGN.md`：稳定视觉描述与 AI 生成约束
- `frontend/docs/*`：前端专题实现细节
- 模块内注释与 README：只补局部实现说明，不重复平台规则
