import { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useLanguageStore } from '../../stores/languageStore';

interface PermissionGuardProps {
  /** 需要的权限代码，支持单个或多个 */
  permission?: string | string[];
  /** 需要的角色，支持单个或多个 */
  role?: string | string[];
  /** 权限检查模式：any-任一权限即可，all-需要所有权限 */
  mode?: 'any' | 'all';
  /** 无权限时显示的内容 */
  fallback?: ReactNode;
  /** 子组件 */
  children: ReactNode;
  /** 是否显示无权限的占位符（而不是完全隐藏） */
  showPlaceholder?: boolean;
}

/**
 * 权限守卫组件
 * @description 根据权限控制子组件的显示
 * @example
 * ```tsx
 * // 单个权限
 * <PermissionGuard permission="user:delete">
 *   <Button>删除</Button>
 * </PermissionGuard>
 * 
 * // 多个权限（任一）
 * <PermissionGuard permission={['user:edit', 'user:delete']} mode="any">
 *   <Button>操作</Button>
 * </PermissionGuard>
 * 
 * // 多个权限（全部）
 * <PermissionGuard permission={['user:view', 'user:edit']} mode="all">
 *   <Button>编辑</Button>
 * </PermissionGuard>
 * 
 * // 角色检查
 * <PermissionGuard role="超级管理员">
 *   <AdminPanel />
 * </PermissionGuard>
 * 
 * // 自定义无权限显示
 * <PermissionGuard 
 *   permission="user:delete"
 *   fallback={<Button disabled>删除</Button>}
 * >
 *   <Button>删除</Button>
 * </PermissionGuard>
 * ```
 */
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

  // 超级管理员拥有所有权限
  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  let hasAccess = false;

  // 检查权限
  if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = mode === 'any' 
        ? hasAnyPermission(permission)
        : hasAllPermissions(permission);
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  // 检查角色
  if (role && !hasAccess) {
    if (Array.isArray(role)) {
      hasAccess = mode === 'any'
        ? hasAnyRole(role)
        : hasAllRoles(role);
    } else {
      hasAccess = hasRole(role);
    }
  }

  // 如果没有指定权限或角色，默认允许访问
  if (!permission && !role) {
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showPlaceholder) {
      return (
        <div className="opacity-50 cursor-not-allowed pointer-events-none">
          {fallback || children}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 需要的权限 */
  permission?: string | string[];
  /** 需要的角色 */
  role?: string | string[];
  /** 权限检查模式 */
  mode?: 'any' | 'all';
  /** 子元素 */
  children: ReactNode;
}

/**
 * 带权限控制的按钮组件
 * @description 自动根据权限禁用或隐藏按钮
 * @example
 * ```tsx
 * <PermissionButton permission="user:delete" onClick={handleDelete}>
 *   删除
 * </PermissionButton>
 * ```
 */
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

  // 超级管理员拥有所有权限
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

/**
 * 权限路由守卫组件
 * @description 用于保护整个页面或路由
 */
interface PermissionRouteProps {
  /** 需要的权限 */
  permission?: string | string[];
  /** 需要的角色 */
  role?: string | string[];
  /** 权限检查模式 */
  mode?: 'any' | 'all';
  /** 无权限时显示的页面 */
  fallback?: ReactNode;
  /** 子组件 */
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
    return (
      <>{fallback || <NoPermissionPage />}</>
    );
  }

  return <>{children}</>;
}

/**
 * 无权限页面
 */
function NoPermissionPage() {
  const t = useLanguageStore((state) => state.t);
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t.common.noPermissionTitle}</h2>
        <p className="text-gray-600 mb-6">
          {t.common.noPermissionHint}
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t.common.back}
        </button>
      </div>
    </div>
  );
}
