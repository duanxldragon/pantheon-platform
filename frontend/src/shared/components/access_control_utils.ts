import type { Tab } from '../../stores/ui_store';

export type RouteGuardDecisionStatus =
  | 'allow'
  | 'unauthenticated'
  | 'permission_denied'
  | 'role_denied';

type AccessCheck = (value: string | readonly string[]) => boolean;

interface RouteGuardMessages {
  pleaseLogin: string;
  permissionDenied: string;
  roleDenied: string;
}

interface ResolveRouteGuardDecisionOptions {
  isAuthenticated: boolean;
  hasUser: boolean;
  requiredPermissions?: string | readonly string[];
  requiredRoles?: string | readonly string[];
  hasPermission: AccessCheck;
  hasRole: AccessCheck;
  messages: RouteGuardMessages;
}

export function resolveRouteGuardDecision({
  isAuthenticated,
  hasUser,
  requiredPermissions,
  requiredRoles,
  hasPermission,
  hasRole,
  messages,
}: ResolveRouteGuardDecisionOptions): {
  status: RouteGuardDecisionStatus;
  message?: string;
} {
  if (!isAuthenticated || !hasUser) {
    return { status: 'unauthenticated', message: messages.pleaseLogin };
  }

  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    if (!permissions.some((permission) => hasPermission(permission))) {
      return { status: 'permission_denied', message: messages.permissionDenied };
    }
  }

  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!roles.some((role) => hasRole(role))) {
      return { status: 'role_denied', message: messages.roleDenied };
    }
  }

  return { status: 'allow' };
}

export function resolveQueryAccessFallback(
  tabs: Tab[],
  viewId: string,
  canAccessFallbackView: (candidateViewId: string) => boolean,
): { id: string; existingTabs: Tab[] } {
  const existingTabs = tabs.filter((tab) => tab.id !== viewId);
  const nextTab = existingTabs.find((tab) => canAccessFallbackView(tab.id));
  if (nextTab) {
    return { id: nextTab.id, existingTabs };
  }

  if (canAccessFallbackView('system-dashboard')) {
    return { id: 'system-dashboard', existingTabs };
  }

  return { id: 'profile-center', existingTabs };
}
