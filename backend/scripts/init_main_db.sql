-- ========================================
-- Pantheon Platform V2 - 主数据库初始化脚本
-- ========================================
-- 说明：此脚本用于初始化系统主数据库，包含租户相关表
-- 数据库：pantheon_master
-- 字符集：utf8mb4
-- ========================================

-- ========================================
-- 1. 租户表 (tenants)
-- ========================================
DROP TABLE IF EXISTS tenant_database_configs;
DROP TABLE IF EXISTS tenants;

CREATE TABLE tenants (
    id VARCHAR(36) PRIMARY KEY COMMENT '租户ID (UUID)',
    name VARCHAR(100) NOT NULL COMMENT '租户名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '租户代码 (唯一标识)',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending/active/suspended',
    logo VARCHAR(255) COMMENT '租户LOGO URL',
    contact_name VARCHAR(50) COMMENT '联系人姓名',
    contact_email VARCHAR(100) COMMENT '联系人邮箱',
    contact_phone VARCHAR(20) COMMENT '联系人电话',
    expired_at BIGINT COMMENT '过期时间 (毫秒时间戳)',
    activated_at BIGINT COMMENT '激活时间 (毫秒时间戳)',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    deleted_at BIGINT COMMENT '删除时间 (毫秒时间戳，软删除)',
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户表';

-- ========================================
-- 2. 租户数据库配置表 (tenant_database_configs)
-- ========================================
CREATE TABLE tenant_database_configs (
    id VARCHAR(36) PRIMARY KEY COMMENT '配置ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL UNIQUE COMMENT '租户ID',
    db_type VARCHAR(20) NOT NULL COMMENT '数据库类型: mysql/postgresql/sqlite/sqlserver',
    host VARCHAR(255) NOT NULL COMMENT '数据库主机地址',
    port INT NOT NULL COMMENT '端口号',
    database VARCHAR(100) NOT NULL COMMENT '数据库名称',
    username VARCHAR(100) NOT NULL COMMENT '数据库用户名',
    password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    ssl_mode VARCHAR(20) COMMENT 'SSL 模式: disabled/required/verify-ca',
    max_open_conns INT DEFAULT 100 COMMENT '最大打开连接数',
    max_idle_conns INT DEFAULT 10 COMMENT '最大空闲连接数',
    conn_max_lifetime INT DEFAULT 3600 COMMENT '连接最大生命周期(秒)',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户数据库配置表';

-- ========================================
-- 3. 初始化平台租户数据
-- ========================================
INSERT INTO tenants (
    id,
    name,
    code,
    status,
    contact_name,
    contact_email,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Pantheon Platform',
    'platform',
    'active',
    'System Administrator',
    'admin@pantheon-platform.com',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 4. 创建初始平台租户数据库配置 (示例)
-- ========================================
-- 注意：这里只插入示例，实际配置需要根据真实环境修改
INSERT INTO tenant_database_configs (
    id,
    tenant_id,
    db_type,
    host,
    port,
    database,
    username,
    password,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'mysql',
    'localhost',
    3306,
    'pantheon_master',
    'root',
    '',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 5. 创建索引优化查询性能
-- ========================================
-- 复合索引：按状态和删除时间查询租户
CREATE INDEX idx_tenant_status_deleted ON tenants(status, deleted_at);

-- ========================================
-- 初始化完成
-- ========================================
-- 执行后请检查表是否创建成功
-- SHOW TABLES;
-- SELECT * FROM tenants;
