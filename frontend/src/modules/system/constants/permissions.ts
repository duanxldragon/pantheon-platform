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

const extendPermission = (base: PermissionMatcher, ...aliases: string[]): PermissionMatcher =>
  Array.from(new Set([...base, ...aliases]));

export const systemPermissions = {
  dashboard: {
    query: ['/api/v1/system/*:*'],
  },
  user: {
    query: mergePermission('system:user:query', '/api/v1/system/users', 'GET'),
    create: mergePermission('system:user:create', '/api/v1/system/users', 'POST'),
    update: extendPermission(mergePermission('system:user:update', '/api/v1/system/users/:id', 'PUT'), '/api/v1/system/users:*'),
    delete: extendPermission(mergePermission('system:user:delete', '/api/v1/system/users/:id', 'DELETE'), '/api/v1/system/users:*'),
    export: extendPermission(mergePermission('system:user:export', '/api/v1/system/users/export', 'POST'), '/api/v1/system/users:*'),
  },
  role: {
    query: mergePermission('system:role:query', '/api/v1/system/roles', 'GET'),
    create: mergePermission('system:role:create', '/api/v1/system/roles', 'POST'),
    update: extendPermission(mergePermission('system:role:update', '/api/v1/system/roles/:id', 'PUT'), '/api/v1/system/roles:*'),
    delete: extendPermission(mergePermission('system:role:delete', '/api/v1/system/roles/:id', 'DELETE'), '/api/v1/system/roles:*'),
    assignPermission: extendPermission(mergePermission('system:role:assign-permission', '/api/v1/system/roles/:id/permissions', 'POST'), '/api/v1/system/roles:*'),
    export: ['system:role:export', '/api/v1/system/roles:export', '/api/v1/system/roles:*'],
  },
  menu: {
    query: mergePermission('system:menu:query', '/api/v1/system/menus', 'GET'),
    create: mergePermission('system:menu:create', '/api/v1/system/menus', 'POST'),
    update: extendPermission(mergePermission('system:menu:update', '/api/v1/system/menus/:id', 'PUT'), '/api/v1/system/menus:*'),
    delete: extendPermission(mergePermission('system:menu:delete', '/api/v1/system/menus/:id', 'DELETE'), '/api/v1/system/menus:*'),
    export: ['system:menu:export', '/api/v1/system/menus:export', '/api/v1/system/menus:*'],
  },
  department: {
    query: mergePermission('system:department:query', '/api/v1/system/depts', 'GET'),
    create: mergePermission('system:department:create', '/api/v1/system/depts', 'POST'),
    update: extendPermission(mergePermission('system:department:update', '/api/v1/system/depts/:id', 'PUT'), '/api/v1/system/depts:*'),
    delete: extendPermission(mergePermission('system:department:delete', '/api/v1/system/depts/:id', 'DELETE'), '/api/v1/system/depts:*'),
    export: ['system:department:export', '/api/v1/system/depts:export', '/api/v1/system/depts:*'],
  },
  permission: {
    query: mergePermission('system:permission:query', '/api/v1/system/permissions', 'GET'),
    create: mergePermission('system:permission:create', '/api/v1/system/permissions', 'POST'),
    update: extendPermission(mergePermission('system:permission:update', '/api/v1/system/permissions/:id', 'PUT'), '/api/v1/system/permissions:*'),
    delete: extendPermission(mergePermission('system:permission:delete', '/api/v1/system/permissions/:id', 'DELETE'), '/api/v1/system/permissions:*'),
    export: ['system:permission:export', '/api/v1/system/permissions:export', '/api/v1/system/permissions:*'],
  },
  position: {
    query: mergePermission(null, '/api/v1/system/positions', 'GET'),
    create: mergePermission(null, '/api/v1/system/positions', 'POST'),
    update: extendPermission(mergePermission(null, '/api/v1/system/positions/:id', 'PUT'), '/api/v1/system/positions:*'),
    delete: extendPermission(mergePermission(null, '/api/v1/system/positions/:id', 'DELETE'), '/api/v1/system/positions:*'),
    export: extendPermission(mergePermission(null, '/api/v1/system/positions/export', 'POST'), '/api/v1/system/positions:*'),
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
    update: ['/api/v1/system/settings/:key:PUT', '/api/v1/system/settings/batch:POST', '/api/v1/system/settings:*'],
    import: ['/api/v1/system/settings/:key:PUT', '/api/v1/system/settings/batch:POST', '/api/v1/system/settings:*'],
    export: extendPermission(mergePermission(null, '/api/v1/system/settings', 'GET'), '/api/v1/system/settings:*'),
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
