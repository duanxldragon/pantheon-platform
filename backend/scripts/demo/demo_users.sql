-- ========================================
-- Pantheon Platform - Demo Users
-- ========================================
-- 说明：此脚本用于创建演示用户数据
-- 包含：不同状态、不同角色的用户
-- 数据库：pantheon_tenant_{tenant_code}
-- 使用方法：替换 {tenant_id} 为实际的租户ID
-- 字符集：utf8mb4
-- ========================================

-- ========================================
-- Enterprise租户用户
-- 租户ID: 00000000-0000-0000-0000-000000000010
-- ========================================

-- 1. 研发总监 (zhangsan)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005001',
    '{tenant_id}',
    'zhangsan',
    '张三',
    'zhangsan@techcorp.com',
    '+86-138-0001-0001',
    'male',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    'active',
    '00000000-0000-0000-0000-000000001010',
    '00000000-0000-0000-0000-000000007001',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 2. 产品经理 (lisi)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005010',
    '{tenant_id}',
    'lisi',
    '李四',
    'lisi@techcorp.com',
    '+86-138-0001-0002',
    'male',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
    'active',
    '00000000-0000-0000-0000-000000001020',
    '00000000-0000-0000-0000-000000007010',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 3. 前端开发工程师 (wangwu)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005020',
    '{tenant_id}',
    'wangwu',
    '王五',
    'wangwu@techcorp.com',
    '+86-138-0001-0003',
    'male',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
    'active',
    '00000000-0000-0000-0000-000000001011',
    '00000000-0000-0000-0000-000000007020',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 4. 后端开发工程师 (zhaoliu)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005030',
    '{tenant_id}',
    'zhaoliu',
    '赵六',
    'zhaoliu@techcorp.com',
    '+86-138-0001-0004',
    'male',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
    'active',
    '00000000-0000-0000-0000-000000001012',
    '00000000-0000-0000-0000-000000007030',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 5. 测试工程师 (sunqi)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005040',
    '{tenant_id}',
    'sunqi',
    '孙七',
    'sunqi@techcorp.com',
    '+86-138-0001-0005',
    'female',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=sunqi',
    'active',
    '00000000-0000-0000-0000-000000001013',
    '00000000-0000-0000-0000-000000007040',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 6. UI/UX设计师 (zhouba)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005050',
    '{tenant_id}',
    'zhouba',
    '周八',
    'zhouba@techcorp.com',
    '+86-138-0001-0006',
    'female',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouba',
    'active',
    '00000000-0000-0000-0000-000000001021',
    '00000000-0000-0000-0000-000000007050',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 7. 销售经理 (wujiu)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005060',
    '{tenant_id}',
    'wujiu',
    '吴九',
    'wujiu@techcorp.com',
    '+86-138-0001-0007',
    'male',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=wujiu',
    'active',
    '00000000-0000-0000-0000-000000001030',
    '00000000-0000-0000-0000-000000007060',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 8. HR专员 (zhengshi)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005070',
    '{tenant_id}',
    'zhengshi',
    '郑十',
    'zhengshi@techcorp.com',
    '+86-138-0001-0008',
    'female',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengshi',
    'active',
    '00000000-0000-0000-0000-000000001040',
    '00000000-0000-0000-0000-000000007070',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 9. 财务专员 (qianyi)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005080',
    '{tenant_id}',
    'qianyi',
    '钱一',
    'qianyi@techcorp.com',
    '+86-138-0001-0009',
    'male',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=qianyi',
    'active',
    '00000000-0000-0000-0000-000000001050',
    '00000000-0000-0000-0000-000000007080',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 10. 被锁定的用户 (locked_user)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005090',
    '{tenant_id}',
    'locked_user',
    '锁定用户',
    'locked@techcorp.com',
    '+86-138-0001-0010',
    'male',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=locked',
    'locked',
    '00000000-0000-0000-0000-000000001011',
    '00000000-0000-0000-0000-000000007020',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 11. 未激活的用户 (inactive_user)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000005100',
    '{tenant_id}',
    'inactive_user',
    '未激活用户',
    'inactive@techcorp.com',
    '+86-138-0001-0011',
    'female',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=inactive',
    'inactive',
    '00000000-0000-0000-0000-000000001012',
    '00000000-0000-0000-0000-000000007030',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 用户角色绑定 (Enterprise)
