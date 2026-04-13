# 前端代码规范

> 本文定义 `frontend/` 的实现规范。  
> 它回答“前端代码应该如何组织、哪些边界不能破、哪些链路必须一起考虑”。  
> 命名基线见 `FRONTEND_NAMING_CONVENTIONS.md`，UI 基线见 `../../docs/system/UI_DESIGN.md` 与 `system/UI_IMPLEMENTATION_GUIDE.md`。

## 1. 作用范围

适用于：

- `frontend/src/modules/`
- `frontend/src/stores/`
- `frontend/src/shared/`
- `frontend/src/components/`
- `frontend/src/i18n/`

## 2. 总原则

- 先沿现有架构扩展，不重造体系；
- 优先模块内聚，避免过早上提到 `shared/`；
- 让路由、权限、菜单、工作台状态保持一致；
- 文案、编码、主题、测试都属于交付的一部分。

## 3. 目录与落点

- 页面：`modules/<name>/views/`
- 模块 API：`modules/<name>/api/`
- 模块组件：`modules/<name>/components/`
- 模块类型：`modules/<name>/types/`
- 全局状态：`stores/`
- 真正跨模块复用：`shared/`
- 壳层与布局：`components/`

## 4. 运行时边界

### 4.1 路由

- 顶层导航以 `React Router` 为准；
- 不绕过 Router 直接操作 DOM 历史；
- 路由、菜单、标签页必须协同设计。

### 4.2 全局状态

当前全局状态以以下入口为主：

- `authStore`
- `systemStore`
- `uiStore`
- `languageStore`
- `themeStore`

禁止：

- 新造第二套全局状态；
- 在页面组件里偷偷维护全局事实。

### 4.3 权限与菜单

涉及权限、菜单、标签页、动态视图时，必须同时检查：

- `authStore`
- `systemStore`
- `uiStore`
- `useViewManager`
- 相关菜单配置与视图注册

## 5. API 与数据获取

- 页面不要散落写裸请求；
- 模块请求统一收敛到 API 层；
- 复用现有 `api_client` / `axios_client` / Query 封装；
- 401、刷新、会话恢复走统一链路；
- 不在页面里私自拼接权限头、租户头。

## 6. 组件与 UI

- 优先复用现有 UI 基座组件；
- 不新增第二套样式体系；
- 新页面优先使用统一管理页骨架；
- 视觉语义遵守 token，不写散落色值；
- 高风险动作必须有明确确认与反馈。

## 7. 文案与国际化

- 不硬编码用户可见文案；
- 优先接入 `i18n`；
- 中文、英文、数字混排要考虑溢出和截断；
- 修改文案后至少抽查编码与显示。

## 8. 代码组织

- 组件保持单一职责；
- 页面负责承接流程，不堆业务规则；
- 复杂交互优先下沉到 hook 或模块组件；
- 通用能力再进入 `shared/`；
- 文件命名遵守 `snake_case` 基线。

## 9. 测试要求

前端改动至少执行与范围相称的验证：

- `npm run type-check`
- `npm run lint`
- `npm run test`
- `npm run build`

涉及主旅程或工作台运行时时，补：

- Playwright 冒烟或功能 E2E

涉及 store / hook / util 规则时，优先补：

- Vitest 白盒测试

## 10. 禁止事项

- 直接绕过权限判断入口；
- 在页面里长期堆积模块业务逻辑；
- 硬编码主题、语言、租户或权限假设；
- 为了赶进度复制整套现有页面再魔改；
- 忽略中文乱码、构建警告或控制台明显报错。

## 11. 提交前自查

- 是否影响登录态、初始化、菜单、权限、标签页；
- 是否有 i18n 和编码问题；
- 是否复用正确的 API / Store / UI 基座；
- 是否补充了最小必要测试；
- 是否需要同步文档。
