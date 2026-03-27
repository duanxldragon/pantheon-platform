-- Simplified demo roles for enterprise tenant
USE pantheon_enterprise;

-- Insert demo roles
INSERT INTO sys_roles (id, tenant_id, name, code, description, status, is_system, data_scope, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000010', '研发总监', 'rd_director', '研发部门总监，管理所有研发相关事务', 'active', 0, 'all', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000002010', '00000000-0000-0000-0000-000000000010', '产品经理', 'product_manager', '产品经理，负责产品规划与需求分析', 'active', 0, 'all', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000002090', '00000000-0000-0000-0000-000000000010', '普通员工', 'employee', '普通员工，基本权限', 'active', 0, 'all', 11, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- Dev tenant roles
USE pantheon_dev;

INSERT INTO sys_roles (id, tenant_id, name, code, description, status, is_system, data_scope, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000000020', '开发人员', 'developer', '开发人员，完整开发权限', 'active', 0, 'all', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000003010', '00000000-0000-0000-0000-000000000020', '测试人员', 'tester', '测试人员，测试权限', 'active', 0, 'all', 3, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- Demo tenant roles
USE pantheon_demo;

INSERT INTO sys_roles (id, tenant_id, name, code, description, status, is_system, data_scope, sort, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000000030', '演示用户', 'demo_user', '演示用户，基本权限', 'active', 0, 'all', 2, UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);
