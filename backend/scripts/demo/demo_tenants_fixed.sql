-- ========================================
-- Pantheon Platform - Demo Tenants (Fixed for actual schema)
-- ========================================
-- 说明：此脚本用于创建演示租户数据
-- 包含：企业租户、开发测试租户、演示租户
-- 数据库：pantheon_master
-- 字符集：utf8mb4
-- ========================================

-- ========================================
-- 1. 企业租户 (Enterprise)
-- ========================================
INSERT INTO tenant_info (
    id,
    name,
    code,
    status,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    'TechCorp Inc.',
    'enterprise',
    'active',
    NOW(3),
    NOW(3)
);

-- ========================================
-- 2. 开发测试租户 (Dev)
-- ========================================
INSERT INTO tenant_info (
    id,
    name,
    code,
    status,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000020',
    'Dev Test Environment',
    'dev',
    'active',
    NOW(3),
    NOW(3)
);

-- ========================================
-- 3. 演示租户 (Demo)
-- ========================================
INSERT INTO tenant_info (
    id,
    name,
    code,
    status,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000030',
    'Demo Company',
    'demo',
    'active',
    NOW(3),
    NOW(3)
);

-- ========================================
-- 4. 暂停租户 (Suspended) - 测试状态
-- ========================================
INSERT INTO tenant_info (
    id,
    name,
    code,
    status,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000040',
    'Suspended Tenant',
    'suspended',
    'disabled',
    NOW(3),
    NOW(3)
);

-- ========================================
-- 5. 待激活租户 (Pending) - 测试状态
-- ========================================
INSERT INTO tenant_info (
    id,
    name,
    code,
    status,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000050',
    'Pending Tenant',
    'pending',
    'pending',
    NOW(3),
    NOW(3)
);

-- ========================================
-- 创建租户数据库配置示例
-- ========================================

-- Enterprise租户配置
INSERT INTO tenant_database_configs (
    id,
    tenant_id,
    db_type,
    host,
    port,
    database,
    username,
    password,
    max_open_conns,
    max_idle_conns,
    conn_max_lifetime,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000010',
    'mysql',
    'localhost',
    3306,
    'pantheon_enterprise',
    'root',
    'encrypted_password_here',
    200,
    20,
    3600,
    NOW(3),
    NOW(3)
);

-- Dev租户配置
INSERT INTO tenant_database_configs (
    id,
    tenant_id,
    db_type,
    host,
    port,
    database,
    username,
    password,
    max_open_conns,
    max_idle_conns,
    conn_max_lifetime,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000020',
    'mysql',
    'localhost',
    3306,
    'pantheon_dev',
    'root',
    'encrypted_password_here',
    50,
    10,
    1800,
    NOW(3),
    NOW(3)
);

-- Demo租户配置
INSERT INTO tenant_database_configs (
    id,
    tenant_id,
    db_type,
    host,
    port,
    database,
    username,
    password,
    max_open_conns,
    max_idle_conns,
    conn_max_lifetime,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000030',
    'mysql',
    'localhost',
    3306,
    'pantheon_demo',
    'root',
    'encrypted_password_here',
    50,
    5,
    3600,
    NOW(3),
    NOW(3)
);

-- ========================================
-- 初始化完成
-- ========================================
-- 执行后请检查表是否创建成功
-- SELECT * FROM tenant_info WHERE code IN ('enterprise', 'dev', 'demo', 'suspended', 'pending');
-- SELECT * FROM tenant_database_configs WHERE tenant_id IN ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000030');
