-- ========================================
-- Pantheon Platform - Demo Departments
-- ========================================
-- 说明：此脚本用于创建演示部门树结构
-- 包含：公司 -> 部门 -> 小组 三级结构
-- 数据库：pantheon_tenant_{tenant_code}
-- 使用方法：替换 {tenant_id} 为实际的租户ID
-- 字符集：utf8mb4
-- ========================================

-- ========================================
-- Enterprise租户部门结构
-- 租户ID: 00000000-0000-0000-0000-000000000010
-- ========================================

-- Level 1: 总部
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001001',
    '{tenant_id}',
    'TechCorp 总部',
    'HQ',
    '公司总部',
    NULL,
    1,
    1,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 研发中心
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001010',
    '{tenant_id}',
    '研发中心',
    'R&D',
    '产品研发与技术中心',
    '00000000-0000-0000-0000-000000001001',
    2,
    1,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 3: 前端开发组
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001011',
    '{tenant_id}',
    '前端开发组',
    'FRONTEND',
    'Web前端开发团队',
    '00000000-0000-0000-0000-000000001010',
    3,
    1,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 3: 后端开发组
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001012',
    '{tenant_id}',
    '后端开发组',
    'BACKEND',
    '服务端开发团队',
    '00000000-0000-0000-0000-000000001010',
    3,
    2,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 3: 测试组
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001013',
    '{tenant_id}',
    '测试组',
    'QA',
    '质量保证与测试团队',
    '00000000-0000-0000-0000-000000001010',
    3,
    3,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 产品部
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001020',
    '{tenant_id}',
    '产品部',
    'PRODUCT',
    '产品规划与设计部门',
    '00000000-0000-0000-0000-000000001001',
    2,
    2,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 3: 产品设计组
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001021',
    '{tenant_id}',
    '产品设计组',
    'UI/UX',
    '用户界面与体验设计团队',
    '00000000-0000-0000-0000-000000001020',
    3,
    1,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 3: 产品策划组
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001022',
    '{tenant_id}',
    '产品策划组',
    'PM',
    '产品经理团队',
    '00000000-0000-0000-0000-000000001020',
    3,
    2,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 市场部
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001030',
    '{tenant_id}',
    '市场部',
    'MARKETING',
    '市场推广与销售部门',
    '00000000-0000-0000-0000-000000001001',
    2,
    3,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 3: 销售组
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001031',
    '{tenant_id}',
    '销售组',
    'SALES',
    '销售团队',
    '00000000-0000-0000-0000-000000001030',
    3,
    1,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 3: 市场推广组
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001032',
    '{tenant_id}',
    '市场推广组',
    'PROMOTION',
    '品牌推广团队',
    '00000000-0000-0000-0000-000000001030',
    3,
    2,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 人力资源部
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001040',
    '{tenant_id}',
    '人力资源部',
    'HR',
    '人事管理团队',
    '00000000-0000-0000-0000-000000001001',
    2,
    4,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 财务部
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000001050',
    '{tenant_id}',
    '财务部',
    'FINANCE',
    '财务管理团队',
    '00000000-0000-0000-0000-000000001001',
    2,
    5,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- Dev租户简化部门结构
-- 租户ID: 00000000-0000-0000-0000-000000000020
-- ========================================

-- Level 1: 开发中心
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002001',
    '{tenant_id}',
    'Dev Center',
    'DEV',
    '开发中心',
    NULL,
    1,
    1,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 开发组
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002010',
    '{tenant_id}',
    '开发组',
    'DEV_TEAM',
    '开发团队',
    '00000000-0000-0000-0000-000000002001',
    2,
    1,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- Level 2: 测试组
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000002020',
    '{tenant_id}',
    '测试组',
    'TEST',
    '测试团队',
    '00000000-0000-0000-0000-000000002001',
    2,
    2,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- Demo租户简化部门结构
-- 租户ID: 00000000-0000-0000-0000-000000000030
-- ========================================

-- Level 1: Demo公司
INSERT INTO system_dept (
    id, tenant_id, name, code, description, parent_id, level, sort, status,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000003001',
    '{tenant_id}',
    'Demo Company',
    'DEMO',
    '演示公司',
    NULL,
    1,
    1,
    'active',
    UNIX_TIMESTAMP(NOW(3)) * 1000,
    UNIX_TIMESTAMP(NOW(3)) * 1000
);

-- ========================================
-- 初始化完成
-- ========================================
-- 执行后请检查部门树结构
-- SELECT * FROM system_dept WHERE tenant_id = '{tenant_id}' ORDER BY level, sort;
-- 验证树形结构：每个parent_id都应存在