-- ========================================

-- 研发总监 -> rd_director
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000008001',
    '00000000-0000-0000-0000-000000005001',
    '00000000-0000-0000-0000-000000002001',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 产品经理 -> product_manager
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000008010',
    '00000000-0000-0000-0000-000000005010',
    '00000000-0000-0000-0000-000000002010',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 前端开发工程师 -> frontend_developer
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000008020',
    '00000000-0000-0000-0000-000000005020',
    '00000000-0000-0000-0000-000000002020',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 后端开发工程师 -> backend_developer
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000008030',
    '00000000-0000-0000-0000-000000005030',
    '00000000-0000-0000-0000-000000002030',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 测试工程师 -> qa_engineer
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000008040',
    '00000000-0000-0000-0000-000000005040',
    '00000000-0000-0000-0000-000000002040',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- UI/UX设计师 -> ui_ux_designer
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000008050',
    '00000000-0000-0000-0000-000000005050',
    '00000000-0000-0000-0000-000000002050',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 销售经理 -> sales_manager
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000008060',
    '00000000-0000-0000-0000-000000005060',
    '00000000-0000-0000-0000-000000002060',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- HR专员 -> hr_specialist
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000008070',
    '00000000-0000-0000-0000-000000005070',
    '00000000-0000-0000-0000-000000002070',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 财务专员 -> finance_specialist
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000008080',
    '00000000-0000-0000-0000-000000005080',
    '00000000-0000-0000-0000-000000002080',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- Dev租户用户
-- 租户ID: 00000000-0000-0000-0000-000000000020
-- ========================================

-- 开发人员 (dev_user)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000006001',
    '{tenant_id}',
    'dev_user',
    '开发用户',
    'dev@dev-test.com',
    '+86-138-0002-0001',
    'male',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
    'active',
    '00000000-0000-0000-0000-000000002010',
    '00000000-0000-0000-0000-000000007101',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 测试人员 (test_user)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000006010',
    '{tenant_id}',
    'test_user',
    '测试用户',
    'test@dev-test.com',
    '+86-138-0002-0002',
    'female',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    'active',
    '00000000-0000-0000-0000-000000002020',
    '00000000-0000-0000-0000-000000007102',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Dev用户角色绑定
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000009001',
    '00000000-0000-0000-0000-000000006001',
    '00000000-0000-0000-0000-000000003001',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000009010',
    '00000000-0000-0000-0000-000000006010',
    '00000000-0000-0000-0000-000000003010',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- Demo租户用户
-- 租户ID: 00000000-0000-0000-0000-000000000030
-- ========================================

-- 演示用户 (demo_user)
INSERT INTO system_users (
    id, tenant_id, username, real_name, email, phone, gender, avatar,
    status, department_id, position_id, password_hash, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000007001',
    '{tenant_id}',
    'demo_user',
    '演示用户',
    'demo@demo.com',
    '+86-138-0003-0001',
    'male',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    'active',
    '00000000-0000-0000-0000-000000003001',
    '00000000-0000-0000-0000-000000007201',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Demo用户角色绑定
INSERT INTO system_user_roles (id, user_id, role_id, created_at) VALUES (
    '00000000-0000-0000-0000-000000010001',
    '00000000-0000-0000-0000-000000007001',
    '00000000-0000-0000-0000-000000004001',
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 初始化完成
-- ========================================
-- 默认密码：admin123
-- 执行后请检查用户是否创建成功
-- SELECT * FROM system_users WHERE tenant_id = '{tenant_id}';
-- SELECT u.*, r.name as role_name FROM system_users u
-- LEFT JOIN system_user_roles ur ON u.id = ur.user_id
-- LEFT JOIN system_roles r ON ur.role_id = r.id
-- WHERE u.tenant_id = '{tenant_id}';
