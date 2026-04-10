import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../modules/auth/store/auth_store';

type NavigationState = Record<string, unknown> | null;

/**
 * 路由守卫Hook
 * 用于处理认证状态和租户初始化状态的路由重定向
 */
export function useRouteGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tenantSetupRequired = useAuthStore((state) => state.tenantSetupRequired);
  const enableMultiTenant = useAuthStore((state) => state.enableMultiTenant);

  // 检查路由访问权限
  const checkRouteAccess = useCallback(() => {
    const currentPath = location.pathname;

    // 如果未认证且不在登录页，重定向到登录页
    if (!isAuthenticated && currentPath !== '/login') {
      navigate('/login', { replace: true });
      return false;
    }

    // 如果已认证但在登录页，重定向到首页
    if (isAuthenticated && currentPath === '/login') {
      navigate('/', { replace: true });
      return false;
    }

    // 如果需要租户初始化且不在租户初始化页，重定向到租户初始化页
    if (isAuthenticated && enableMultiTenant && tenantSetupRequired && currentPath !== '/tenant-setup') {
      navigate('/tenant-setup', { replace: true });
      return false;
    }

    // 如果不需要租户初始化但在租户初始化页，重定向到首页
    if (isAuthenticated && currentPath === '/tenant-setup' && (!enableMultiTenant || !tenantSetupRequired)) {
      navigate('/', { replace: true });
      return false;
    }

    return true;
  }, [isAuthenticated, tenantSetupRequired, enableMultiTenant, location.pathname, navigate]);

  // 在组件挂载和路由变化时检查权限
  useEffect(() => {
    checkRouteAccess();
  }, [checkRouteAccess]);

  return {
    isAuthenticated,
    tenantSetupRequired,
    enableMultiTenant,
    checkRouteAccess,
  };
}

/**
 * 权限检查Hook
 * 用于检查用户是否有权限访问特定路由
 */
export function usePermissionCheck(requiredPermission?: string) {
  const user = useAuthStore((state) => state.user);

  const hasPermission = useCallback(() => {
    if (!requiredPermission) return true;

    // 管理员拥有所有权限（假设admin角色的ID为1或包含admin）
    if (user?.roleIds?.includes('1') || user?.roleIds?.includes('admin')) return true;

    // 检查用户是否拥有所需权限
    return user?.permissions?.includes(requiredPermission) || false;
  }, [requiredPermission, user?.roleIds, user?.permissions]);

  return {
    hasPermission: hasPermission(),
    user,
    permissions: user?.permissions || [],
  };
}

/**
 * 路由导航Hook
 * 提供便捷的路由导航方法
 */
export function useRouteNavigation() {
  const navigate = useNavigate();

  return {
    // 导航到指定路径
    goTo: useCallback((path: string, state?: NavigationState) => {
      navigate(path, { state });
    }, [navigate]),

    // 返回上一页
    goBack: useCallback(() => {
      navigate(-1);
    }, [navigate]),

    // 前进到下一页
    goForward: useCallback(() => {
      navigate(1);
    }, [navigate]),

    // 替换当前路径
    replace: useCallback((path: string) => {
      navigate(path, { replace: true });
    }, [navigate]),

    // 导航到登录页
    goToLogin: useCallback(() => {
      navigate('/login', { replace: true });
    }, [navigate]),

    // 导航到首页
    goToHome: useCallback(() => {
      navigate('/', { replace: true });
    }, [navigate]),

    // 导航到租户初始化页
    goToTenantSetup: useCallback(() => {
      navigate('/tenant-setup', { replace: true });
    }, [navigate]),
  };
}
