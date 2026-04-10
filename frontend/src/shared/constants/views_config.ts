import type { ComponentType } from 'react';

import type { AppTranslations } from '../../stores/language_store';

export type LazyViewLoader = () => Promise<{ default: ComponentType<object> }>;

export interface ViewConfig {
  id: string;
  component: LazyViewLoader;
  label?: (language: string, t?: AppTranslations) => string;
  breadcrumbPath?: (t?: AppTranslations) => string[];
  path?: string;
  permissions?: string | readonly string[];
  roles?: string | readonly string[];
}

type MenuLike = {
  id?: string | number;
  name?: string;
  title?: string;
  code?: string;
  path?: string;
  component?: string;
  type?: 'menu' | 'button' | 'directory';
};

export const VIEWS_CONFIG: ViewConfig[] = [
  {
    id: 'dashboard',
    component: () => import('../../modules/dashboard').then((m) => ({ default: m.DashboardView })),
    label: (_, t) => t?.menu?.dashboard || 'Dashboard',
    breadcrumbPath: () => [],
    path: '/',
  },
  {
    id: 'system-dashboard',
    component: () => import('../../modules/system/views/system_dashboard').then((m) => ({ default: m.SystemDashboard })),
    label: (_, t) => t?.menu?.systemOverview || 'System Overview',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemOverview],
    path: '/dashboard',
    permissions: '/api/v1/system/*:*',
  },
  {
    id: 'system-users',
    component: () => import('../../modules/system/views/user_management').then((m) => ({ default: m.UserManagement })),
    label: (_, t) => t?.menu?.systemUsers || 'User Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemUsers],
    path: '/system/users',
    permissions: '/api/v1/system/users:*',
  },
  {
    id: 'system-departments',
    component: () => import('../../modules/system/views/department_management').then((m) => ({ default: m.DepartmentManagement })),
    label: (_, t) => t?.menu?.systemDepartments || 'Department Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemDepartments],
    path: '/system/departments',
    permissions: '/api/v1/system/depts:*',
  },
  {
    id: 'system-positions',
    component: () => import('../../modules/system/views/position_management').then((m) => ({ default: m.PositionManagement })),
    label: (_, t) => t?.menu?.systemPositions || 'Position Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemPositions],
    path: '/system/positions',
    permissions: '/api/v1/system/positions:*',
  },
  {
    id: 'system-roles',
    component: () => import('../../modules/system/views/role_management').then((m) => ({ default: m.RoleManagement })),
    label: (_, t) => t?.menu?.systemRoles || 'Role Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemRoles],
    path: '/system/roles',
    permissions: '/api/v1/system/roles:*',
  },
  {
    id: 'system-menus',
    component: () => import('../../modules/system/views/menu_management').then((m) => ({ default: m.MenuManagement })),
    label: (_, t) => t?.menu?.systemMenus || 'Menu Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemMenus],
    path: '/system/menus',
    permissions: '/api/v1/system/menus:*',
  },
  {
    id: 'system-permissions',
    component: () => import('../../modules/system/views/permission_management').then((m) => ({ default: m.PermissionManagement })),
    label: (_, t) => t?.menu?.systemPermissions || 'Permission Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemPermissions],
    path: '/system/permissions',
    permissions: '/api/v1/system/permissions:*',
  },
  {
    id: 'system-logs',
    component: () => import('../../modules/system/views/unified_log_management').then((m) => ({ default: m.UnifiedLogManagement })),
    label: (_, t) => t?.menu?.systemLogManagement || 'Log Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemLogs],
    path: '/system/logs',
    permissions: '/api/v1/system/logs/*:*',
  },
  {
    id: 'system-loginlog',
    component: () => import('../../modules/system/views/unified_log_management').then((m) => ({ default: m.UnifiedLogManagement })),
    label: (_, t) => t?.menu?.systemLogManagement || 'Log Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.loginLog || 'Login Log'],
    permissions: '/api/v1/system/logs/*:*',
  },
  {
    id: 'system-audit',
    component: () => import('../../modules/system/views/unified_log_management').then((m) => ({ default: m.UnifiedLogManagement })),
    label: (_, t) => t?.menu?.systemLogManagement || 'Log Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemAudit],
    permissions: '/api/v1/system/logs/*:*',
  },
  {
    id: 'system-settings',
    component: () => import('../../modules/system/views/system_settings').then((m) => ({ default: m.SystemSettings })),
    label: (_, t) => t?.menu?.systemSettings || 'System Settings',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemSettings],
    path: '/system/settings',
    permissions: '/api/v1/system/settings:*',
  },
  {
    id: 'system-dictionary',
    component: () => import('../../modules/system/views/data_dictionary').then((m) => ({ default: m.DataDictionary })),
    label: (_, t) => t?.menu?.systemDictionary || 'Data Dictionary',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemDictionary],
    path: '/system/dictionaries',
    permissions: '/api/v1/system/dict/*:*',
  },
  {
    id: 'system-monitor',
    component: () => import('../../modules/system/views/system_monitor').then((m) => ({ default: m.SystemMonitor })),
    label: (_, t) => t?.menu?.systemMonitor || 'System Monitor',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemMonitor],
    path: '/system/monitor',
    permissions: '/api/v1/system/monitor/*:*',
  },
  {
    id: 'tenant-management',
    component: () => import('../../modules/tenant/views/tenant_management').then((m) => ({ default: m.TenantManagement })),
    label: (_, t) => t?.menu?.tenantManagement || 'Tenant Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.tenantManagement],
    path: '/system/tenant-management',
    permissions: ['/api/v1/tenants/*:*', '/api/v1/tenant/*:*'],
  },
  {
    id: 'profile-center',
    component: () => import('../../modules/auth/profile/profile_center').then((m) => ({ default: m.ProfileCenter })),
    label: (_, t) => t?.menu?.profile || 'Profile Center',
    breadcrumbPath: () => [],
    path: '/profile',
  },
  {
    id: 'account-settings',
    component: () => import('../../modules/auth/profile/account_settings').then((m) => ({ default: m.AccountSettings })),
    label: (_, t) => t?.topBar?.accountSettings || 'Account Settings',
    breadcrumbPath: (t) => [t?.topBar?.profile, t?.topBar?.accountSettings],
    path: '/profile/settings',
  },
  {
    id: 'deploy-center',
    component: () => import('../../components/component_deploy').then((m) => ({ default: m.ComponentDeploy })),
    label: (_, t) => t?.menu?.deploy || 'Deployment',
    breadcrumbPath: (t) => [t?.menu?.deploy],
    path: '/deploy',
    permissions: ['deploy:view'],
  },
  {
    id: 'operations-center',
    component: () => import('../../components/operations').then((m) => ({ default: m.Operations })),
    label: (_, t) => t?.menu?.operations || 'Operations',
    breadcrumbPath: (t) => [t?.menu?.operations],
    path: '/operations',
    permissions: ['ops:view'],
  },
  {
    id: 'notification-center',
    component: () => import('../../modules/notification/views/notification_center').then((m) => ({ default: m.NotificationCenter })),
    label: (_, t) => t?.notification?.title || 'Notification Center',
    breadcrumbPath: (t) => [t?.notification?.title || 'Notification Center'],
    path: '/notifications',
  },
];

