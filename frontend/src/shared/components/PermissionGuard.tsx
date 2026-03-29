import { ReactNode } from 'react';

import { usePermission } from '../../hooks/usePermission';
import { useLanguageStore } from '../../stores/languageStore';

interface PermissionGuardProps {
  permission?: string | readonly string[];
  role?: string | readonly string[];
  mode?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
  showPlaceholder?: boolean;
}

export function PermissionGuard({
  permission,
  role,
  mode = 'all',
  fallback = null,
  children,
  showPlaceholder = false,
}: PermissionGuardProps) {
  const {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
    isSuperAdmin,
  } = usePermission();

  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = mode === 'any'
        ? hasAnyPermission(permission)
        : hasAllPermissions(permission);
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  if (role && !hasAccess) {
    if (Array.isArray(role)) {
      hasAccess = mode === 'any'
        ? hasAnyRole(role)
        : hasAllRoles(role);
    } else {
      hasAccess = hasRole(role);
    }
  }

  if (!permission && !role) {
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showPlaceholder) {
      return (
        <div className="pointer-events-none cursor-not-allowed opacity-50">
          {fallback || children}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role'> {
  permission?: string | readonly string[];
  role?: string | readonly string[];
  mode?: 'any' | 'all';
  children: ReactNode;
}

export function PermissionButton({
  permission,
  role,
  mode = 'all',
  children,
  disabled,
  ...props
}: PermissionButtonProps) {
  const {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
    isSuperAdmin,
  } = usePermission();

  if (isSuperAdmin()) {
    return (
      <button {...props} disabled={disabled}>
        {children}
      </button>
    );
  }

  let hasAccess = false;

  if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = mode === 'any'
        ? hasAnyPermission(permission)
        : hasAllPermissions(permission);
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  if (role && !hasAccess) {
    if (Array.isArray(role)) {
      hasAccess = mode === 'any'
        ? hasAnyRole(role)
        : hasAllRoles(role);
    } else {
      hasAccess = hasRole(role);
    }
  }

  if (!permission && !role) {
    hasAccess = true;
  }

  return (
    <button {...props} disabled={disabled || !hasAccess}>
      {children}
    </button>
  );
}

interface PermissionRouteProps {
  permission?: string | readonly string[];
  role?: string | readonly string[];
  mode?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionRoute({
  permission,
  role,
  mode = 'all',
  fallback,
  children,
}: PermissionRouteProps) {
  const {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
    isSuperAdmin,
  } = usePermission();

  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = mode === 'any'
        ? hasAnyPermission(permission)
        : hasAllPermissions(permission);
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  if (role && !hasAccess) {
    if (Array.isArray(role)) {
      hasAccess = mode === 'any'
        ? hasAnyRole(role)
        : hasAllRoles(role);
    } else {
      hasAccess = hasRole(role);
    }
  }

  if (!permission && !role) {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback || <NoPermissionPage />}</>;
  }

  return <>{children}</>;
}

function NoPermissionPage() {
  const t = useLanguageStore((state) => state.t);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">{t.common.noPermissionTitle}</h2>
        <p className="mb-6 text-gray-600">{t.common.noPermissionHint}</p>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
        >
          {t.common.back}
        </button>
      </div>
    </div>
  );
}
