# 前端命名规范

> 本规范用于把前端文件命名收敛到与后端一致的“语义 + 职责”风格，避免继续混用 `PascalCase`、`camelCase`、`kebab-case`。

## 目标

- 文件名优先使用 `snake_case`
- 文件名体现职责，而不是只体现组件名
- 导出符号继续保留前端习惯：
  - 组件：`PascalCase`
  - Hook：`useXxx`
  - Store：`useXxxStore`
  - API 对象：`xxxApi`

## 基本规则

### 1. 通用文件命名

- 新增前端源码文件默认使用 `snake_case`
- 一个文件名由“领域 + 职责”组成，例如：
  - `auth_api.ts`
  - `auth_store.ts`
  - `tenant_database_api.ts`
  - `role_management_copy.ts`
  - `use_tenant_setup_wizard.ts`

### 2. `index` 约定

- 只有目录入口或 barrel file 使用 `index.ts` / `index.tsx`
- 不要把普通实现文件命名成无语义的 `utils2.ts`、`temp.ts`

### 3. 组件文件

- 组件导出名保持 `PascalCase`
- 组件文件名仍使用 `snake_case`，但当前仓库允许渐进迁移
- 历史目录中的 `index.tsx` 继续作为页面或组件入口

示例：

- 文件：`tenant_dialog_manager.tsx`
- 导出：`export function TenantDialogManager()`

### 4. Hook 文件

- Hook 文件统一使用 `use_*.ts`
- Hook 导出名保持 `useXxx`

示例：

- 文件：`use_login_form.ts`
- 导出：`export function useLoginForm()`

### 5. API 文件

- 模块 API 文件统一使用 `*_api.ts`
- 聚合 API 使用语义化名称，例如 `system_api.ts`

### 6. Store 文件

- Store 文件统一使用 `*_store.ts`
- Zustand store hook 继续使用 `useXxxStore`

### 7. 文案/配置/复制对象文件

- 页面文案、副本、映射、元数据文件统一使用语义后缀：
  - `*_copy.ts`
  - `*_config.ts`
  - `*_meta.ts`
  - `*_constants.ts`

## 目录规则

- 新增目录优先使用 `snake_case`
- 历史目录按批次迁移到 `snake_case`
- 目录未迁移前，目录内新增文件也必须遵守 `snake_case`

## 例外情况

- `App.tsx`、`main.tsx`、`index.ts`、`index.tsx` 保持约定式命名
- `components/ui/` 下的 shadcn/ui 文件保留其上游命名风格
- `App.tsx` 与语言区域文件（如 `en-US.json`、`zh-CN.json`）保持框架和国际化约定式命名
- 第三方约定文件、测试框架约定文件按工具规则命名

## 本次已收敛范围

- `modules/auth` 的 `api`、`hooks`、`store`
- `modules/tenant` 的 `api`、关键 `hooks`
- `modules/system` 的 `api`、页面 `copy` 文件、关键 `hooks`
- 前端壳层与共享层：`components/`、`layouts/`、`shared/components/`、`stores/`、根级 `hooks/`
- 公共组件层：`components/common/`、`shared/components/ui/`、`shared/components/enhanced/`
- 低风险展示与模板层：`components/figma/`、`shared/templates/`、`shared/i18n/`、`shared/examples/`
- 模块内高频组件文件：`auth`、`tenant`、`system`、`notification` 的核心 `components/`
- 核心业务目录：`system/views/*`、`tenant/components/tenant_setup_wizard/`、`tenant/views/tenant_management/`
- `auth/profile` 主干目录：`profile_center/`、`account_settings/`、`views/*`
- 低风险工具层：`shared/constants/`、`shared/hooks/`、`shared/utils/`、`shared/validation/` 的核心 `.ts` 文件

## 后续建议

- 继续收敛零散历史目录，但优先处理纯 `.ts` 文件和路径引用稳定的目录
- 迁移时保持“一批目录 + 一次类型检查”节奏，避免大面积路径冲突
- 对后续新增公共组件，继续逐文件核对 JSX 标签，避免路径迁移时误改组件标签
- 对外组件标识或后端菜单组件编码，优先保留兼容映射，不直接硬切
