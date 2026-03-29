import type { ComponentType } from 'react';

export type LazyViewLoader = () => Promise<{ default: ComponentType<any> }>;

export interface ViewConfig {
  id: string;
  component: LazyViewLoader;
  label?: (language: string, t?: any) => string;
  breadcrumbPath?: (t?: any) => string[];
  path?: string;
  permissions?: string | readonly string[];
  roles?: string | readonly string[];
}

export const VIEWS_CONFIG: ViewConfig[] = [
  {
    id: 'system-dashboard',
    component: () => import('../../modules/system/views/SystemDashboard').then((m) => ({ default: m.SystemDashboard })),
    label: (_, t) => t?.menu?.systemOverview || 'System Overview',
    breadcrumbPath: () => [],
    permissions: '/api/v1/system/*:*',
  },
  {
    id: 'system-users',
    component: () => import('../../modules/system/views/UserManagement').then((m) => ({ default: m.UserManagement })),
    label: (_, t) => t?.menu?.systemUsers || 'User Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemUsers],
    permissions: '/api/v1/system/users:*',
  },
  {
    id: 'system-departments',
    component: () => import('../../modules/system/views/DepartmentManagement').then((m) => ({ default: m.DepartmentManagement })),
    label: (_, t) => t?.menu?.systemDepartments || 'Department Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemDepartments],
    permissions: '/api/v1/system/departments:*',
  },
  {
    id: 'system-positions',
    component: () => import('../../modules/system/views/PositionManagement').then((m) => ({ default: m.PositionManagement })),
    label: (_, t) => t?.menu?.systemPositions || 'Position Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemPositions],
    permissions: '/api/v1/system/positions:*',
  },
  {
    id: 'system-roles',
    component: () => import('../../modules/system/views/RoleManagement').then((m) => ({ default: m.RoleManagement })),
    label: (_, t) => t?.menu?.systemRoles || 'Role Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemRoles],
    permissions: '/api/v1/system/roles:*',
  },
  {
    id: 'system-menus',
    component: () => import('../../modules/system/views/MenuManagement').then((m) => ({ default: m.MenuManagement })),
    label: (_, t) => t?.menu?.systemMenus || 'Menu Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemMenus],
    permissions: '/api/v1/system/menus:*',
  },
  {
    id: 'system-permissions',
    component: () => import('../../modules/system/views/PermissionManagement').then((m) => ({ default: m.PermissionManagement })),
    label: (_, t) => t?.menu?.systemPermissions || 'Permission Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemPermissions],
    permissions: '/api/v1/system/permissions:*',
  },
  {
    id: 'system-logs',
    component: () => import('../../modules/system/views/UnifiedLogManagement').then((m) => ({ default: m.UnifiedLogManagement })),
    label: (_, t) => t?.menu?.systemLogManagement || 'Log Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemLogs],
    permissions: '/api/v1/system/logs/*:*',
  },
  {
    id: 'system-loginlog',
    component: () => import('../../modules/system/views/UnifiedLogManagement').then((m) => ({ default: m.UnifiedLogManagement })),
    label: (_, t) => t?.menu?.systemLogManagement || 'Log Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.loginLog || 'Login Log'],
    permissions: '/api/v1/system/logs/*:*',
  },
  {
    id: 'system-audit',
    component: () => import('../../modules/system/views/UnifiedLogManagement').then((m) => ({ default: m.UnifiedLogManagement })),
    label: (_, t) => t?.menu?.systemLogManagement || 'Log Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemAudit],
    permissions: '/api/v1/system/logs/*:*',
  },
  {
    id: 'system-settings',
    component: () => import('../../modules/system/views/SystemSettings').then((m) => ({ default: m.SystemSettings })),
    label: (_, t) => t?.menu?.systemSettings || 'System Settings',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemSettings],
    permissions: '/api/v1/system/settings:*',
  },
  {
    id: 'system-dictionary',
    component: () => import('../../modules/system/views/DataDictionary').then((m) => ({ default: m.DataDictionary })),
    label: (_, t) => t?.menu?.systemDictionary || 'Data Dictionary',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemDictionary],
    permissions: '/api/v1/system/dict/*:*',
  },
  {
    id: 'system-monitor',
    component: () => import('../../modules/system/views/SystemMonitor').then((m) => ({ default: m.SystemMonitor })),
    label: (_, t) => t?.menu?.systemMonitor || 'System Monitor',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.systemMonitor],
    permissions: '/api/v1/system/monitor/*:*',
  },
  {
    id: 'tenant-management',
    component: () => import('../../modules/tenant/views/TenantManagement').then((m) => ({ default: m.TenantManagement })),
    label: (_, t) => t?.menu?.tenantManagement || 'Tenant Management',
    breadcrumbPath: (t) => [t?.menu?.system, t?.menu?.tenantManagement],
    permissions: ['/api/v1/tenants/*:*', '/api/v1/tenant/*:*'],
  },
  {
    id: 'profile-center',
    component: () => import('../../modules/auth/profile/ProfileCenter').then((m) => ({ default: m.ProfileCenter })),
    label: (_, t) => t?.menu?.profile || 'Profile Center',
    breadcrumbPath: () => [],
  },
  {
    id: 'account-settings',
    component: () => import('../../modules/auth/profile/AccountSettings').then((m) => ({ default: m.AccountSettings })),
    label: (_, t) => t?.topBar?.accountSettings || 'Account Settings',
    breadcrumbPath: (t) => [t?.topBar?.profile, t?.topBar?.accountSettings],
  },
  {
    id: 'deploy-center',
    component: () => import('../../components/ComponentDeploy').then((m) => ({ default: m.ComponentDeploy })),
    label: (_, t) => t?.menu?.deploy || 'Deployment',
    breadcrumbPath: (t) => [t?.menu?.deploy],
    permissions: ['deploy:view'],
  },
  {
    id: 'operations-center',
    component: () => import('../../components/Operations').then((m) => ({ default: m.Operations })),
    label: (_, t) => t?.menu?.operations || 'Operations',
    breadcrumbPath: (t) => [t?.menu?.operations],
    permissions: ['ops:view'],
  },
];

