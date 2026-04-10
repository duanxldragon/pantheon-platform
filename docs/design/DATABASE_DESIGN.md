# Pantheon Platform 数据库设计

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-07
- **数据库类型**: MySQL 8.0+
- **字符集**: UTF8MB4
- **排序规则**: utf8mb4_unicode_ci

## 🎯 数据库架构概述

### 数据库分离策略

```
┌─────────────────────────────────────────────────────────┐
│                  主数据库 (Master DB)                   │
│  pantheon_master                                        │
│  - 租户信息                                            │
│  - 租户数据库配置                                      │
│  - 系统配置                                            │
│  - 全局字典                                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              租户数据库群 (Tenant Databases)              │
│  pantheon_tenant_{tenant_id}                          │
│  - 用户数据                                            │
│  - 角色权限                                            │
│  - 业务数据                                            │
│  - 事务数据                                            │
└─────────────────────────────────────────────────────────┘
```

## 💾 主数据库设计

### 租户管理表

#### tenants (租户表)
```sql
CREATE TABLE tenants (
    id CHAR(36) PRIMARY KEY COMMENT '租户ID',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '租户代码',
    name VARCHAR(100) NOT NULL COMMENT '租户名称',
    status ENUM('active', 'suspended', 'frozen') DEFAULT 'active' COMMENT '状态',
    contact_name VARCHAR(50) COMMENT '联系人姓名',
    contact_email VARCHAR(100) COMMENT '联系人邮箱',
    contact_phone VARCHAR(20) COMMENT '联系人电话',
    
    -- 资源配额
    max_users INT DEFAULT 100 COMMENT '最大用户数',
    max_storage_gb INT DEFAULT 50 COMMENT '最大存储空间(GB)',
    max_api_calls_per_minute INT DEFAULT 1000 COMMENT 'API调用频率限制',
    
    -- 数据库配置
    db_host VARCHAR(255) COMMENT '数据库主机',
    db_port INT DEFAULT 3306 COMMENT '数据库端口',
    db_database VARCHAR(100) COMMENT '数据库名称',
    db_username VARCHAR(50) COMMENT '数据库用户名',
    db_password_encrypted TEXT COMMENT '加密的数据库密码',
    db_max_connections INT DEFAULT 50 COMMENT '最大连接数',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at TIMESTAMP NULL COMMENT '删除时间',
    
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户表';
```

#### tenant_databases (租户数据库配置表)
```sql
CREATE TABLE tenant_databases (
    id CHAR(36) PRIMARY KEY COMMENT '配置ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    
    -- 数据库连接信息
    database_type VARCHAR(20) DEFAULT 'mysql' COMMENT '数据库类型',
    host VARCHAR(255) NOT NULL COMMENT '主机地址',
    port INT NOT NULL COMMENT '端口',
    database_name VARCHAR(100) NOT NULL COMMENT '数据库名',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password_encrypted TEXT NOT NULL COMMENT '加密密码',
    
    -- 连接池配置
    max_open_conns INT DEFAULT 50 COMMENT '最大打开连接数',
    max_idle_conns INT DEFAULT 10 COMMENT '最大空闲连接数',
    conn_max_lifetime INT DEFAULT 3600 COMMENT '连接最大生命周期(秒)',
    
    -- 状态
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户数据库配置表';
```

### 系统配置表

#### system_configs (系统配置表)
```sql
CREATE TABLE system_configs (
    id CHAR(36) PRIMARY KEY COMMENT '配置ID',
    config_group VARCHAR(50) NOT NULL COMMENT '配置分组',
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type ENUM('string', 'int', 'float', 'boolean', 'json') DEFAULT 'string' COMMENT '配置类型',
    description TEXT COMMENT '配置描述',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统配置',
    is_encrypted BOOLEAN DEFAULT FALSE COMMENT '是否加密存储',
    validation_rule TEXT COMMENT '验证规则(JSON格式)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_group_key (config_group, config_key),
    INDEX idx_config_group (config_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';
```

#### data_dictionaries (数据字典表)
```sql
CREATE TABLE data_dictionaries (
    id CHAR(36) PRIMARY KEY COMMENT '字典ID',
    dict_type VARCHAR(50) NOT NULL COMMENT '字典类型',
    dict_code VARCHAR(50) NOT NULL COMMENT '字典代码',
    dict_label VARCHAR(100) NOT NULL COMMENT '字典标签',
    dict_value VARCHAR(200) COMMENT '字典值',
    parent_id CHAR(36) COMMENT '父级ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_type_code (dict_type, dict_code),
    INDEX idx_dict_type (dict_type),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据字典表';
```

## 👥 租户数据库设计

### 用户管理表

