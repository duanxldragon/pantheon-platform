-- ========================================
-- Pantheon Platform - Demo Tenants
-- ========================================
-- 说明：此脚本用于创建演示租户数据
-- 包含：企业租户、开发测试租户、演示租户
-- 数据库：pantheon_master
-- 字符集：utf8mb4
-- ========================================

-- ========================================
-- 1. 企业租户 (Enterprise)
-- ========================================
INSERT INTO tenants (
    id,
    name,
    code,
    status,
    contact_name,
    contact_email,
    contact_phone,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    'TechCorp Inc.',
    'enterprise',
    'active',
    '张伟',
    'zhangwei@techcorp.com',
    '+86-138-0000-0001',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 2. 开发测试租户 (Dev)
-- ========================================
INSERT INTO tenants (
    id,
    name,
    code,
    status,
    contact_name,
    contact_email,
    contact_phone,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000020',
    'Dev Test Environment',
    'dev',
    'active',
    '李明',
    'liming@dev-test.com',
    '+86-138-0000-0002',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 3. 演示租户 (Demo)
-- ========================================
INSERT INTO tenants (
    id,
    name,
    code,
    status,
    contact_name,
    contact_email,
    contact_phone,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000030',
    'Demo Company',
    'demo',
    'active',
    '王芳',
    'wangfang@demo.com',
    '+86-138-0000-0003',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 4. 暂停租户 (Suspended) - 测试状态
-- ========================================
INSERT INTO tenants (
    id,
    name,
    code,
    status,
    contact_name,
    contact_email,
    contact_phone,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000040',
    'Suspended Tenant',
    'suspended',
    'disabled',
    '刘强',
    'liuqiang@suspended.com',
    '+86-138-0000-0004',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 5. 待激活租户 (Pending) - 测试状态
-- ========================================
INSERT INTO tenants (
    id,
    name,
    code,
    status,
    contact_name,
    contact_email,
    contact_phone,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000050',
    'Pending Tenant',
    'pending',
    'pending',
    '陈静',
    'chenjing@pending.com',
    '+86-138-0000-0005',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
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
    'pantheon_user',
    'encrypted_password_here',
    200,
    20,
    3600,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
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
    'pantheon_user',
    'encrypted_password_here',
    50,
    10,
    1800,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
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
    'pantheon_user',
    'encrypted_password_here',
    50,
    5,
    3600,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 初始化完成
-- ========================================
-- 执行后请检查表是否创建成功
-- SELECT * FROM tenants WHERE code IN ('enterprise', 'dev', 'demo', 'suspended', 'pending');
-- SELECT * FROM tenant_database_configs WHERE tenant_id IN ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000030');
