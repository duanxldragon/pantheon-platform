-- ========================================
-- Pantheon Platform - 双因子认证表
-- ========================================
-- 说明：此脚本用于添加 2FA 相关表
-- 数据库：pantheon_tenant_{tenant_code}
-- 字符集：utf8mb4
-- ========================================

-- ========================================
-- 1. 双因子认证表 (two_factor_auth)
-- ========================================
DROP TABLE IF EXISTS two_factor_auth;

CREATE TABLE two_factor_auth (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '租户ID (UUID)',
    secret VARCHAR(255) NOT NULL COMMENT 'TOTP 密钥 (Base32)',
    enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否启用 2FA',
    backup_codes TEXT COMMENT '备份验证码 (逗号分隔)',
    created_at BIGINT NOT NULL COMMENT '创建时间 (毫秒时间戳)',
    updated_at BIGINT NOT NULL COMMENT '更新时间 (毫秒时间戳)',
    UNIQUE INDEX uk_user (user_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='双因子认证表';

-- ========================================
-- 初始化完成
-- ========================================
-- 执行后请检查表是否创建成功
-- SHOW TABLES;
-- SELECT * FROM two_factor_auth;
