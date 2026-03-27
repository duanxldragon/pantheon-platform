-- Simplified demo users for enterprise tenant
USE pantheon_enterprise;

-- Insert demo users
INSERT INTO users (id, tenant_id, username, password, real_name, email, phone, gender, avatar, status, department_id, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000005001', '00000000-0000-0000-0000-000000000010', 'zhangsan', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '张三', 'zhangsan@techcorp.com', '+86-138-0001-0001', 'male', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', 'active', '00000000-0000-0000-0000-000000001010', UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000005010', '00000000-0000-0000-0000-000000000010', 'lisi', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '李四', 'lisi@techcorp.com', '+86-138-0001-0002', 'male', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi', 'active', '00000000-0000-0000-0000-000000001020', UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000005090', '00000000-0000-0000-0000-000000000010', 'locked_user', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '锁定用户', 'locked@techcorp.com', '+86-138-0001-0010', 'male', 'https://api.dicebear.com/7.x/avataaars/svg?seed=locked', 'locked', '00000000-0000-0000-0000-000000001011', UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000005100', '00000000-0000-0000-0000-000000000010', 'inactive_user', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '未激活用户', 'inactive@techcorp.com', '+86-138-0001-0011', 'female', 'https://api.dicebear.com/7.x/avataaars/svg?seed=inactive', 'inactive', '00000000-0000-0000-0000-000000001012', UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

-- Insert user role bindings
INSERT INTO sys_user_roles (id, user_id, role_id, created_at) VALUES
('00000000-0000-0000-0000-000000008001', '00000000-0000-0000-0000-000000005001', '00000000-0000-0000-0000-000000002001', UNIX_TIMESTAMP(NOW(3)) * 1000),
('00000000-0000-0000-0000-000000008010', '00000000-0000-0000-0000-000000005010', '00000000-0000-0000-0000-000000002010', UNIX_TIMESTAMP(NOW(3)) * 1000);

-- Dev tenant users
USE pantheon_dev;

INSERT INTO users (id, tenant_id, username, password, real_name, email, phone, gender, avatar, status, department_id, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000006001', '00000000-0000-0000-0000-000000000020', 'dev_user', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '开发用户', 'dev@dev-test.com', '+86-138-0002-0001', 'male', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev', 'active', '00000000-0000-0000-0000-000000002010', UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

INSERT INTO sys_user_roles (id, user_id, role_id, created_at) VALUES
('00000000-0000-0000-0000-000000009001', '00000000-0000-0000-0000-000000006001', '00000000-0000-0000-0000-000000003001', UNIX_TIMESTAMP(NOW(3)) * 1000);

-- Demo tenant users
USE pantheon_demo;

INSERT INTO users (id, tenant_id, username, password, real_name, email, phone, gender, avatar, status, department_id, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000007001', '00000000-0000-0000-0000-000000000030', 'demo_user', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '演示用户', 'demo@demo.com', '+86-138-0003-0001', 'male', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', 'active', '00000000-0000-0000-0000-000000003001', UNIX_TIMESTAMP(NOW(3)) * 1000, UNIX_TIMESTAMP(NOW(3)) * 1000);

INSERT INTO sys_user_roles (id, user_id, role_id, created_at) VALUES
('00000000-0000-0000-0000-000000010001', '00000000-0000-0000-0000-000000007001', '00000000-0000-0000-0000-000000004001', UNIX_TIMESTAMP(NOW(3)) * 1000);