#### users (用户表)
```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY COMMENT '用户ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    
    -- 基本信息
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    avatar TEXT COMMENT '头像URL',
    
    -- 组织信息
    department_id CHAR(36) COMMENT '部门ID',
    position_id CHAR(36) COMMENT '职位ID',
    
    -- 状态信息
    status ENUM('active', 'inactive', 'locked') DEFAULT 'active' COMMENT '状态',
    
    -- 登录信息
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) COMMENT '最后登录IP',
    failed_login_attempts INT DEFAULT 0 COMMENT '失败登录次数',
    locked_until TIMESTAMP NULL COMMENT '锁定到期时间',
    password_changed_at TIMESTAMP NULL COMMENT '密码修改时间',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at TIMESTAMP NULL COMMENT '删除时间',
    
    UNIQUE KEY uk_tenant_username (tenant_id, username),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

#### roles (角色表)
```sql
CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY COMMENT '角色ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    
    -- 角色信息
    name VARCHAR(50) NOT NULL COMMENT '角色名称',
    code VARCHAR(50) NOT NULL COMMENT '角色代码',
    description TEXT COMMENT '角色描述',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统角色',
    is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认角色',
    
    -- 状态
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_tenant_code (tenant_id, code),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';
```

#### permissions (权限表)
```sql
CREATE TABLE permissions (
    id CHAR(36) PRIMARY KEY COMMENT '权限ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    
    -- 权限信息
    name VARCHAR(100) NOT NULL COMMENT '权限名称',
    code VARCHAR(100) NOT NULL COMMENT '权限代码',
    resource_type VARCHAR(50) NOT NULL COMMENT '资源类型',
    resource_id VARCHAR(100) COMMENT '资源ID',
    action VARCHAR(50) NOT NULL COMMENT '操作',
    description TEXT COMMENT '权限描述',
    
    -- 分组
    permission_group VARCHAR(50) COMMENT '权限分组',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_tenant_code (tenant_id, code),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_permission_group (permission_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';
```

#### role_permissions (角色权限关联表)
```sql
CREATE TABLE role_permissions (
    id CHAR(36) PRIMARY KEY COMMENT '关联ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    role_id CHAR(36) NOT NULL COMMENT '角色ID',
    permission_id CHAR(36) NOT NULL COMMENT '权限ID',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';
```

#### user_roles (用户角色关联表)
```sql
CREATE TABLE user_roles (
    id CHAR(36) PRIMARY KEY COMMENT '关联ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    user_id CHAR(36) NOT NULL COMMENT '用户ID',
    role_id CHAR(36) NOT NULL COMMENT '角色ID',
    
    is_primary BOOLEAN DEFAULT FALSE COMMENT '是否主角色',
    expires_at TIMESTAMP NULL COMMENT '过期时间',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    
    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';
```

### 组织架构表

#### departments (部门表)
```sql
CREATE TABLE departments (
    id CHAR(36) PRIMARY KEY COMMENT '部门ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    
    -- 部门信息
    name VARCHAR(50) NOT NULL COMMENT '部门名称',
    code VARCHAR(50) COMMENT '部门代码',
    parent_id CHAR(36) COMMENT '父级部门ID',
    level INT DEFAULT 1 COMMENT '部门层级',
    sort_order INT DEFAULT 0 COMMENT '排序',
    description TEXT COMMENT '部门描述',
    
    -- 状态
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';
```

#### positions (职位表)
```sql
CREATE TABLE positions (
    id CHAR(36) PRIMARY KEY COMMENT '职位ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    
    -- 职位信息
    name VARCHAR(50) NOT NULL COMMENT '职位名称',
    code VARCHAR(50) COMMENT '职位代码',
    level INT DEFAULT 1 COMMENT '职位层级',
    description TEXT COMMENT '职位描述',
    
    -- 状态
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='职位表';
```

## 🔐 安全相关表

#### operation_logs (操作日志表)
```sql
CREATE TABLE operation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    
    -- 用户信息
    user_id CHAR(36) NOT NULL COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    user_type VARCHAR(20) DEFAULT 'user' COMMENT '用户类型',
    
    -- 操作信息
    module VARCHAR(50) NOT NULL COMMENT '模块名称',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    method VARCHAR(10) COMMENT 'HTTP方法',
    url VARCHAR(500) COMMENT '请求URL',
    
    -- 执行结果
    status ENUM('success', 'failure', 'partial') NOT NULL COMMENT '执行状态',
    error_code VARCHAR(50) COMMENT '错误代码',
    error_message TEXT COMMENT '错误消息',
    
    -- 请求信息
    request_id VARCHAR(50) COMMENT '请求ID',
    client_ip VARCHAR(45) COMMENT '客户端IP',
    user_agent TEXT COMMENT '用户代理',
    
    -- 执行时间
    duration_ms INT COMMENT '执行时间(毫秒)',
    
    -- 业务数据
    business_data JSON COMMENT '业务数据',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';
```

#### login_logs (登录日志表)
```sql
CREATE TABLE login_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    tenant_id CHAR(36) NOT NULL COMMENT '租户ID',
    
    -- 用户信息
    user_id CHAR(36) COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    
    -- 登录信息
    login_type VARCHAR(20) DEFAULT 'password' COMMENT '登录类型',
    status ENUM('success', 'failure') NOT NULL COMMENT '登录状态',
    failure_reason VARCHAR(100) COMMENT '失败原因',
    
    -- 客户端信息
    ip VARCHAR(45) COMMENT 'IP地址',
    location VARCHAR(100) COMMENT '地理位置',
    browser VARCHAR(50) COMMENT '浏览器',
    os VARCHAR(50) COMMENT '操作系统',
    device VARCHAR(50) COMMENT '设备类型',
    
    -- 时间戳
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_login_at (login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录日志表';
```

## 📊 数据库性能优化

### 索引策略

#### 查询优化索引
```sql
-- 用户查询优化
CREATE INDEX idx_users_tenant_status 
ON users(tenant_id, status);

-- 角色查询优化
CREATE INDEX idx_roles_tenant_status 
ON roles(tenant_id, status);

-- 操作日志查询优化
CREATE INDEX idx_operation_logs_user_time 
ON operation_logs(user_id, created_at);

-- 登录日志查询优化
CREATE INDEX idx_login_logs_user_time 
ON login_logs(user_id, login_at);
```

#### 复合索引设计
```sql
-- 租户用户唯一索引
CREATE UNIQUE INDEX uk_users_username 
ON users(tenant_id, username);

-- 用户角色查询索引
CREATE INDEX idx_user_roles_tenant_user 
ON user_roles(tenant_id, user_id);

-- 部门层级查询索引
CREATE INDEX idx_departments_tenant_parent 
ON departments(tenant_id, parent_id);
```

### 分区策略

#### 操作日志分区
```sql
-- 按月分区操作日志
ALTER TABLE operation_logs 
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202601 VALUES LESS THAN (202602),
    PARTITION p202602 VALUES LESS THAN (202603),
    PARTITION p202603 VALUES LESS THAN (202604),
    PARTITION p202604 VALUES LESS THAN (202605),
    PARTITION p202605 VALUES LESS THAN (202606),
    PARTITION p202606 VALUES LESS THAN (202607),
    PARTITION p202607 VALUES LESS THAN (202608),
    PARTITION p202608 VALUES LESS THAN (202609),
    PARTITION p202609 VALUES LESS THAN (202610),
    PARTITION p202610 VALUES LESS THAN (202611),
    PARTITION p202611 VALUES LESS THAN (202612),
    PARTITION p202612 VALUES LESS THAN (202701),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 数据备份策略

#### 备份配置
```yaml
主数据库备份:
  全量备份: 每日凌晨2点
  增量备份: 每小时
  保留策略: 
    - 每日备份: 保留30天
    - 每周备份: 保留90天
    - 每月备份: 保留365天

租户数据库备份:
  全量备份: 每日凌晨3点
  增量备份: 每2小时
  保留策略:
    - 每日备份: 保留7天
    - 每周备份: 保留30天
```

## 🔍 数据完整性约束

### 外键约束
```sql
-- 级联删除示例
ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_user 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE;

-- 级联更新示例
ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_role 
FOREIGN KEY (role_id) REFERENCES roles(id) 
ON UPDATE CASCADE;
```

### 检查约束
```sql
-- 用户状态检查
ALTER TABLE users 
ADD CONSTRAINT chk_users_status 
CHECK (status IN ('active', 'inactive', 'locked'));

-- 租户状态检查
ALTER TABLE tenants 
ADD CONSTRAINT chk_tenants_status 
CHECK (status IN ('active', 'suspended', 'frozen'));

-- 配置类型检查
ALTER TABLE system_configs 
ADD CONSTRAINT chk_system_configs_type 
CHECK (config_type IN ('string', 'int', 'float', 'boolean', 'json'));
```

### 触发器
```sql
-- 用户状态变更日志
DELIMITER //
CREATE TRIGGER trg_user_status_change
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO operation_logs (
            tenant_id, user_id, username, module, action, status
        ) VALUES (
            NEW.tenant_id, NEW.id, NEW.username, 'user', 'status_change', 'success'
        );
    END IF;
END//
DELIMITER ;
```

## 📈 数据库监控

### 性能监控指标
```sql
-- 慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- 连接数监控
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- 表锁监控
SHOW OPEN TABLES WHERE In_use > 0;
```

### 数据库健康检查
```sql
-- 表空间使用情况
SELECT 
    table_schema AS 'database',
    table_name AS 'table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'size_mb'
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema')
ORDER BY (data_length + index_length) DESC;
```

---

**数据库版本**: MySQL 8.0+  
**字符集**: UTF8MB4  
**存储引擎**: InnoDB  
**备份策略**: 每日全量 + 每小时增量