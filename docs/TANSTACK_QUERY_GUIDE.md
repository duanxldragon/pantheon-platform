# TanStack Query 集成指南

## 📋 概述

TanStack Query（原React Query）是一个强大的数据同步库，用于管理服务端状态。它提供了自动缓存、重新验证、乐观更新等功能。

## 🎯 核心功能

### 1. 自动缓存和重新验证

```typescript
// 数据自动缓存5分钟
const { data, isLoading, error } = useUsersList({ page: 1, pageSize: 10 });

// 窗口重新获得焦点时自动重新获取数据
// 组件重新挂载时自动重新获取数据
// 网络重连时自动重新获取数据
```

### 2. 乐观更新

```typescript
const updateUser = useUpdateUser();

// 更新前先更新UI，失败时自动回滚
updateUser.mutate({
  id: '123',
  data: { realName: '新名称' }
});
```

### 3. 自动重试

```typescript
// 5xx错误自动重试3次
// 4xx错误不重试
// 指数退避延迟
```

### 4. 依赖查询

```typescript
// 只有用户登录后才获取用户数据
const { data: user } = useUserDetail(userId, {
  enabled: !!userId
});
```

## 🔧 配置说明

### QueryClient配置

```typescript
// frontend/src/shared/utils/tanstack_query.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 数据保持5分钟新鲜
      gcTime: 30 * 60 * 1000,        // 缓存保留30分钟
      refetchOnWindowFocus: true,    // 窗口聚焦时重新获取
      refetchOnMount: true,          // 组件挂载时重新获取
      refetchOnReconnect: true,      // 网络重连时重新获取
      retry: 3,                      // 失败重试3次
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

## 📝 使用示例

### 基础查询

```typescript
import { useUsersList } from '../hooks/use_users_query';

function UserList() {
  const { data, isLoading, error, refetch } = useUsersList({
    page: 1,
    pageSize: 10,
  });

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败: {error.message}</div>;

  return (
    <div>
      {data?.list.map(user => (
        <div key={user.id}>{user.realName}</div>
      ))}
      <button onClick={() => refetch()}>刷新</button>
    </div>
  );
}
```

### 创建数据

```typescript
import { useCreateUser } from '../hooks/use_users_query';

function CreateUserForm() {
  const createUser = useCreateUser();

  const handleSubmit = (data: UserFormData) => {
    createUser.mutate(data, {
      onSuccess: () => {
        // 成功后的额外处理
        console.log('创建成功');
      },
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(formData);
    }}>
      <button
        type="submit"
        disabled={createUser.isPending}
      >
        {createUser.isPending ? '创建中...' : '创建'}
      </button>
    </form>
  );
}
```

### 更新数据（乐观更新）

```typescript
import { useUpdateUser } from '../hooks/use_users_query';

function UpdateUserName({ userId, currentName }) {
  const updateUser = useUpdateUser();

  const handleUpdate = () => {
    updateUser.mutate({
      id: userId,
      data: { realName: '新名称' }
    });
  };

  return (
    <div>
      <p>当前名称: {currentName}</p>
      <button
        onClick={handleUpdate}
        disabled={updateUser.isPending}
      >
        {updateUser.isPending ? '更新中...' : '更新'}
      </button>
    </div>
  );
}
```

### 删除数据

```typescript
import { useDeleteUser } from '../hooks/use_users_query';

function DeleteUserButton({ userId }) {
  const deleteUser = useDeleteUser();

  const handleDelete = () => {
    if (confirm('确定删除?')) {
      deleteUser.mutate(userId);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteUser.isPending}
    >
      {deleteUser.isPending ? '删除中...' : '删除'}
    </button>
  );
}
```

### 依赖查询

```typescript
// 只有当departmentId存在时才执行查询
const { data: users } = useUsersList(
  { departmentId },
  {
    enabled: !!departmentId
  }
);
```

### 分页查询

```typescript
function PaginatedUserList() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading } = useUsersList({ page, pageSize });

  return (
    <div>
      <div>
        {data?.list.map(user => (
          <div key={user.id}>{user.realName}</div>
        ))}
      </div>
      <div>
        <button
          onClick={() => setPage(p => p - 1)}
          disabled={page === 1 || isLoading}
        >
          上一页
        </button>
        <span>第 {page} 页</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!data?.hasMore || isLoading}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
```

## 🔍 缓存管理

### 手动刷新缓存

```typescript
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // 刷新所有用户列表
    queryClient.invalidateQueries({
      queryKey: queryKeys.users.lists()
    });
  };

  return <button onClick={handleRefresh}>刷新所有列表</button>;
}
```

### 手动设置缓存

```typescript
const queryClient = useQueryClient();

// 乐观更新
queryClient.setQueryData(
  queryKeys.users.detail(userId),
  (oldUser) => ({
    ...oldUser,
    realName: '新名称'
  })
);
```

### 清除缓存

```typescript
// 清除特定查询的缓存
queryClient.removeQueries({
  queryKey: queryKeys.users.detail(userId)
});

// 清除所有用户相关的缓存
queryClient.removeQueries({
  queryKey: queryKeys.users.all
});
```

## 🎨 Query Keys设计

### 层次化Query Keys

```typescript
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (filters: any) => ['users', 'list', filters] as const,
    details: () => ['users', 'detail'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
};
```

### 使用Query Keys

```typescript
// 失效所有用户列表
queryClient.invalidateQueries({
  queryKey: queryKeys.users.lists()
});

