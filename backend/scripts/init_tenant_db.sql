-- ========================================
-- Pantheon Platform V2 - 租户业务数据库初始化脚本
-- ========================================
-- 说明：此脚本用于初始化租户业务数据库，包含用户、角色、权限等核心表
-- 数据库：pantheon_tenant_{tenant_code}
-- 字符集：utf8mb4
-- 使用方法：替换 {tenant_id} 为实际的租户ID
-- ========================================

-- ========================================
-- 1. 用户表 (users)
-- ========================================
DROP TABLE IF EXISTS sys_user_roles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY COMMENT '用户ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱地址',
    phone VARCHAR(20) COMMENT '手机号码',
    gender VARCHAR(10) COMMENT '性别: male/female/other',
    avatar VARCHAR(255) COMMENT '头像URL',
    status VARCHAR(20) NOT NULL DEFAULT 'inactive' COMMENT '状态: active/inactive/locked',
    department_id VARCHAR(36) COMMENT '部门ID',
    position_id VARCHAR(36) COMMENT '岗位ID',
    remark TEXT COMMENT '备注信息',
    last_login_at BIGINT COMMENT '最后登录时间 (毫秒时间戳)',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    deleted_at BIGINT COMMENT '删除时间 (毫秒时间戳，软删除)',
    UNIQUE INDEX uk_username (username),
    UNIQUE INDEX uk_email (email),
    INDEX idx_status (status),
    INDEX idx_department_id (department_id),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ========================================
-- 2. 角色表 (sys_roles)
-- ========================================
DROP TABLE IF EXISTS sys_role_permissions;
DROP TABLE IF EXISTS sys_role_menus;
DROP TABLE IF EXISTS sys_roles;

