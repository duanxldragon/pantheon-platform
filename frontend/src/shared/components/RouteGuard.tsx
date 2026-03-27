import React from 'react';
import type { ReactNode } from 'react';

import { useAuthStore } from '../../modules/auth/store/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { systemNotification } from '../utils/notification';

interface RouteGuardProps {
  children: ReactNode;
  requiredPermissions?: string | string[];
  requiredRoles?: string | string[];
  fallback?: ReactNode;
  onUnauthorized?: () => void;
}

export function RouteGuard({
  children,
  requiredPermissions,
  requiredRoles,
  fallback,
  onUnauthorized,
}: RouteGuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);
  const user = useAuthStore((state) => state.user);
  const t = useLanguageStore((state) => state.t);

  if (!isAuthenticated || !user) {
    if (onUnauthorized) {
      onUnauthorized();
    } else {
      systemNotification.error(t.common.pleaseLogin);
    }
    return fallback || <div>{t.common.pleaseLogin}</div>;
  }

  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const hasRequiredPermission = permissions.some((permission) => hasPermission(permission));

    if (!hasRequiredPermission) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        systemNotification.error(t.common.permissionDenied);
      }
      return fallback || <div>{t.common.permissionDenied}</div>;
    }
  }

  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequiredRole = roles.some((role) => hasRole(role));

    if (!hasRequiredRole) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        systemNotification.error(t.common.roleDenied);
      }
      return fallback || <div>{t.common.roleDenied}</div>;
    }
  }

  return <>{children}</>;
}

export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: Omit<RouteGuardProps, 'children'>,
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...guardOptions}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}

export function usePermissionCheck() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);
  const user = useAuthStore((state) => state.user);

  const checkPermission = (permissions: string | string[]): boolean => {
    if (!user) return false;
    return hasPermission(permissions);
  };

  const checkRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    return hasRole(roles);
  };

  const checkAny = (
    permissions?: string | string[],
    roles?: string | string[],
  ): boolean => {
    if (!user) return false;

    let hasPermissionCheck = true;
    let hasRoleCheck = true;

    if (permissions) {
      hasPermissionCheck = checkPermission(permissions);
    }

    if (roles) {
      hasRoleCheck = checkRole(roles);
    }

    return hasPermissionCheck && hasRoleCheck;
  };

  return {
    checkPermission,
    checkRole,
    checkAny,
    user,
  };
}
