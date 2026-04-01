-- ========================================
-- Pantheon Platform - Demo Menus & Permissions
-- ========================================
-- 说明：此脚本用于创建演示菜单和权限
-- 包含：系统管理菜单树、权限定义
-- 数据库：pantheon_tenant_{tenant_code}
-- 使用方法：替换 {tenant_id} 为实际的租户ID
-- 字符集：utf8mb4
-- ========================================

-- ========================================
-- Enterprise租户菜单
-- 租户ID: 00000000-0000-0000-0000-000000000010
-- ========================================

-- Level 1: 系统管理
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011001',
    '{tenant_id}',
    'System',
    '系统管理',
    'Settings',
    '/system',
    NULL,
    NULL,
    'menu',
    FALSE,
    TRUE,
    1,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 用户管理
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011010',
    '{tenant_id}',
    'User',
    '用户管理',
    'Users',
    '/system/user',
    '/system/user/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    1,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 3: 用户管理按钮权限
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES
('00000000-0000-0000-0000-000000011011', '{tenant_id}', 'UserAdd', '新增用户', NULL, NULL, NULL, '00000000-0000-0000-0000-000000011010', 'button', FALSE, TRUE, 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000011012', '{tenant_id}', 'UserEdit', '编辑用户', NULL, NULL, NULL, '00000000-0000-0000-0000-000000011010', 'button', FALSE, TRUE, 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000011013', '{tenant_id}', 'UserDelete', '删除用户', NULL, NULL, NULL, '00000000-0000-0000-0000-000000011010', 'button', FALSE, TRUE, 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000011014', '{tenant_id}', 'UserExport', '导出用户', NULL, NULL, NULL, '00000000-0000-0000-0000-000000011010', 'button', FALSE, TRUE, 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- Level 2: 角色管理
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011020',
    '{tenant_id}',
    'Role',
    '角色管理',
    'Shield',
    '/system/role',
    '/system/role/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    2,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 3: 角色管理按钮权限
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES
('00000000-0000-0000-0000-000000011021', '{tenant_id}', 'RoleAdd', '新增角色', NULL, NULL, NULL, '00000000-0000-0000-0000-000000011020', 'button', FALSE, TRUE, 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000011022', '{tenant_id}', 'RoleEdit', '编辑角色', NULL, NULL, NULL, '00000000-0000-0000-0000-000000011020', 'button', FALSE, TRUE, 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000011023', '{tenant_id}', 'RoleDelete', '删除角色', NULL, NULL, NULL, '00000000-0000-0000-0000-000000011020', 'button', FALSE, TRUE, 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000011024', '{tenant_id}', 'RoleAssignPerm', '分配权限', NULL, NULL, NULL, '00000000-0000-0000-0000-000000011020', 'button', FALSE, TRUE, 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- Level 2: 菜单管理
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011030',
    '{tenant_id}',
    'Menu',
    '菜单管理',
    'Menu',
    '/system/menu',
    '/system/menu/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    3,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 部门管理
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011040',
    '{tenant_id}',
    'Department',
    '部门管理',
    'Building2',
    '/system/department',
    '/system/department/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    4,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 岗位管理
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011045',
    '{tenant_id}',
    'Position',
    '岗位管理',
    'Briefcase',
    '/system/position',
    '/system/position/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    5,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 权限管理
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011050',
    '{tenant_id}',
    'Permission',
    '权限管理',
    'Key',
    '/system/permission',
    '/system/permission/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    6,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 字典管理
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011060',
    '{tenant_id}',
    'Dict',
    '字典管理',
    'BookOpen',
    '/system/dict',
    '/system/dict/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    7,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 操作日志
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011070',
    '{tenant_id}',
    'OperationLog',
    '操作日志',
    'FileText',
    '/system/operation-log',
    '/system/operation-log/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    8,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 登录日志
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011080',
    '{tenant_id}',
    'LoginLog',
    '登录日志',
    'LogIn',
    '/system/login-log',
    '/system/login-log/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    9,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 系统设置
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011090',
    '{tenant_id}',
    'Settings',
    '系统设置',
    'SlidersHorizontal',
    '/system/settings',
    '/system/settings/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    10,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 系统监控
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011100',
    '{tenant_id}',
    'Monitor',
    '系统监控',
    'Activity',
    '/system/monitor',
    '/system/monitor/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    11,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 租户管理
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011110',
    '{tenant_id}',
    'TenantManagement',
    '租户管理',
    'Building',
    '/tenant',
    '/tenant/index',
    '00000000-0000-0000-0000-000000011001',
    'menu',
    FALSE,
    TRUE,
    12,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 1: 个人中心
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011901',
    '{tenant_id}',
    'Profile',
    '个人中心',
    'User',
    '/profile',
    NULL,
    NULL,
    'menu',
    FALSE,
    TRUE,
    9,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 基本信息
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011910',
    '{tenant_id}',
    'BasicInfo',
    '基本信息',
    NULL,
    '/profile/basic',
    '/profile/basic/index',
    '00000000-0000-0000-0000-000000011901',
    'menu',
    FALSE,
    TRUE,
    1,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 修改密码
INSERT INTO system_menus (
    id, tenant_id, name, title, icon, path, component, parent_id, type,
    is_hidden, is_cached, sort, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000011920',
    '{tenant_id}',
    'ChangePassword',
    '修改密码',
    NULL,
    '/profile/password',
    '/profile/password/index',
    '00000000-0000-0000-0000-000000011901',
    'menu',
    FALSE,
    TRUE,
    2,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 权限定义
-- ========================================

-- 用户管理权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012001', '{tenant_id}', 'system:user:query', '查询用户', 'api', 'system', 'user', 'query', '/api/v1/system/users', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012002', '{tenant_id}', 'system:user:create', '创建用户', 'api', 'system', 'user', 'create', '/api/v1/system/users', 'POST', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012003', '{tenant_id}', 'system:user:update', '更新用户', 'api', 'system', 'user', 'update', '/api/v1/system/users/:id', 'PUT', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012004', '{tenant_id}', 'system:user:delete', '删除用户', 'api', 'system', 'user', 'delete', '/api/v1/system/users/:id', 'DELETE', 'active', 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012005', '{tenant_id}', 'system:user:export', '导出用户', 'api', 'system', 'user', 'export', '/api/v1/system/users/export', 'POST', 'active', 5, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 角色管理权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012010', '{tenant_id}', 'system:role:query', '查询角色', 'api', 'system', 'role', 'query', '/api/v1/system/roles', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012011', '{tenant_id}', 'system:role:create', '创建角色', 'api', 'system', 'role', 'create', '/api/v1/system/roles', 'POST', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012012', '{tenant_id}', 'system:role:update', '更新角色', 'api', 'system', 'role', 'update', '/api/v1/system/roles/:id', 'PUT', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012013', '{tenant_id}', 'system:role:delete', '删除角色', 'api', 'system', 'role', 'delete', '/api/v1/system/roles/:id', 'DELETE', 'active', 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012014', '{tenant_id}', 'system:role:assign-permission', '分配权限', 'api', 'system', 'role', 'assign-permission', '/api/v1/system/roles/:id/permissions', 'POST', 'active', 5, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 菜单管理权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012020', '{tenant_id}', 'system:menu:query', '查询菜单', 'api', 'system', 'menu', 'query', '/api/v1/system/menus', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012021', '{tenant_id}', 'system:menu:create', '创建菜单', 'api', 'system', 'menu', 'create', '/api/v1/system/menus', 'POST', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012022', '{tenant_id}', 'system:menu:update', '更新菜单', 'api', 'system', 'menu', 'update', '/api/v1/system/menus/:id', 'PUT', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012023', '{tenant_id}', 'system:menu:delete', '删除菜单', 'api', 'system', 'menu', 'delete', '/api/v1/system/menus/:id', 'DELETE', 'active', 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 部门管理权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012030', '{tenant_id}', 'system:department:query', '查询部门', 'api', 'system', 'department', 'query', '/api/v1/system/depts', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012031', '{tenant_id}', 'system:department:create', '创建部门', 'api', 'system', 'department', 'create', '/api/v1/system/depts', 'POST', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012032', '{tenant_id}', 'system:department:update', '更新部门', 'api', 'system', 'department', 'update', '/api/v1/system/depts/:id', 'PUT', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012033', '{tenant_id}', 'system:department:delete', '删除部门', 'api', 'system', 'department', 'delete', '/api/v1/system/depts/:id', 'DELETE', 'active', 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 岗位管理权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012034', '{tenant_id}', 'system:position:query', '查询岗位', 'api', 'system', 'position', 'query', '/api/v1/system/positions', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012035', '{tenant_id}', 'system:position:create', '创建岗位', 'api', 'system', 'position', 'create', '/api/v1/system/positions', 'POST', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012036', '{tenant_id}', 'system:position:update', '更新岗位', 'api', 'system', 'position', 'update', '/api/v1/system/positions/:id', 'PUT', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012037', '{tenant_id}', 'system:position:delete', '删除岗位', 'api', 'system', 'position', 'delete', '/api/v1/system/positions/:id', 'DELETE', 'active', 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 权限管理权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012040', '{tenant_id}', 'system:permission:query', '查询权限', 'api', 'system', 'permission', 'query', '/api/v1/system/permissions', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012041', '{tenant_id}', 'system:permission:create', '创建权限', 'api', 'system', 'permission', 'create', '/api/v1/system/permissions', 'POST', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012042', '{tenant_id}', 'system:permission:update', '更新权限', 'api', 'system', 'permission', 'update', '/api/v1/system/permissions/:id', 'PUT', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012043', '{tenant_id}', 'system:permission:delete', '删除权限', 'api', 'system', 'permission', 'delete', '/api/v1/system/permissions/:id', 'DELETE', 'active', 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 字典管理权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012050', '{tenant_id}', 'system:dict:query', '查询字典', 'api', 'system', 'dict', 'query', '/api/v1/system/dict/*', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012051', '{tenant_id}', 'system:dict:create', '创建字典', 'api', 'system', 'dict', 'create', '/api/v1/system/dict/*', 'POST', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012052', '{tenant_id}', 'system:dict:update', '更新字典', 'api', 'system', 'dict', 'update', '/api/v1/system/dict/*', 'PUT', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012053', '{tenant_id}', 'system:dict:delete', '删除字典', 'api', 'system', 'dict', 'delete', '/api/v1/system/dict/*', 'DELETE', 'active', 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 系统设置权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012054', '{tenant_id}', 'system:settings:query', '查询系统设置', 'api', 'system', 'settings', 'query', '/api/v1/system/settings', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012055', '{tenant_id}', 'system:settings:update', '更新系统设置', 'api', 'system', 'settings', 'update', '/api/v1/system/settings/:key', 'PUT', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012056', '{tenant_id}', 'system:settings:batch-update', '批量更新系统设置', 'api', 'system', 'settings', 'batch-update', '/api/v1/system/settings/batch', 'POST', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 日志管理权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012060', '{tenant_id}', 'system:log:operation:query', '查询操作日志', 'api', 'system', 'log', 'operation-query', '/api/v1/system/logs/operation', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012061', '{tenant_id}', 'system:log:login:query', '查询登录日志', 'api', 'system', 'log', 'login-query', '/api/v1/system/logs/login', 'GET', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 扩展模块权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012062', '{tenant_id}', 'system:log:operation:clear', '清空操作日志', 'api', 'system', 'log', 'operation-clear', '/api/v1/system/logs/operation', 'DELETE', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012063', '{tenant_id}', 'system:log:login:clear', '清空登录日志', 'api', 'system', 'log', 'login-clear', '/api/v1/system/logs/login', 'DELETE', 'active', 4, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012064', '{tenant_id}', 'system:monitor:query', '查看系统监控', 'api', 'system', 'monitor', 'query', '/api/v1/system/monitor/*', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012065', '{tenant_id}', 'tenant:management:all', '租户管理', 'api', 'tenant', 'tenant', 'manage', '/api/v1/tenants/*', '*', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 个人中心权限
INSERT INTO system_permissions (id, tenant_id, code, name, type, module, resource, action, path, method, status, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000012070', '{tenant_id}', 'user:profile:query', '查询个人信息', 'api', 'user', 'profile', 'query', '/api/v1/user/profile', 'GET', 'active', 1, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012071', '{tenant_id}', 'user:profile:update', '更新个人信息', 'api', 'user', 'profile', 'update', '/api/v1/user/profile', 'PUT', 'active', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000012072', '{tenant_id}', 'user:password:update', '修改密码', 'api', 'user', 'password', 'update', '/api/v1/user/password', 'PUT', 'active', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- ========================================
-- 角色菜单绑定
-- ========================================

-- 超级管理员拥有所有菜单
INSERT INTO system_role_menus (id, role_id, menu_id, tenant_id, created_at) VALUES
('00000000-0000-0000-0000-000000013001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011001', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013002', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011010', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013003', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011020', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013004', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011030', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013005', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011040', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013006', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011045', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013007', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011050', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013008', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011060', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013009', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011070', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013010', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011080', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013014', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011090', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013015', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011100', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013016', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011110', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013017', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011901', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013018', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011910', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013019', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000011920', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 普通员工只拥有个人中心
INSERT INTO system_role_menus (id, role_id, menu_id, tenant_id, created_at) VALUES
('00000000-0000-0000-0000-000000013011', '00000000-0000-0000-0000-000000002090', '00000000-0000-0000-0000-000000011901', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013012', '00000000-0000-0000-0000-000000002090', '00000000-0000-0000-0000-000000011910', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000013013', '00000000-0000-0000-0000-000000002090', '00000000-0000-0000-0000-000000011920', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000);

-- ========================================
-- 角色权限绑定
-- ========================================

-- 超级管理员拥有所有权限
INSERT INTO system_role_permissions (id, role_id, permission_id, tenant_id, created_at) VALUES
('00000000-0000-0000-0000-000000014001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012001', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014002', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012002', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014003', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012003', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014004', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012004', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014005', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012005', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014006', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012010', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014007', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012011', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014008', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012012', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014012', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012013', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014013', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012014', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014014', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012020', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014015', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012021', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014016', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012022', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014017', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012023', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014018', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012030', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014019', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012031', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014020', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012032', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014021', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012033', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014022', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012034', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014023', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012035', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014024', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012036', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014025', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012037', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014026', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012040', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014027', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012041', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014028', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012042', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014029', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012043', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014030', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012050', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014031', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012051', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014032', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012052', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014033', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012053', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014034', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012054', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014035', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012055', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014036', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012056', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014037', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012060', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014038', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012061', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014039', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012062', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014040', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012063', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014041', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012064', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014042', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012065', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014043', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012070', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014044', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012071', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014045', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000012072', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000);

-- 普通员工只有个人中心权限
INSERT INTO system_role_permissions (id, role_id, permission_id, tenant_id, created_at) VALUES
('00000000-0000-0000-0000-000000014009', '00000000-0000-0000-0000-000000002090', '00000000-0000-0000-0000-000000012070', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014010', '00000000-0000-0000-0000-000000002090', '00000000-0000-0000-0000-000000012071', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000014011', '00000000-0000-0000-0000-000000002090', '00000000-0000-0000-0000-000000012072', '{tenant_id}', UNIX_TIMESTAMP(NOW(3)) * 1000);

-- ========================================
-- Casbin权限策略 (简化版)
-- ========================================

-- 超级管理员拥有所有权限
INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES
('p', '00000000-0000-0000-0000-000000002001', '/api/v1/system/*', '*'),
('p', '00000000-0000-0000-0000-000000002001', '/api/v1/user/*', '*');

-- 角色分组
INSERT INTO casbin_rule (ptype, v0, v1) VALUES
('g', '00000000-0000-0000-0000-000000005001', '00000000-0000-0000-0000-000000002001'),
('g', '00000000-0000-0000-0000-000000005010', '00000000-0000-0000-0000-000000002010');

-- ========================================
-- 初始化完成
-- ========================================
-- 执行后请检查菜单树结构
-- SELECT * FROM system_menus WHERE tenant_id = '{tenant_id}' ORDER BY parent_id, sort;
-- SELECT * FROM system_permissions WHERE tenant_id = '{tenant_id}' ORDER BY sort;
-- SELECT * FROM system_role_menus WHERE tenant_id = '{tenant_id}';
-- SELECT * FROM system_role_permissions WHERE tenant_id = '{tenant_id}';
