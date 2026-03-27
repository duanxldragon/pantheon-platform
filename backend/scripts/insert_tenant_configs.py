#!/usr/bin/env python3
import mysql.connector

# Connect to MySQL
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='DHCCroot@2025',
    database='pantheon_master'
)

cursor = conn.cursor()

# Insert tenant database configs
query = """
INSERT INTO tenant_database_configs 
(id, tenant_id, database_type, `database`, host, port, username, max_open_conns, max_idle_conns, conn_max_lifetime, created_at, updated_at) 
VALUES 
(%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(3), NOW(3)),
(%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(3), NOW(3)),
(%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(3), NOW(3)),
(%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(3), NOW(3))
"""

values = [
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'mysql', 'pantheon_master', 'localhost', 3306, 'root', 100, 10, 3600,
    '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', 'mysql', 'pantheon_enterprise', 'localhost', 3306, 'root', 200, 20, 3600,
    '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000020', 'mysql', 'pantheon_dev', 'localhost', 3306, 'root', 50, 10, 1800,
    '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000030', 'mysql', 'pantheon_demo', 'localhost', 3306, 'root', 50, 5, 3600
]

try:
    cursor.execute(query, values)
    conn.commit()
    print("All tenant database configs inserted successfully!")
    print(cursor.rowcount, "rows inserted")
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    conn.close()
