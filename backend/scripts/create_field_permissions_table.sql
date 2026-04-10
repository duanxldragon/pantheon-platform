-- 创建字段权限表
CREATE TABLE IF NOT EXISTS `system_field_permissions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `role_id` VARCHAR(36) NOT NULL,
  `table_name` VARCHAR(100) NOT NULL,
  `field_permissions` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_role_table` (`role_id`, `table_name`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_table_name` (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
