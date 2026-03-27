# Frontend AGENTS

> 本文件补充 `../AGENTS.md`，只约束 `frontend/` 目录下的默认行为。

## 1. 先看什么

- 先读 `FRONTEND_GUIDE.md`
- 再看 `docs/FRONTEND_DOCS_INDEX.md`
- 涉及业务专题时，再进入：
  - `docs/auth/`
  - `docs/system/`
  - `docs/tenant/`

## 2. 目录职责

- `src/modules/`：业务模块
- `src/stores/`：全局状态
- `src/shared/`：共享组件、工具、错误处理、安全能力
- `src/components/`：应用壳层组件
- `src/i18n/`：语言资源与初始化

## 3. 前端架构事实

- 这是工作台式后台，不是纯 URL 驱动页面站点
- 核心交互依赖：
  - 菜单配置
  - 标签页状态
  - 动态视图挂载
- 关键状态源通常包括：
  - `authStore`
  - `systemStore`
  - `uiStore`
  - `ViewManager`

## 4. 默认落点规则

- 新页面放 `modules/<name>/views/`
- 模块接口放 `modules/<name>/api/`
- 模块子组件放 `modules/<name>/components/`
- 模块类型放 `modules/<name>/types/`
- 真正跨模块复用的能力才进入 `shared/` 或 `stores/`

## 5. 明确禁止

- 不要把动态视图体系改回纯静态路由思维
- 不要新造第二套全局状态或权限判断入口
- 不要在页面里直接散落裸 HTTP 调用
- 不要把模块私有逻辑过早塞进 `shared/`
- 不要硬编码文案，优先走 i18n
- 不要引入新的样式体系来绕过现有 Tailwind + 组件体系

## 6. 重点事项

### 登录与会话

- 改登录、刷新、退出、2FA 时，先读 `../docs/auth/`
- 不要只修页面表现，要一起考虑拦截器、状态重建、系统初始化

### 菜单与权限

- 涉及菜单、权限、标签页时，必须同时检查：
  - `authStore`
  - `systemStore`
  - `uiStore`
  - `ViewManager`

### 新模块接入

- 优先按“权限码 + 菜单 + 视图注册”方式接入
- 尽量不改主壳层结构

## 7. 验证基线

- 至少做与改动相称的验证
- 常用命令：
  - `npm run type-check`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

## 8. 提交前

- 说明影响页面或模块
- 说明是否影响菜单、权限、登录态、初始化
- 说明实际跑过的验证