export const getViewConfig = (viewId: string): ViewConfig | undefined => {
  return VIEWS_CONFIG.find((config) => config.id === viewId);
};

export const COMPONENT_VIEW_LOADERS: Record<string, LazyViewLoader> = {
  'system/SystemDashboard': () => import('../../modules/system/views/SystemDashboard').then((m) => ({ default: m.SystemDashboard })),
  'system/UserManagement': () => import('../../modules/system/views/UserManagement').then((m) => ({ default: m.UserManagement })),
  'system/DepartmentManagement': () => import('../../modules/system/views/DepartmentManagement').then((m) => ({ default: m.DepartmentManagement })),
  'system/PositionManagement': () => import('../../modules/system/views/PositionManagement').then((m) => ({ default: m.PositionManagement })),
  'system/RoleManagement': () => import('../../modules/system/views/RoleManagement').then((m) => ({ default: m.RoleManagement })),
  'system/MenuManagement': () => import('../../modules/system/views/MenuManagement').then((m) => ({ default: m.MenuManagement })),
  'system/PermissionManagement': () => import('../../modules/system/views/PermissionManagement').then((m) => ({ default: m.PermissionManagement })),
  'system/UnifiedLogManagement': () => import('../../modules/system/views/UnifiedLogManagement').then((m) => ({ default: m.UnifiedLogManagement })),
  'system/SystemSettings': () => import('../../modules/system/views/SystemSettings').then((m) => ({ default: m.SystemSettings })),
  'system/DataDictionary': () => import('../../modules/system/views/DataDictionary').then((m) => ({ default: m.DataDictionary })),
  'system/SystemMonitor': () => import('../../modules/system/views/SystemMonitor').then((m) => ({ default: m.SystemMonitor })),
  'tenant/TenantManagement': () => import('../../modules/tenant/views/TenantManagement').then((m) => ({ default: m.TenantManagement })),
  'auth/ProfileCenter': () => import('../../modules/auth/profile/ProfileCenter').then((m) => ({ default: m.ProfileCenter })),
  'auth/AccountSettings': () => import('../../modules/auth/profile/AccountSettings').then((m) => ({ default: m.AccountSettings })),
};

export const STATIC_VIEW_ID_BY_COMPONENT: Record<string, string> = {
  'system/SystemDashboard': 'system-dashboard',
  'system/UserManagement': 'system-users',
  'system/DepartmentManagement': 'system-departments',
  'system/PositionManagement': 'system-positions',
  'system/RoleManagement': 'system-roles',
  'system/MenuManagement': 'system-menus',
  'system/PermissionManagement': 'system-permissions',
  'system/UnifiedLogManagement': 'system-logs',
  'system/SystemSettings': 'system-settings',
  'system/DataDictionary': 'system-dictionary',
  'system/SystemMonitor': 'system-monitor',
  'tenant/TenantManagement': 'tenant-management',
  'auth/ProfileCenter': 'profile-center',
  'auth/AccountSettings': 'account-settings',
};

const DEFAULT_COMPONENT_BY_PATH: Record<string, string> = {
  '/system': 'system/SystemDashboard',
  '/system/user': 'system/UserManagement',
  '/system/dept': 'system/DepartmentManagement',
  '/system/department': 'system/DepartmentManagement',
  '/system/position': 'system/PositionManagement',
  '/system/role': 'system/RoleManagement',
  '/system/menu': 'system/MenuManagement',
  '/system/permission': 'system/PermissionManagement',
  '/system/dict': 'system/DataDictionary',
  '/system/log': 'system/UnifiedLogManagement',
  '/system/monitor': 'system/SystemMonitor',
  '/system/settings': 'system/SystemSettings',
  '/tenant': 'tenant/TenantManagement',
  '/profile': 'auth/ProfileCenter',
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
  if (menu.component) return menu.component;
  if (menu.path && DEFAULT_COMPONENT_BY_PATH[menu.path]) return DEFAULT_COMPONENT_BY_PATH[menu.path];
  return undefined;
};

export const inferMenuViewId = (menu?: { id?: string | number; component?: string; path?: string; code?: string }): string | undefined => {
  if (!menu) return undefined;
  const component = inferMenuComponent(menu);
  if (component && STATIC_VIEW_ID_BY_COMPONENT[component]) {
    return STATIC_VIEW_ID_BY_COMPONENT[component];
  }
  if (menu.id !== undefined && menu.id !== null) {
    return String(menu.id);
  }
  return menu.path || menu.code;
};

export const getViewLabel = (viewId: string, language: string, t?: any): string => {
  const config = getViewConfig(viewId);
  return config?.label ? config.label(language, t) : viewId;
};

export const getViewBreadcrumbPath = (viewId: string, t?: any): string[] => {
  const config = getViewConfig(viewId);
  return config?.breadcrumbPath ? config.breadcrumbPath(t) : [];
};
