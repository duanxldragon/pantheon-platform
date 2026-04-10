import { Navigate, RouteObject } from 'react-router-dom';

// 页面组件导入
import { Login } from '../modules/auth';
import { TenantSetupWizard } from '../modules/tenant';
import { MainLayout } from '../components/layouts/main_layout';
import { DashboardView } from '../modules/dashboard';
import { NotificationCenter } from '../modules/notification/views/notification_center';
import { UserManagement } from '../modules/system/views/user_management';
import { RoleManagement } from '../modules/system/views/role_management';
import { DepartmentManagement } from '../modules/system/views/department_management';
import { PositionManagement } from '../modules/system/views/position_management';
import { MenuManagement } from '../modules/system/views/menu_management';
import { PermissionManagement } from '../modules/system/views/permission_management';
import { DataDictionary } from '../modules/system/views/data_dictionary';
import { UnifiedLogManagement } from '../modules/system/views/unified_log_management';
import { SystemSettings } from '../modules/system/views/system_settings';
import { SystemMonitor } from '../modules/system/views/system_monitor';
import { TenantManagement } from '../modules/tenant/views/tenant_management';
import { AccountSettings, ProfileCenter } from '../modules/auth/profile';
import { ComponentDeploy } from '../components/component_deploy';
import { Operations } from '../components/operations';

// 路由守卫类型
export interface ProtectedRouteProps {
  isAuthenticated: boolean;
  tenantSetupRequired: boolean;
  enableMultiTenant: boolean;
  children: React.ReactNode;
}

// 路由配置
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/tenant-setup',
    element: <TenantSetupWizard />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardView />,
      },
      // 系统管理路由
      {
        path: 'system',
        children: [
          {
            path: 'user',
            element: <Navigate to="/system/users" replace />,
          },
          {
            path: 'tenant',
            element: <Navigate to="/system/tenant-management" replace />,
          },
          {
            path: 'role',
            element: <Navigate to="/system/roles" replace />,
          },
          {
            path: 'dept',
            element: <Navigate to="/system/departments" replace />,
          },
          {
            path: 'department',
            element: <Navigate to="/system/departments" replace />,
          },
          {
            path: 'position',
            element: <Navigate to="/system/positions" replace />,
          },
          {
            path: 'menu',
            element: <Navigate to="/system/menus" replace />,
          },
          {
            path: 'permission',
            element: <Navigate to="/system/permissions" replace />,
          },
          {
            path: 'dict',
            element: <Navigate to="/system/dictionaries" replace />,
          },
          {
            path: 'log',
            element: <Navigate to="/system/logs" replace />,
          },
          {
            path: 'operation-log',
            element: <Navigate to="/system/logs/operation" replace />,
          },
          {
            path: 'login-log',
            element: <Navigate to="/system/logs/login" replace />,
          },
          {
            path: 'users',
            element: <UserManagement />,
          },
          {
            path: 'tenant-management',
            element: <TenantManagement />,
          },
          {
            path: 'roles',
            element: <RoleManagement />,
          },
          {
            path: 'departments',
            element: <DepartmentManagement />,
          },
          {
            path: 'positions',
            element: <PositionManagement />,
          },
          {
            path: 'menus',
            element: <MenuManagement />,
          },
          {
            path: 'permissions',
            element: <PermissionManagement />,
          },
          {
            path: 'dictionaries',
            element: <DataDictionary />,
          },
          {
            path: 'logs',
            children: [
              {
                index: true,
                element: <UnifiedLogManagement />,
              },
              {
                path: 'operation',
                element: <UnifiedLogManagement />,
              },
              {
                path: 'login',
                element: <UnifiedLogManagement />,
              },
            ],
          },
          {
            path: 'settings',
            element: <SystemSettings />,
          },
          {
            path: 'monitor',
            element: <SystemMonitor />,
          },
        ],
      },
      // 用户中心路由
      {
        path: 'profile',
        element: <ProfileCenter />,
      },
      {
        path: 'profile/basic',
        element: <Navigate to="/profile" replace />,
      },
      {
        path: 'profile/password',
        element: <Navigate to="/profile/settings" replace />,
      },
      {
        path: 'profile/settings',
        element: <AccountSettings />,
      },
      {
        path: 'notifications',
        element: <NotificationCenter />,
      },
      {
        path: 'deploy',
        element: <ComponentDeploy />,
      },
      {
        path: 'operations',
        element: <Operations />,
      },
    ],
  },
  {
    path: '*',
    element: <div>404 - 页面未找到</div>,
  },
];
