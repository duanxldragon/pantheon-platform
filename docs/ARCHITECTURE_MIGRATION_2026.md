# 前端架构迁移说明 (2026-04)

## 📋 迁移概述

**迁移日期**: 2026-04-09
**迁移类型**: 动态视图系统 → React Router v6
**状态**: ✅ 完成

---

## 🔄 架构变更

### 之前的架构（动态视图系统）

```typescript
// 旧架构：基于状态管理的视图系统
<ViewManager>
  <Sidebar />
  <TopBar />
  <DynamicViewArea />  // 动态挂载组件
  <TabManager />
</ViewManager>
```

**特点**:
- 使用自定义ViewManager管理视图状态
- 通过视图ID而不是URL来管理页面
- 标签页和视图紧密耦合
- 手动管理视图历史记录

### 当前架构（React Router v6）

```typescript
// 新架构：基于React Router的路由系统
<RouterProvider>
  <MainLayout>
    <Sidebar />
    <TopBar />
    <Outlet />  // React Router渲染子路由
    <TabManager />  // 保留用于多标签页
  </MainLayout>
</RouterProvider>
```

**特点**:
- 使用React Router v6进行路由管理
- 基于URL的页面导航
- 支持浏览器前进/后退
- 深度链接和书签支持
- 更好的SEO和可访问性

---

## 🎯 核心变更

### 1. 路由管理

#### 之前：视图ID系统
```typescript
// 旧方式：通过视图ID导航
const { navigateToView } = useViewManager();
navigateToView('user-management');  // 使用视图ID
```

#### 现在：URL路由系统
```typescript
// 新方式：通过URL导航
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/system/users');  // 使用URL路径
```

### 2. 布局组件

#### MainLayout变更
```typescript
// 之前：接受children prop
function MainLayout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

// 现在：使用Outlet
function MainLayout() {
  return (
    <div>
      <Sidebar />
      <TopBar />
      <Outlet />  // React Router自动渲染子路由
    </div>
  );
}
```

### 3. 导航守卫

#### 之前：在ViewManager中处理
```typescript
// 旧方式：在视图管理器中检查权限
const canNavigate = viewManager.checkPermission(viewId);
if (!canNavigate) {
  showNotification('无权限');
}
```

#### 现在：在路由级别处理
```typescript
// 新方式：使用路由守卫
export function useRouteGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated]);
}
```

### 4. 组件导出

#### 统一命名规范
```typescript
// 之前：不统一的命名
export function UserManagementView() { }
export function RoleManagement() { }

// 现在：统一命名（去掉View后缀）
export function UserManagement() { }
export function RoleManagement() { }
```

---

## 📊 技术栈更新

### 新增技术

1. **React Router v7.14.0**
   - 声明式路由配置
   - 嵌套路由支持
   - 路由守卫和权限控制

2. **Axios 1.7.0**
   - 替代Fetch API
   - 请求/响应拦截器
   - 自动字段名转换

3. **TanStack Query v5.96.2**
   - 服务端状态管理
   - 自动缓存和重新验证
   - 乐观更新支持

4. **i18next + react-i18next**
   - 结构化翻译文件
   - 类型安全翻译
   - 多语言支持

### 移除/简化

- 自定义视图管理器（被React Router替代）
- 手动字段名转换（自动处理）
- 部分状态管理逻辑（由TanStack Query接管）

---

## 🔧 字段命名统一

### 问题
之前混用snake_case和camelCase，导致类型错误和维护困难。

### 解决方案
**前端统一使用camelCase，后端保持snake_case，转换层自动处理。**

```typescript
// API响应（后端）
{
  "real_name": "张三",
  "tenant_id": "123",
  "created_at": "2026-04-09"
}

// 自动转换为（前端）
{
  "realName": "张三",
  "tenantId": "123",
  "createdAt": "2026-04-09"
}
```

### 转换实现
- Axios拦截器自动转换
- FieldTransformer工具类
- 完整的字段名映射表

---

## ✅ 迁移完成状态

### 类型检查
```bash
npm run type-check
# ✅ 通过（0错误）
```

### 代码检查
```bash
npm run lint
# ✅ 通过（75 warnings，主要是测试文件）
```

### 构建验证
```bash
npm run build
# ✅ 成功
```

---

## 📝 开发指南

### 新增页面

