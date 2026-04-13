import type { ReactNode } from 'react';

import { useAuthStore } from '../../modules/auth/store/auth_store';
import { useLanguageStore } from '../../stores/language_store';
import { systemNotification } from '../utils/notification';
import { resolveRouteGuardDecision } from './access_control_utils';

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
  const decision = resolveRouteGuardDecision({
    isAuthenticated,
    hasUser: Boolean(user),
    requiredPermissions,
    requiredRoles,
    hasPermission,
    hasRole,
    messages: {
      pleaseLogin: t.common.pleaseLogin,
      permissionDenied: t.common.permissionDenied,
      roleDenied: t.common.roleDenied,
    },
  });

  if (decision.status !== 'allow') {
    if (onUnauthorized) {
      onUnauthorized();
    } else if (decision.message) {
      systemNotification.error(decision.message);
    }
    return fallback || <div>{decision.message}</div>;
  }

  return <>{children}</>;
}




