-- Insert tenant database configs
USE pantheon_master;

INSERT INTO tenant_database_configs (id, tenant_id, database_type, database, host, port, username, max_open_conns, max_idle_conns, conn_max_lifetime, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'mysql', 'pantheon_master', 'localhost', 3306, 'root', 100, 10, 3600, NOW(3), NOW(3)),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', 'mysql', 'pantheon_enterprise', 'localhost', 3306, 'root', 200, 20, 3600, NOW(3), NOW(3)),
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000020', 'mysql', 'pantheon_dev', 'localhost', 3306, 'root', 50, 10, 1800, NOW(3), NOW(3)),
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000030', 'mysql', 'pantheon_demo', 'localhost', 3306, 'root', 50, 5, 3600, NOW(3), NOW(3));