export const getViewConfig = (viewId: string): ViewConfig | undefined => {
  return VIEWS_CONFIG.find((config) => config.id === viewId);
};

export const COMPONENT_VIEW_LOADERS: Record<string, LazyViewLoader> = {
  'system/system_dashboard': () => import('../../modules/system/views/system_dashboard').then((m) => ({ default: m.SystemDashboard })),
  'system/user_management': () => import('../../modules/system/views/user_management').then((m) => ({ default: m.UserManagement })),
  'system/department_management': () => import('../../modules/system/views/department_management').then((m) => ({ default: m.DepartmentManagement })),
  'system/position_management': () => import('../../modules/system/views/position_management').then((m) => ({ default: m.PositionManagement })),
  'system/role_management': () => import('../../modules/system/views/role_management').then((m) => ({ default: m.RoleManagement })),
  'system/menu_management': () => import('../../modules/system/views/menu_management').then((m) => ({ default: m.MenuManagement })),
  'system/permission_management': () => import('../../modules/system/views/permission_management').then((m) => ({ default: m.PermissionManagement })),
  'system/unified_log_management': () => import('../../modules/system/views/unified_log_management').then((m) => ({ default: m.UnifiedLogManagement })),
  'system/system_settings': () => import('../../modules/system/views/system_settings').then((m) => ({ default: m.SystemSettings })),
  'system/data_dictionary': () => import('../../modules/system/views/data_dictionary').then((m) => ({ default: m.DataDictionary })),
  'system/system_monitor': () => import('../../modules/system/views/system_monitor').then((m) => ({ default: m.SystemMonitor })),
  'tenant/tenant_management': () => import('../../modules/tenant/views/tenant_management').then((m) => ({ default: m.TenantManagement })),
  'auth/profile_center': () => import('../../modules/auth/profile/profile_center').then((m) => ({ default: m.ProfileCenter })),
  'auth/account_settings': () => import('../../modules/auth/profile/account_settings').then((m) => ({ default: m.AccountSettings })),
  'auth/ProfileCenter': () => import('../../modules/auth/profile/profile_center').then((m) => ({ default: m.ProfileCenter })),
  'auth/AccountSettings': () => import('../../modules/auth/profile/account_settings').then((m) => ({ default: m.AccountSettings })),
};

