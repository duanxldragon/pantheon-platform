/**
 * TanStack Query 配置和集成
 * 提供服务端状态管理、自动缓存、重新验证等功能
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryErrorLike {
  response?: {
    status?: number;
  };
}

type QueryFilter = Readonly<Record<string, unknown>>;

function getQueryErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }

  const response = (error as QueryErrorLike).response;
  return response?.status;
}

/**
 * 创建QueryClient实例
 * 配置全局默认行为
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 数据在缓存中保持新鲜的时间（5分钟）
        staleTime: 5 * 60 * 1000,

        // 缓存时间（默认30分钟）
        gcTime: 30 * 60 * 1000,

        // 窗口重新获得焦点时自动重新获取数据
        refetchOnWindowFocus: true,

        // 组件挂载时重新获取数据
        refetchOnMount: true,

        // 网络重连时重新获取数据
        refetchOnReconnect: true,

        // 自动重试配置
        retry: (failureCount, error) => {
          const status = getQueryErrorStatus(error);
          // 4xx错误不重试
          if (status !== undefined && status >= 400 && status < 500) {
            return false;
          }
          // 最多重试3次
          return failureCount < 3;
        },

        // 重试延迟（指数退避）
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // 变更失败时重试
        retry: (failureCount, error) => {
          const status = getQueryErrorStatus(error);
          // 4xx错误不重试
          if (status !== undefined && status >= 400 && status < 500) {
            return false;
          }
          return failureCount < 2;
        },

        // 变更错误抛出
        throwOnError: false,
      },
    },
  });
}

/**
 * 创建全局QueryClient实例
 * 在应用中保持单例
 */
export const queryClient = createQueryClient();

/**
 * Query Keys常量
 * 集中管理所有查询键，确保类型安全和一致性
 */
export const queryKeys = {
  // 认证相关
  auth: {
    all: ['auth'] as const,
    current: () => ['auth', 'current'] as const,
    config: () => ['auth', 'config'] as const,
    apiKeys: () => ['auth', 'api-keys'] as const,
  },

  // 用户管理
  users: {
    all: ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (filters: QueryFilter) => ['users', 'list', filters] as const,
    details: () => ['users', 'detail'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },

  // 角色管理
  roles: {
    all: ['roles'] as const,
    lists: () => ['roles', 'list'] as const,
    list: (filters: QueryFilter) => ['roles', 'list', filters] as const,
    details: () => ['roles', 'detail'] as const,
    detail: (id: string) => ['roles', 'detail', id] as const,
    permissions: (id: string) => ['roles', id, 'permissions'] as const,
    menus: (id: string) => ['roles', id, 'menus'] as const,
  },

  // 部门管理
  departments: {
    all: ['departments'] as const,
    lists: () => ['departments', 'list'] as const,
    list: (filters: QueryFilter) => ['departments', 'list', filters] as const,
    details: () => ['departments', 'detail'] as const,
    detail: (id: string) => ['departments', 'detail', id] as const,
    tree: () => ['departments', 'tree'] as const,
    members: (id: string) => ['departments', id, 'members'] as const,
  },

  // 菜单管理
  menus: {
    all: ['menus'] as const,
    lists: () => ['menus', 'list'] as const,
    list: (filters: QueryFilter) => ['menus', 'list', filters] as const,
    details: () => ['menus', 'detail'] as const,
    detail: (id: string) => ['menus', 'detail', id] as const,
    tree: () => ['menus', 'tree'] as const,
  },

  // 权限管理
  permissions: {
    all: ['permissions'] as const,
    lists: () => ['permissions', 'list'] as const,
    list: (filters: QueryFilter) => ['permissions', 'list', filters] as const,
    details: () => ['permissions', 'detail'] as const,
    detail: (id: string) => ['permissions', 'detail', id] as const,
  },

  // 岗位管理
  positions: {
    all: ['positions'] as const,
    lists: () => ['positions', 'list'] as const,
    list: (filters: QueryFilter) => ['positions', 'list', filters] as const,
    details: () => ['positions', 'detail'] as const,
    detail: (id: string) => ['positions', 'detail', id] as const,
    users: (id: string) => ['positions', id, 'users'] as const,
  },

  // 系统设置
  settings: {
    all: ['settings'] as const,
    lists: () => ['settings', 'list'] as const,
    detail: (key: string) => ['settings', key] as const,
  },

  // 操作日志
  operationLogs: {
    all: ['operationLogs'] as const,
    lists: () => ['operationLogs', 'list'] as const,
    list: (filters: QueryFilter) => ['operationLogs', 'list', filters] as const,
  },

  // 登录日志
  loginLogs: {
    all: ['loginLogs'] as const,
    lists: () => ['loginLogs', 'list'] as const,
    list: (filters: QueryFilter) => ['loginLogs', 'list', filters] as const,
  },

  // 通知
  notifications: {
    all: ['notifications'] as const,
    lists: () => ['notifications', 'list'] as const,
    list: (filters: QueryFilter) => ['notifications', 'list', filters] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
    templates: () => ['notifications', 'templates'] as const,
  },

  // 租户
  tenants: {
    all: ['tenants'] as const,
    status: () => ['tenants', 'status'] as const,
    current: () => ['tenants', 'current'] as const,
  },
};

/**
 * QueryClientProvider组件
 * 用于在应用中提供QueryClient
 */
export { QueryClientProvider };
