export type PermissionMatcher = string[];

const apiPermission = (path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE'): PermissionMatcher => [
  `${path}:${method}`,
  `${path}:${method.toLowerCase()}`,
];

const mergePermission = (
  code: string | null,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
): PermissionMatcher => (code ? [code, ...apiPermission(path, method)] : apiPermission(path, method));

export const systemPermissions = {
  dashboard: {
    query: ['/api/v1/system/*:*'],
  },
  user: {
    query: mergePermission('system:user:query', '/api/v1/system/users', 'GET'),
    create: mergePermission('system:user:create', '/api/v1/system/users', 'POST'),
    update: mergePermission('system:user:update', '/api/v1/system/users/:id', 'PUT'),
    delete: mergePermission('system:user:delete', '/api/v1/system/users/:id', 'DELETE'),
    export: mergePermission('system:user:export', '/api/v1/system/users/export', 'POST'),
  },
  role: {
    query: mergePermission('system:role:query', '/api/v1/system/roles', 'GET'),
    create: mergePermission('system:role:create', '/api/v1/system/roles', 'POST'),
    update: mergePermission('system:role:update', '/api/v1/system/roles/:id', 'PUT'),
    delete: mergePermission('system:role:delete', '/api/v1/system/roles/:id', 'DELETE'),
    assignPermission: mergePermission('system:role:assign-permission', '/api/v1/system/roles/:id/permissions', 'POST'),
    export: ['system:role:export', '/api/v1/system/roles:export'],
  },
  menu: {
    query: mergePermission('system:menu:query', '/api/v1/system/menus', 'GET'),
    create: mergePermission('system:menu:create', '/api/v1/system/menus', 'POST'),
    update: mergePermission('system:menu:update', '/api/v1/system/menus/:id', 'PUT'),
    delete: mergePermission('system:menu:delete', '/api/v1/system/menus/:id', 'DELETE'),
    export: ['system:menu:export', '/api/v1/system/menus:export'],
  },
  department: {
    query: mergePermission('system:department:query', '/api/v1/system/departments', 'GET'),
    create: mergePermission('system:department:create', '/api/v1/system/departments', 'POST'),
    update: mergePermission('system:department:update', '/api/v1/system/departments/:id', 'PUT'),
    delete: mergePermission('system:department:delete', '/api/v1/system/departments/:id', 'DELETE'),
    export: ['system:department:export', '/api/v1/system/departments:export'],
  },
  permission: {
    query: mergePermission('system:permission:query', '/api/v1/system/permissions', 'GET'),
    create: mergePermission('system:permission:create', '/api/v1/system/permissions', 'POST'),
    update: mergePermission('system:permission:update', '/api/v1/system/permissions/:id', 'PUT'),
    delete: mergePermission('system:permission:delete', '/api/v1/system/permissions/:id', 'DELETE'),
    export: ['system:permission:export', '/api/v1/system/permissions:export'],
  },
  position: {
    query: mergePermission(null, '/api/v1/system/positions', 'GET'),
    create: mergePermission(null, '/api/v1/system/positions', 'POST'),
    update: mergePermission(null, '/api/v1/system/positions/:id', 'PUT'),
    delete: mergePermission(null, '/api/v1/system/positions/:id', 'DELETE'),
    export: mergePermission(null, '/api/v1/system/positions/export', 'POST'),
  },
  dictionary: {
    query: ['/api/v1/system/dict/types:GET', '/api/v1/system/dict/data:GET'],
    create: ['/api/v1/system/dict/types:POST', '/api/v1/system/dict/data:POST'],
    update: ['/api/v1/system/dict/types/:id:PUT', '/api/v1/system/dict/data/:id:PUT'],
    delete: ['/api/v1/system/dict/types/:id:DELETE', '/api/v1/system/dict/data/:id:DELETE'],
    import: ['/api/v1/system/dict/types:POST', '/api/v1/system/dict/data:POST'],
    export: ['/api/v1/system/dict/types:GET', '/api/v1/system/dict/data:GET'],
  },
  settings: {
    query: mergePermission(null, '/api/v1/system/settings', 'GET'),
    update: ['/api/v1/system/settings/:key:PUT', '/api/v1/system/settings/batch:POST'],
    import: ['/api/v1/system/settings/:key:PUT', '/api/v1/system/settings/batch:POST'],
    export: mergePermission(null, '/api/v1/system/settings', 'GET'),
  },
  logs: {
    query: ['/api/v1/system/logs/login:GET', '/api/v1/system/logs/operation:GET'],
    clear: ['/api/v1/system/logs/login:DELETE', '/api/v1/system/logs/operation:DELETE'],
    export: ['/api/v1/system/logs/login:GET', '/api/v1/system/logs/operation:GET'],
  },
  monitor: {
    query: mergePermission(null, '/api/v1/system/monitor/overview', 'GET'),
    export: mergePermission(null, '/api/v1/system/monitor/overview', 'GET'),
  },
} as const;
