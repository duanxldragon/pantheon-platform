import type { ReactElement, ReactNode } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import type { NonIndexRouteObject, RouteObject } from 'react-router-dom';
import { routes } from './routes';
import { useAuthStore } from '../modules/auth/store/auth_store';

// 创建路由守卫包装器
function RouteGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tenantSetupRequired = useAuthStore((state) => state.tenantSetupRequired);
  const enableMultiTenant = useAuthStore((state) => state.enableMultiTenant);

  // 未认证重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 需要租户初始化
  if (enableMultiTenant && tenantSetupRequired) {
    return <Navigate to="/tenant-setup" replace />;
  }

  return <>{children}</>;
}

// 创建受保护的路由配置
function createProtectedRoutes(): RouteObject[] {
  const wrapRoute = (route: RouteObject): RouteObject => {
    if ('index' in route && route.index) {
      if (!route.element) {
        return route;
      }

      return {
        ...route,
        element: <RouteGuard>{route.element as ReactElement}</RouteGuard>,
      };
    }

    const nonIndexRoute = route as NonIndexRouteObject;
    const nextChildren = nonIndexRoute.children?.map(wrapRoute);

    if (!nonIndexRoute.element) {
      return {
        ...nonIndexRoute,
        children: nextChildren,
      };
    }

    return {
      ...nonIndexRoute,
      element: <RouteGuard>{nonIndexRoute.element as ReactElement}</RouteGuard>,
      children: nextChildren,
    };
  };

  return routes.map((route) => {
    if (!('index' in route && route.index) && route.path === '/') {
      const nonIndexRoute = route as NonIndexRouteObject;
      return {
        ...nonIndexRoute,
        children: nonIndexRoute.children?.map(wrapRoute),
      };
    }

    return route;
  });
}

// 创建router实例
function createAppRouter() {
  const router = createBrowserRouter(createProtectedRoutes());

  return router;
}

// Router组件
export function AppRouter() {
  const router = createAppRouter();

  return <RouterProvider router={router} />;
}
