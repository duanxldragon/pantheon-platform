-- ========================================
-- Pantheon Platform - Demo Roles
-- ========================================
-- 说明：此脚本用于创建演示角色
-- 包含：超级管理员、部门管理员、普通用户、访客等
-- 数据库：pantheon_tenant_{tenant_code}
-- 使用方法：替换 {tenant_id} 为实际的租户ID
-- 字符集：utf8mb4
-- ========================================

-- ========================================
-- Enterprise租户角色
-- 租户ID: 00000000-0000-0000-0000-000000000010
-- ========================================

-- 角色已由 init_tenant_db.sql 创建，这里创建额外角色

-- 研发总监
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002001',
    '{tenant_id}',
    '研发总监',
    'rd_director',
    '研发部门总监，管理所有研发相关事务',
    'active',
    'custom',
    FALSE,
    2,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 产品经理
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002010',
    '{tenant_id}',
    '产品经理',
    'product_manager',
    '产品经理，负责产品规划与需求分析',
    'active',
    'custom',
    FALSE,
    3,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 前端开发工程师
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002020',
    '{tenant_id}',
    '前端开发工程师',
    'frontend_developer',
    '前端开发工程师，负责Web前端开发',
    'active',
    'custom',
    FALSE,
    4,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 后端开发工程师
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002030',
    '{tenant_id}',
    '后端开发工程师',
    'backend_developer',
    '后端开发工程师，负责服务端开发',
    'active',
    'custom',
    FALSE,
    5,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 测试工程师
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002040',
    '{tenant_id}',
    '测试工程师',
    'qa_engineer',
    '测试工程师，负责质量保证与测试',
    'active',
    'custom',
    FALSE,
    6,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- UI/UX设计师
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002050',
    '{tenant_id}',
    'UI/UX设计师',
    'ui_ux_designer',
    'UI/UX设计师，负责界面与用户体验设计',
    'active',
    'custom',
    FALSE,
    7,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 销售经理
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002060',
    '{tenant_id}',
    '销售经理',
    'sales_manager',
    '销售经理，负责销售业务管理',
    'active',
    'custom',
    FALSE,
    8,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- HR专员
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002070',
    '{tenant_id}',
    'HR专员',
    'hr_specialist',
    '人力资源专员，负责人事管理',
    'active',
    'custom',
    FALSE,
    9,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 财务专员
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002080',
    '{tenant_id}',
    '财务专员',
    'finance_specialist',
    '财务专员，负责财务管理',
    'active',
    'custom',
    FALSE,
    10,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 普通员工
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002090',
    '{tenant_id}',
    '普通员工',
    'employee',
    '普通员工，基本权限',
    'active',
    'custom',
    FALSE,
    11,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 访客
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002100',
    '{tenant_id}',
    '访客',
    'guest',
    '访客角色，只读权限',
    'active',
    'custom',
    FALSE,
    12,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- Dev租户角色
-- 租户ID: 00000000-0000-0000-0000-000000000020
-- ========================================

-- 开发人员
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000003001',
    '{tenant_id}',
    '开发人员',
    'developer',
    '开发人员，完整开发权限',
    'active',
    'custom',
    FALSE,
    2,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- 测试人员
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000003010',
    '{tenant_id}',
    '测试人员',
    'tester',
    '测试人员，测试权限',
    'active',
    'custom',
    FALSE,
    3,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- Demo租户角色
-- 租户ID: 00000000-0000-0000-0000-000000000030
-- ========================================

-- 演示用户
INSERT INTO system_roles (
    id, tenant_id, name, code, description, status, type, is_system, sort,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000004001',
    '{tenant_id}',
    '演示用户',
    'demo_user',
    '演示用户，基本权限',
    'active',
    'custom',
    FALSE,
    2,
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 初始化完成
-- ========================================
-- 执行后请检查角色是否创建成功
-- SELECT * FROM system_roles WHERE tenant_id = '{tenant_id}' ORDER BY sort;
