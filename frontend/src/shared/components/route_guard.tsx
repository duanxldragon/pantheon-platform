import type { ReactNode } from 'react';

import { useAuthStore } from '../../modules/auth/store/auth_store';
import { useLanguageStore } from '../../stores/language_store';
import { systemNotification } from '../utils/notification';

interface RouteGuardProps {
  children: ReactNode;
  requiredPermissions?: string | readonly string[];
  requiredRoles?: string | readonly string[];
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




