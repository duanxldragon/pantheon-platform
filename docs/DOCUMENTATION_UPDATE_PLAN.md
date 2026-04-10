# 文档更新计划 - 2026-04-09

## 📋 需要更新的文档

### 🔥 高优先级（立即更新）

#### 1. frontend/AGENTS.md
**当前内容**: "这是工作台式后台，不是纯 URL 驱动页面站点"
**需要改为**: "这是基于React Router的后台系统，使用URL驱动的路由管理"

**具体修改**:
```markdown
## 3. 前端架构事实

- 这是基于React Router v6的后台管理系统
- 核心交互依赖：
  - React Router路由系统（URL驱动导航）
  - 菜单配置（与路由联动）
  - 标签页状态（保留用于多标签页管理）
- 关键状态源：
  - `authStore` - 认证状态
  - `systemStore` - 系统配置
  - `uiStore` - UI状态（包括标签页）
  - `React Router` - 路由和导航管理
```

#### 2. frontend/DESIGN.md
**当前内容**: "这是菜单 + 标签页 + 动态视图的后台壳层"
**需要改为**: "这是基于React Router的后台系统，支持菜单导航和标签页管理"

**具体修改**:
```markdown
### Product Context
- 这是基于React Router的后台壳层系统
- 用户通过URL导航访问不同功能模块
- 支持多标签页管理，保持页面上下文
- 权限、租户状态、菜单配置动态变化
- 页面结果反馈在当前上下文中展示
```

#### 3. frontend/docs/DYNAMIC_VIEW_RUNTIME.md
**当前状态**: 该文档已过时，描述的是旧的动态视图系统
**建议操作**: 
- 标记为"已废弃"或"历史参考"
- 创建新的`ROUTER_RUNTIME.md`说明React Router系统

**新建文档**:
```markdown
# React Router 运行时说明

> 前端运行时的"React Router + 菜单 + 标签页"协作模型

## 1. 架构概述
Pantheon Platform 前端采用React Router v6进行路由管理：
- 路由配置：声明式路由定义
- URL驱动：通过URL导航到不同功能模块
- 嵌套路由：支持层级路由结构
- 权限守卫：路由级别的权限控制

## 2. 与标签页的协作
- URL变化可创建新标签页
- 标签页保持页面状态
- 支持浏览器前进/后退
```

#### 4. frontend/FRONTEND_GUIDE.md
**当前内容**: "App.tsx 当前会分流到三类界面"
**需要改为**: "通过React Router路由系统分流到三类界面"

**具体修改**:
```markdown
### 4.3 路由系统分流

通过React Router路由系统自动分流到三类界面：

- **未登录**：路由到 `/login`，显示 `Login` 组件
- **已登录但租户未初始化**：路由到 `/tenant-setup`，显示 `TenantSetupWizard` 组件  
- **已登录且租户就绪**：路由到主业务路由，显示 `MainLayout` 壳层

路由守卫（`use_route_guard.ts`）自动处理认证和权限检查。
```

### 🟡 中优先级（本周更新）

#### 5. docs/design/SYSTEM_ARCHITECTURE.md
**需要补充**: React Router架构说明

**补充内容**:
```markdown
### 前端路由架构

#### 路由配置
- 使用React Router v6进行路由管理
- 路由配置文件：`src/router/routes.tsx`
- 路由守卫：`src/router/use_route_guard.ts`

#### 导航机制
- URL驱动导航
- 支持浏览器前进/后退
- 深度链接和书签支持
```

### 🔵 低优先级（可选更新）

#### 6. 相关的HISTORY、CHANGELOG文件
**建议**: 记录这次架构迁移

---

## 🔄 实施建议

### 立即执行（今天）

1. **更新AGENTS.md**: 修改第24行的描述
2. **更新DESIGN.md**: 修改第42行的描述
3. **标记DYNAMIC_VIEW_RUNTIME.md**: 添加废弃说明

### 本周完成

4. **更新FRONTEND_GUIDE.md**: 修改App.tsx分流描述
5. **更新SYSTEM_ARCHITECTURE.md**: 补充React Router架构

### 可选（有时间的话）

6. **创建ROUTER_RUNTIME.md**: 新的运行时说明文档
7. **更新相关HISTORY文件**

---

## 📝 更新原则

### 保持一致性
- 所有文档描述与实际代码实现一致
- 使用准确的术语（React Router而非动态视图）

### 避免误导
- 移除或标记过时的"动态视图"相关描述
- 更新示例代码反映实际实现

### 文档追溯
- 保留架构变更的说明
- 指向新的准确文档

---

## ✅ 验证清单

更新后需要验证：

- [ ] 文档描述与代码实现100%一致
- [ ] 示例代码可以正常运行
- [ ] 术语使用准确统一
- [ ] 没有过时或误导性描述

---

**计划创建日期**: 2026-04-09
**优先级**: 高（影响开发体验）
**预计工作量**: 1-2小时