export const STATIC_VIEW_ID_BY_COMPONENT: Record<string, string> = {
  'system/system_dashboard': 'system-dashboard',
  'system/user_management': 'system-users',
  'system/department_management': 'system-departments',
  'system/position_management': 'system-positions',
  'system/role_management': 'system-roles',
  'system/menu_management': 'system-menus',
  'system/permission_management': 'system-permissions',
  'system/unified_log_management': 'system-logs',
  'system/system_settings': 'system-settings',
  'system/data_dictionary': 'system-dictionary',
  'system/system_monitor': 'system-monitor',
  'tenant/tenant_management': 'tenant-management',
  'auth/profile_center': 'profile-center',
  'auth/account_settings': 'account-settings',
  'auth/ProfileCenter': 'profile-center',
  'auth/AccountSettings': 'account-settings',
  'notification/notification_center': 'notification-center',
};

const COMPONENT_ALIAS_MAP: Record<string, string> = {
  '/system': 'system/system_dashboard',
  '/system/index': 'system/system_dashboard',
  'system/SystemDashboard': 'system/system_dashboard',
  'system/UserManagement': 'system/user_management',
  'system/DepartmentManagement': 'system/department_management',
  'system/PositionManagement': 'system/position_management',
  'system/RoleManagement': 'system/role_management',
  'system/MenuManagement': 'system/menu_management',
  'system/PermissionManagement': 'system/permission_management',
  'system/DataDictionary': 'system/data_dictionary',
  'system/UnifiedLogManagement': 'system/unified_log_management',
  'system/SystemSettings': 'system/system_settings',
  'system/SystemMonitor': 'system/system_monitor',
  'tenant/TenantManagement': 'tenant/tenant_management',
  '/system/user/index': 'system/user_management',
  '/system/dept/index': 'system/department_management',
  '/system/department/index': 'system/department_management',
  '/system/position/index': 'system/position_management',
  '/system/role/index': 'system/role_management',
  '/system/menu/index': 'system/menu_management',
  '/system/permission/index': 'system/permission_management',
  '/system/dict/index': 'system/data_dictionary',
  '/system/log/index': 'system/unified_log_management',
  '/system/operation-log/index': 'system/unified_log_management',
  '/system/login-log/index': 'system/unified_log_management',
  '/system/settings/index': 'system/system_settings',
  '/system/monitor/index': 'system/system_monitor',
  '/tenant/index': 'tenant/tenant_management',
  '/profile/index': 'auth/ProfileCenter',
  '/profile/basic/index': 'auth/ProfileCenter',
  '/profile/password/index': 'auth/AccountSettings',
  '/profile/settings/index': 'auth/AccountSettings',
  '/notifications/index': 'notification/notification_center',
  '/notification/index': 'notification/notification_center',
};

const DEFAULT_COMPONENT_BY_PATH: Record<string, string> = {
  '/system': 'system/system_dashboard',
  '/system/user': 'system/user_management',
  '/system/dept': 'system/department_management',
  '/system/department': 'system/department_management',
  '/system/position': 'system/position_management',
  '/system/role': 'system/role_management',
  '/system/menu': 'system/menu_management',
  '/system/permission': 'system/permission_management',
  '/system/dict': 'system/data_dictionary',
  '/system/log': 'system/unified_log_management',
  '/system/operation-log': 'system/unified_log_management',
  '/system/login-log': 'system/unified_log_management',
  '/system/monitor': 'system/system_monitor',
  '/system/settings': 'system/system_settings',
  '/tenant': 'tenant/tenant_management',
  '/profile': 'auth/ProfileCenter',
  '/profile/basic': 'auth/ProfileCenter',
  '/profile/password': 'auth/AccountSettings',
  '/notifications': 'notification/notification_center',
  '/notification': 'notification/notification_center',
};