CREATE TABLE sys_roles (
    id VARCHAR(36) PRIMARY KEY COMMENT '角色ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    name VARCHAR(50) NOT NULL COMMENT '角色名称',
    code VARCHAR(50) NOT NULL COMMENT '角色代码',
    description TEXT COMMENT '角色描述',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active/inactive',
    is_system BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否系统内置角色',
    data_scope VARCHAR(20) NOT NULL DEFAULT 'all' COMMENT '数据范围: all/dept/dept_and_sub/self/custom',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序号',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    deleted_at BIGINT COMMENT '删除时间 (毫秒时间戳，软删除)',
    UNIQUE INDEX uk_code (code),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ========================================
-- 3. 权限表 (sys_permissions)
-- ========================================
DROP TABLE IF EXISTS sys_permissions;

CREATE TABLE sys_permissions (
    id VARCHAR(36) PRIMARY KEY COMMENT '权限ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    code VARCHAR(100) NOT NULL COMMENT '权限代码 (如: system:user:create)',
    name VARCHAR(50) NOT NULL COMMENT '权限名称',
    type VARCHAR(20) NOT NULL COMMENT '类型: menu/button/api',
    module VARCHAR(50) COMMENT '所属模块',
    resource VARCHAR(50) COMMENT '资源名称',
    action VARCHAR(50) COMMENT '操作名称',
    path VARCHAR(255) COMMENT 'API路径',
    method VARCHAR(10) COMMENT 'HTTP方法: GET/POST/PUT/DELETE',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active/inactive',
    description TEXT COMMENT '权限描述',
    parent_id VARCHAR(36) COMMENT '父权限ID',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序号',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    deleted_at BIGINT COMMENT '删除时间 (毫秒时间戳，软删除)',
    UNIQUE INDEX uk_code (code),
    INDEX idx_type (type),
    INDEX idx_module (module),
    INDEX idx_parent_id (parent_id),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- ========================================
-- 4. 用户角色关联表 (sys_user_roles)
-- ========================================
CREATE TABLE sys_user_roles (
    id VARCHAR(36) PRIMARY KEY COMMENT '关联ID (UUID)',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    role_id VARCHAR(36) NOT NULL COMMENT '角色ID',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    UNIQUE INDEX uk_user_role (user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ========================================
-- 5. 角色权限关联表 (sys_role_permissions)
-- ========================================
CREATE TABLE sys_role_permissions (
    id VARCHAR(36) PRIMARY KEY COMMENT '关联ID (UUID)',
    role_id VARCHAR(36) NOT NULL COMMENT '角色ID',
    permission_id VARCHAR(36) NOT NULL COMMENT '权限ID',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    UNIQUE INDEX uk_role_perm (role_id, permission_id),
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ========================================
-- 6. 部门表 (sys_departments)
-- ========================================
DROP TABLE IF EXISTS sys_departments;

CREATE TABLE sys_departments (
    id VARCHAR(36) PRIMARY KEY COMMENT '部门ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    name VARCHAR(50) NOT NULL COMMENT '部门名称',
    code VARCHAR(50) NOT NULL COMMENT '部门代码',
    parent_id VARCHAR(36) COMMENT '父部门ID',
    level INT NOT NULL DEFAULT 1 COMMENT '层级 (从1开始)',
    path VARCHAR(255) COMMENT '层级路径 (如: /1/2/3)',
    leader_id VARCHAR(36) COMMENT '部门负责人ID',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active/inactive',
    description TEXT COMMENT '部门描述',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序号',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    deleted_at BIGINT COMMENT '删除时间 (毫秒时间戳，软删除)',
    UNIQUE INDEX uk_code (code),
    INDEX idx_parent_id (parent_id),
    INDEX idx_level (level),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- ========================================
-- 7. 岗位表 (sys_positions)
-- ========================================
DROP TABLE IF EXISTS sys_positions;

CREATE TABLE sys_positions (
    id VARCHAR(36) PRIMARY KEY COMMENT '岗位ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    name VARCHAR(50) NOT NULL COMMENT '岗位名称',
    code VARCHAR(50) NOT NULL COMMENT '岗位代码',
    department_id VARCHAR(36) COMMENT '所属部门ID',
    level INT NOT NULL DEFAULT 1 COMMENT '岗位级别',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active/inactive',
    description TEXT COMMENT '岗位描述',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序号',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    deleted_at BIGINT COMMENT '删除时间 (毫秒时间戳，软删除)',
    UNIQUE INDEX uk_code (code),
    INDEX idx_department_id (department_id),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位表';

-- ========================================
-- 8. 菜单表 (sys_menus)
-- ========================================
DROP TABLE IF EXISTS sys_menus;

CREATE TABLE sys_menus (
    id VARCHAR(36) PRIMARY KEY COMMENT '菜单ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    name VARCHAR(50) NOT NULL COMMENT '菜单名称',
    title VARCHAR(50) NOT NULL COMMENT '菜单标题',
    icon VARCHAR(50) COMMENT '菜单图标',
    path VARCHAR(255) COMMENT '路由路径',
    component VARCHAR(255) COMMENT '组件路径',
    redirect VARCHAR(255) COMMENT '重定向路径',
    permission_code VARCHAR(100) COMMENT '关联权限代码',
    parent_id VARCHAR(36) COMMENT '父菜单ID',
    type VARCHAR(20) NOT NULL COMMENT '类型: menu/button/link',
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否隐藏',
    is_cached BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否缓存',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序号',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    deleted_at BIGINT COMMENT '删除时间 (毫秒时间戳，软删除)',
    INDEX idx_parent_id (parent_id),
    INDEX idx_permission_code (permission_code),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单表';

-- ========================================
-- 9. 角色菜单关联表 (sys_role_menus)
-- ========================================
CREATE TABLE sys_role_menus (
    id VARCHAR(36) PRIMARY KEY COMMENT '关联ID (UUID)',
    role_id VARCHAR(36) NOT NULL COMMENT '角色ID',
    menu_id VARCHAR(36) NOT NULL COMMENT '菜单ID',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    UNIQUE INDEX uk_role_menu (role_id, menu_id),
    INDEX idx_role_id (role_id),
    INDEX idx_menu_id (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色菜单关联表';

-- ========================================
-- 10. 操作日志表 (sys_operation_logs)
-- ========================================
DROP TABLE IF EXISTS sys_operation_logs;

CREATE TABLE sys_operation_logs (
    id VARCHAR(36) PRIMARY KEY COMMENT '日志ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    user_id VARCHAR(36) NOT NULL COMMENT '操作用户ID',
    username VARCHAR(50) NOT NULL COMMENT '操作用户名',
    module VARCHAR(50) COMMENT '操作模块',
    operation VARCHAR(50) NOT NULL COMMENT '操作类型',
    method VARCHAR(10) COMMENT 'HTTP方法',
    path VARCHAR(255) COMMENT '请求路径',
    ip VARCHAR(50) COMMENT '操作IP',
    user_agent VARCHAR(255) COMMENT '用户代理',
    request_data TEXT COMMENT '请求数据',
    response_code INT COMMENT '响应状态码',
    error_message TEXT COMMENT '错误信息',
    duration INT COMMENT '执行时长 (毫秒)',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_operation (operation),
    INDEX idx_created_at (created_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ========================================
-- 11. 登录日志表 (sys_login_logs)
-- ========================================
DROP TABLE IF EXISTS sys_login_logs;

CREATE TABLE sys_login_logs (
    id VARCHAR(36) PRIMARY KEY COMMENT '日志ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    login_type VARCHAR(20) NOT NULL COMMENT '登录类型: password/logout/token',
    ip VARCHAR(50) COMMENT '登录IP',
    location VARCHAR(100) COMMENT '登录地点',
    user_agent VARCHAR(255) COMMENT '用户代理',
    status VARCHAR(20) NOT NULL COMMENT '状态: success/failed',
    error_message VARCHAR(255) COMMENT '失败原因',
    created_at BIGINT NOT NULL COMMENT '登录时间 (毫秒时间戳)',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- ========================================
-- 12. 系统配置表 (sys_configs)
-- ========================================
DROP TABLE IF EXISTS sys_configs;

CREATE TABLE sys_configs (
    id VARCHAR(36) PRIMARY KEY COMMENT '配置ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type VARCHAR(20) NOT NULL COMMENT '类型: string/number/boolean/json',
    `group` VARCHAR(50) COMMENT '配置分组',
    description VARCHAR(255) COMMENT '配置描述',
    is_system BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否系统配置',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序号',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    UNIQUE INDEX uk_tenant_key (tenant_id, config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ========================================
-- 13. 字典类型表 (sys_dict_types)
-- ========================================
DROP TABLE IF EXISTS sys_dict_types;

CREATE TABLE sys_dict_types (
    id VARCHAR(36) PRIMARY KEY COMMENT '字典类型ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    dict_type VARCHAR(50) NOT NULL COMMENT '字典类型',
    dict_name VARCHAR(50) NOT NULL COMMENT '字典名称',
    description VARCHAR(255) COMMENT '字典描述',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active/inactive',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序号',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    deleted_at BIGINT COMMENT '删除时间 (毫秒时间戳，软删除)',
    UNIQUE INDEX uk_dict_type (dict_type),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典类型表';

-- ========================================
-- 14. 字典数据表 (sys_dict_data)
-- ========================================
DROP TABLE IF EXISTS sys_dict_data;

CREATE TABLE sys_dict_data (
    id VARCHAR(36) PRIMARY KEY COMMENT '字典数据ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID',
    dict_type VARCHAR(50) NOT NULL COMMENT '字典类型',
    dict_label VARCHAR(50) NOT NULL COMMENT '字典标签',
    dict_value VARCHAR(100) NOT NULL COMMENT '字典值',
    dict_sort INT NOT NULL DEFAULT 0 COMMENT '字典排序',
    css_class VARCHAR(50) COMMENT '样式类',
    list_class VARCHAR(50) COMMENT '列表类',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否默认',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active/inactive',
    remark VARCHAR(255) COMMENT '备注',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    deleted_at BIGINT COMMENT '删除时间 (毫秒时间戳，软删除)',
    INDEX idx_dict_type (dict_type),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典数据表';

-- ========================================
-- 15. Casbin权限规则表 (casbin_rule)
-- ========================================
DROP TABLE IF EXISTS casbin_rule;

CREATE TABLE casbin_rule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '规则ID',
    ptype VARCHAR(100) NOT NULL COMMENT '策略类型',
    v0 VARCHAR(255) NOT NULL COMMENT '策略值0',
    v1 VARCHAR(255) COMMENT '策略值1',
    v2 VARCHAR(255) COMMENT '策略值2',
    v3 VARCHAR(255) COMMENT '策略值3',
    v4 VARCHAR(255) COMMENT '策略值4',
    v5 VARCHAR(255) COMMENT '策略值5',
    INDEX idx_ptype (ptype),
    INDEX idx_v0 (v0),
    INDEX idx_v1 (v1),
    INDEX idx_v2 (v2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Casbin权限规则表';

-- ========================================
-- 16. 初始化超级管理员角色
-- ========================================
-- 注意：执行时需要替换 {tenant_id}
INSERT INTO sys_roles (
    id,
    tenant_id,
    name,
    code,
    description,
    status,
    is_system,
    data_scope,
    sort,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '{tenant_id}',
    '超级管理员',
    'super_admin',
    '系统内置超级管理员，拥有所有权限',
    'active',
    TRUE,
    'all',
    1,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 17. 初始化默认管理员用户
-- ========================================
-- 注意：执行时需要替换 {tenant_id} 和 {admin_password_hash}
INSERT INTO users (
    id,
    tenant_id,
    username,
    password,
    real_name,
    email,
    status,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '{tenant_id}',
    'admin',
    '{admin_password_hash}',
    '系统管理员',
    'admin@pantheon-platform.com',
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 18. 绑定管理员到超级管理员角色
-- ========================================
INSERT INTO sys_user_roles (
    id,
    user_id,
    role_id,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 初始化完成
-- ========================================
-- 请检查表是否创建成功
-- SHOW TABLES;
-- SELECT * FROM sys_roles;
-- SELECT * FROM users;