// 失效特定用户详情
queryClient.invalidateQueries({
  queryKey: queryKeys.users.detail(userId)
});

// 失效所有用户相关查询
queryClient.invalidateQueries({
  queryKey: queryKeys.users.all
});
```

## ⚡ 性能优化

### 1. 调整缓存时间

```typescript
const { data } = useUsersList(params, {
  staleTime: 10 * 60 * 1000,  // 10分钟内不重新获取
  gcTime: 60 * 60 * 1000,      // 缓存保留1小时
});
```

### 2. 禁用自动重新获取

```typescript
const { data } = useUsersList(params, {
  refetchOnWindowFocus: false,  // 窗口聚焦时不重新获取
  refetchOnMount: false,        // 组件挂载时不重新获取
});
```

### 3. 并行查询

```typescript
// 使用Promise.all并行获取多个资源
const usersQuery = useUsersList({ page: 1 });
const rolesQuery = useRolesList({ page: 1 });
const departmentsQuery = useDepartmentsList({ page: 1 });

// 所有查询并行执行
if (usersQuery.isLoading || rolesQuery.isLoading || departmentsQuery.isLoading) {
  return <div>加载中...</div>;
}
```

### 4. 条件查询

```typescript
// 只在满足条件时执行查询
const { data: users } = useUsersList(
  { departmentId },
  {
    enabled: !!departmentId  // 只有当departmentId存在时才执行
  }
);
```

## 🐛 错误处理

### 全局错误处理

```typescript
const { data, error } = useUsersList(params);

if (error) {
  return <ErrorDisplay error={error} />;
}
```

### Mutation错误处理

```typescript
const createUser = useCreateUser();

createUser.mutate(data, {
  onError: (error) => {
    console.error('创建失败:', error);
    // 显示错误提示
  },
});
```

### 重试配置

```typescript
const { data } = useUsersList(params, {
  retry: (failureCount, error: any) => {
    // 4xx错误不重试
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    // 最多重试3次
    return failureCount < 3;
  },
});
```

## 📊 实战示例

### 完整的用户管理组件

```typescript
import { useState } from 'react';
import { useUsersList, useDeleteUser, useUpdateUser } from '../hooks/use_users_query';

export function UserManagement() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // 获取用户列表
  const { data, isLoading, error } = useUsersList({ page, pageSize });

  // 删除用户
  const deleteUser = useDeleteUser();

  // 更新用户
  const updateUser = useUpdateUser();

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败: {error.message}</div>;

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>用户名</th>
            <th>真实姓名</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data?.list.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.realName}</td>
              <td>{user.status}</td>
              <td>
                <button
                  onClick={() => updateUser.mutate({
                    id: user.id,
                    data: { status: 'active' }
                  })}
                  disabled={updateUser.isPending}
                >
                  激活
                </button>
                <button
                  onClick={() => deleteUser.mutate(user.id)}
                  disabled={deleteUser.isPending}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button
          onClick={() => setPage(p => p - 1)}
          disabled={page === 1}
        >
          上一页
        </button>
        <span>第 {page} 页</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!data?.hasMore}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
```

## 🎯 最佳实践

### 1. 使用专门的Hooks

```typescript
// ✅ 推荐：使用专门的Hooks
const { data } = useUsersList(params);

// ❌ 不推荐：直接使用useQuery
const { data } = useQuery({
  queryKey: ['users', 'list', params],
  queryFn: () => api.users.list(params),
});
```

### 2. 集中管理Query Keys

```typescript
// ✅ 推荐：使用统一的queryKeys
queryClient.invalidateQueries({
  queryKey: queryKeys.users.lists()
});

// ❌ 不推荐：硬编码queryKey
queryClient.invalidateQueries({
  queryKey: ['users', 'list']
});
```

### 3. 利用自动缓存

```typescript
// ✅ 推荐：依赖自动缓存
const { data } = useUsersList({ page: 1 });

// ❌ 不推荐：手动管理状态
const [users, setUsers] = useState([]);
useEffect(() => {
  api.users.list({ page: 1 }).then(setUsers);
}, []);
```

### 4. 使用乐观更新

```typescript
// ✅ 推荐：使用乐观更新提升体验
const updateUser = useUpdateUser();
updateUser.mutate({ id, data });

// ❌ 不推荐：等待成功后才更新UI
const handleUpdate = async () => {
  await api.users.update(id, data);
  // 然后更新UI
};
```

## 📚 参考资源

- [TanStack Query 官方文档](https://tanstack.com/query/latest)
- [React Query 教程](https://tanstack.com/query/latest/docs/react/overview)
- [Query Keys 工厂模式](https://tanstack.com/query/latest/docs/react/guides/query-keys)

## 🚀 迁移指南

### 从手动状态管理迁移

**之前**:
```typescript
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  api.users.list().then(data => {
    setUsers(data);
    setLoading(false);
  });
}, []);
```

**之后**:
```typescript
const { data: users, isLoading } = useUsersList();
```

### 从SWR迁移

TanStack Query与SWR非常相似，主要区别：

1. **缓存策略**: Query默认更激进地缓存
2. **API设计**: Query的API更灵活
3. **DevTools**: Query有专门的DevTools

基本迁移只需替换Hook名称：
```typescript
// SWR
const { data, error } = useSWray('/api/users', fetcher);

// TanStack Query
const { data, error } = useUsersList();
```

---

**集成完成日期**: 2026-04-09
**版本**: TanStack Query v5
**状态**: ✅ 已集成并可使用