const STATIC_VIEW_ID_BY_PATH: Record<string, string> = {
  '/system/login-log': 'system-loginlog',
  '/profile/basic': 'profile-center',
  '/profile/password': 'account-settings',
  '/notifications': 'notification-center',
  '/notification': 'notification-center',
};

const STATIC_LABEL_BY_NAME: Record<string, string> = {
  System: 'system',
  User: 'systemUsers',
  Department: 'systemDepartments',
  Position: 'systemPositions',
  Role: 'systemRoles',
  Menu: 'systemMenus',
  Permission: 'systemPermissions',
  Dict: 'systemDictionary',
  OperationLog: 'systemLogs',
  LoginLog: 'loginLogs',
  Profile: 'profile',
  BasicInfo: 'profile',
  ChangePassword: 'accountSettings',
};

export const getViewConfigByComponent = (component?: string, fallbackId?: string): ViewConfig | undefined => {
  if (!component) return fallbackId ? getViewConfig(fallbackId) : undefined;
  const loader = COMPONENT_VIEW_LOADERS[component];
  if (!loader) return fallbackId ? getViewConfig(fallbackId) : undefined;

  return {
    id: fallbackId || component,
    component: loader,
  };
};

export const inferMenuComponent = (menu?: { component?: string; path?: string; code?: string }): string | undefined => {
  if (!menu) return undefined;
  if (menu.component) {
    return COMPONENT_ALIAS_MAP[menu.component] || menu.component;
  }
  if (menu.path && DEFAULT_COMPONENT_BY_PATH[menu.path]) return DEFAULT_COMPONENT_BY_PATH[menu.path];
  return undefined;
};

export const inferMenuViewId = (menu?: { id?: string | number; component?: string; path?: string; code?: string }): string | undefined => {
  if (!menu) return undefined;
  if (menu.path && STATIC_VIEW_ID_BY_PATH[menu.path]) {
    return STATIC_VIEW_ID_BY_PATH[menu.path];
  }
  const component = inferMenuComponent(menu);
  if (component && STATIC_VIEW_ID_BY_COMPONENT[component]) {
    return STATIC_VIEW_ID_BY_COMPONENT[component];
  }
  if (menu.id !== undefined && menu.id !== null) {
    return String(menu.id);
  }
  return menu.path || menu.code;
};

export const getViewLabel = (viewId: string, language: string, t?: AppTranslations): string => {
  const config = getViewConfig(viewId);
  return config?.label ? config.label(language, t) : viewId;
};

export const getViewBreadcrumbPath = (viewId: string, t?: AppTranslations): string[] => {
  const config = getViewConfig(viewId);
  return config?.breadcrumbPath ? config.breadcrumbPath(t) : [];
};

export const getViewPath = (viewId: string): string | undefined => {
  const config = getViewConfig(viewId);
  return config?.path;
};

export const getViewIdByPath = (path: string): string | undefined => {
  // 优先精确匹配
  const exactMatch = VIEWS_CONFIG.find((config) => config.path === path);
  if (exactMatch) return exactMatch.id;

  // 根路径特殊处理：/ 对应 dashboard
  if (path === '/') return 'dashboard';

  // 尝试去除前导斜杠匹配
  const withoutSlash = path.startsWith('/') ? path.slice(1) : path;
  return VIEWS_CONFIG.find((config) => config.path === withoutSlash)?.id;
};

export const getMenuLabel = (menu: MenuLike | undefined, language: string, t?: AppTranslations): string => {
  if (!menu) return '';

  if (language === 'zh' && menu.title?.trim()) {
    return menu.title.trim();
  }

  if (language === 'en' && menu.name?.trim()) {
    return menu.name.trim();
  }

  const viewId = inferMenuViewId(menu);
  if (viewId) {
    const label = getViewLabel(viewId, language, t);
    if (label && label !== viewId) {
      return label;
    }
  }

  const nameKey = menu.name ? STATIC_LABEL_BY_NAME[menu.name] : undefined;
  if (nameKey === 'loginLogs') {
    return t?.systemManagement?.loginLogs || (language === 'zh' ? '登录日志' : 'Login Logs');
  }
  if (nameKey) {
    return t?.menu?.[nameKey] || t?.topBar?.[nameKey] || t?.notification?.[nameKey] || menu.title || menu.name || '';
  }

  return menu.title?.trim() || menu.name?.trim() || viewId || '';
};