1. **创建视图组件**
```typescript
// src/modules/system/views/new_page/index.tsx
export function NewPage() {
  return <div>新页面</div>;
}
```

2. **添加路由**
```typescript
// src/router/routes.tsx
import { NewPage } from '../modules/system/views/new_page';

export const routes = [
  {
    path: 'new-page',
    element: <NewPage />,
  },
];
```

3. **更新菜单**
```typescript
// 在系统设置中添加菜单项
{
  name: '新页面',
  path: '/system/new-page',
  icon: '...',
}
```

### 导航到页面

```typescript
// 方式1：使用useNavigate Hook
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/system/users');

// 方式2：使用Link组件
import { Link } from 'react-router-dom';
<Link to="/system/users">用户管理</Link>;

// 方式3：程序化导航
window.location.href = '/system/users';
```

### 权限控制

```typescript
// 使用路由守卫
import { useRouteGuard } from '@/router/use_route_guard';

function MyProtectedPage() {
  useRouteGuard();  // 自动检查认证和权限

  return <div>受保护的内容</div>;
}
```

---

## 🚀 性能优化

### 已实施的优化

1. **代码分割**
   - 路由级别的代码分割
   - 按需加载组件
   - 减少初始包大小

2. **缓存策略**
   - TanStack Query自动缓存
   - 智能重新验证
   - 优化API请求

3. **构建优化**
   - 细粒度chunk分割
   - 生产环境console移除
   - 响应式chunk配置

### 未来优化方向

1. **路由懒加载**
```typescript
const UserManagement = lazy(() => import('./views/user_management'));
```

2. **虚拟滚动**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
```

3. **图片懒加载**
```typescript
import { LazyImage } from '@/components/lazy-image';
```

---

## 🎓 最佳实践

### DO ✅

1. **使用React Router导航**
```typescript
navigate('/system/users');
```

2. **camelCase命名**
```typescript
interface User {
  realName: string;
  tenantId: string;
  createdAt: string;
}
```

3. **使用TanStack Query**
```typescript
const { data } = useUsersList({ page: 1 });
```

4. **类型安全**
```typescript
const user: User = response.data;
```

### DON'T ❌

1. **不要绕过React Router**
```typescript
// ❌ 避免
window.location.href = '/some-path';

// ✅ 推荐
navigate('/some-path');
```

2. **不要混用命名风格**
```typescript
// ❌ 避免
interface User {
  real_name: string;  // snake_case
  tenantId: string;   // camelCase
}

// ✅ 统一使用camelCase
interface User {
  realName: string;
  tenantId: string;
}
```

3. **不要直接调用HTTP**
```typescript
// ❌ 避免
const data = await fetch('/api/users').then(r => r.json());

// ✅ 推荐
const { data } = useUsersList({ page: 1 });
```

---

## 📚 相关文档

- [React Router v6文档](https://reactrouter.com/)
- [TanStack Query文档](https://tanstack.com/query/latest)
- [Axios文档](https://axios-http.com/)
- [i18next文档](https://www.i18next.com/)

---

## 🔄 迁移验证

### 功能验证

- [x] 路由导航正常
- [x] 浏览器前进/后退支持
- [x] 深度链接工作
- [x] 权限守卫生效
- [x] 标签页功能保留
- [x] API调用正常
- [x] 字段转换自动
- [x] 国际化支持

### 性能验证

- [x] 构建成功
- [x] 类型检查通过
- [x] 无运行时错误
- [x] 包大小合理
- [x] 加载时间正常

---

**迁移完成日期**: 2026-04-09
**审核状态**: ✅ 通过
**下一步**: 继续性能优化和功能扩展

---

## 💡 常见问题

### Q: 为什么从动态视图切换到React Router？

**A**: React Router提供了：
- 标准化的路由管理
- 更好的浏览器集成
- 深度链接支持
- 更容易维护和扩展

### Q: 标签页功能还在吗？

**A**: 是的，标签页管理功能保留在`uiStore`中，与路由系统并行工作。

### Q: 现在如何添加新页面？

**A**: 1. 创建视图组件 → 2. 添加路由配置 → 3. 更新菜单

### Q: 字段命名为什么要统一？

**A**:
- 提高代码一致性
- 减少类型错误
- 简化维护工作
- 符合JavaScript最佳实践

---

**文档维护**: 前端开发团队
**最后更新**: 2026-04-09
**版本**: v1.0
