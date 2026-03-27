# Demo Data 演示数据使用说明

## 概述

本目录包含 Pantheon Platform 的完整演示测试数据，用于开发测试、演示展示和学习系统功能。

## 文件结构

```
demo/
├── 01_demo_tenants.sql              # 演示租户数据
├── 02_demo_departments.sql          # 演示部门树结构
├── 03_demo_roles.sql                # 演示角色数据
├── 04_demo_users.sql                # 演示用户数据
├── 05_demo_menus_permissions.sql     # 演示菜单和权限数据
└── DEMO_GUIDE.md                    # 本说明文档
```

## 数据概览

### 1. 租户数据 (01_demo_tenants.sql)

创建 5 个演示租户：

| 租户代码 | 租户名称 | 状态 | 说明 |
|---------|---------|------|------|
| platform | Pantheon Platform | active | 平台租户（系统自带） |
| enterprise | TechCorp Inc. | active | 企业租户（完整数据） |
| dev | Dev Test Environment | active | 开发测试租户（简化数据） |
| demo | Demo Company | active | 演示租户（简化数据） |
| suspended | Suspended Tenant | disabled | 暂停租户（测试状态） |
| pending | Pending Tenant | pending | 待激活租户（测试状态） |

**租户数据库配置**：
- Enterprise: 200 连接池（大租户）
- Dev: 50 连接池（中等租户）
- Demo: 50 连接池（中等租户）

### 2. 部门数据 (02_demo_departments.sql)

**Enterprise租户 - 三级部门树**：
```
TechCorp 总部 (HQ)
├── 研发中心 (R&D)
│   ├── 前端开发组 (FRONTEND)
│   ├── 后端开发组 (BACKEND)
│   └── 测试组 (QA)
├── 产品部 (PRODUCT)
│   ├── 产品设计组 (UI/UX)
│   └── 产品策划组 (PM)
├── 市场部 (MARKETING)
│   ├── 销售组 (SALES)
│   └── 市场推广组 (PROMOTION)
├── 人力资源部 (HR)
└── 财务部 (FINANCE)
```

**Dev租户 - 简化结构**：
```
Dev Center
├── 开发组
└── 测试组
```

**Demo租户 - 单一部门**：
```
Demo Company
```

### 3. 角色数据 (03_demo_roles.sql)

**Enterprise租户角色**：

| 角色代码 | 角色名称 | 说明 | 系统角色 |
|---------|---------|------|---------|
| super_admin | 超级管理员 | 系统自带，拥有所有权限 | 是 |
| rd_director | 研发总监 | 研发部门负责人 | 否 |
| product_manager | 产品经理 | 产品规划与设计 | 否 |
| frontend_developer | 前端开发工程师 | 前端开发团队 | 否 |
| backend_developer | 后端开发工程师 | 服务端开发团队 | 否 |
| qa_engineer | 测试工程师 | 质量保证与测试 | 否 |
| ui_ux_designer | UI/UX设计师 | 界面与体验设计 | 否 |
| sales_manager | 销售经理 | 销售业务管理 | 否 |
| hr_specialist | HR专员 | 人事管理 | 否 |
| finance_specialist | 财务专员 | 财务管理 | 否 |
| employee | 普通员工 | 基本权限 | 否 |
| guest | 访客 | 只读权限 | 否 |

### 4. 用户数据 (04_demo_users.sql)

**Enterprise租户用户**：

| 用户名 | 姓名 | 角色 | 部门 | 状态 |
|-------|------|------|------|------|
| zhangsan | 张三 | 研发总监 | 研发中心 | active |
| lisi | 李四 | 产品经理 | 产品部 | active |
| wangwu | 王五 | 前端开发工程师 | 前端开发组 | active |
| zhaoliu | 赵六 | 后端开发工程师 | 后端开发组 | active |
| sunqi | 孙七 | 测试工程师 | 测试组 | active |
| zhouba | 周八 | UI/UX设计师 | 产品设计组 | active |
| wujiu | 吴九 | 销售经理 | 市场部 | active |
| zhengshi | 郑十 | HR专员 | 人力资源部 | active |
| qianyi | 钱一 | 财务专员 | 财务部 | active |
| locked_user | 锁定用户 | - | 前端开发组 | **locked** |
| inactive_user | 未激活用户 | - | 后端开发组 | **inactive** |

**默认密码**: `admin123`

**Dev租户用户**：
- dev_user - 开发用户
- test_user - 测试用户

**Demo租户用户**：
- demo_user - 演示用户

### 5. 菜单和权限数据 (05_demo_menus_permissions.sql)

**菜单结构**：

```
系统管理 (System)
├── 用户管理 (User)
│   ├── 新增用户 (按钮)
│   ├── 编辑用户 (按钮)
│   ├── 删除用户 (按钮)
│   └── 导出用户 (按钮)
├── 角色管理 (Role)
│   ├── 新增角色 (按钮)
│   ├── 编辑角色 (按钮)
│   ├── 删除角色 (按钮)
│   └── 分配权限 (按钮)
├── 菜单管理 (Menu)
├── 部门管理 (Department)
├── 权限管理 (Permission)
├── 字典管理 (Dict)
├── 操作日志 (OperationLog)
└── 登录日志 (LoginLog)

个人中心 (Profile)
├── 基本信息 (BasicInfo)
└── 修改密码 (ChangePassword)
```

**权限定义**：
- 系统管理权限：用户、角色、菜单、部门、权限、字典、日志
- 个人中心权限：查询个人信息、更新个人信息、修改密码

## 使用方法

### 步骤 1: 替换租户ID占位符

在执行租户业务数据SQL脚本前，需要将 `{tenant_id}` 替换为实际的租户UUID。

**Enterprise租户**:
```bash
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000010/g' 02_demo_departments.sql
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000010/g' 03_demo_roles.sql
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000010/g' 04_demo_users.sql
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000010/g' 05_demo_menus_permissions.sql
```

**Dev租户**:
```bash
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000020/g' 02_demo_departments.sql
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000020/g' 03_demo_roles.sql
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000020/g' 04_demo_users.sql
```

**Demo租户**:
```bash
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000030/g' 02_demo_departments.sql
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000030/g' 03_demo_roles.sql
sed -i 's/{tenant_id}/00000000-0000-0000-0000-000000000030/g' 04_demo_users.sql
```

### 步骤 2: 执行主数据库脚本

连接到主数据库 `pantheon_master` 并执行租户脚本：

```bash
mysql -u root -p pantheon_master < 01_demo_tenants.sql
```

### 步骤 3: 执行租户业务数据库脚本

为每个租户的业务数据库执行相应脚本：

**Enterprise租户**:
```bash
mysql -u root -p pantheon_enterprise < 02_demo_departments.sql
mysql -u root -p pantheon_enterprise < 03_demo_roles.sql
mysql -u root -p pantheon_enterprise < 04_demo_users.sql
mysql -u root -p pantheon_enterprise < 05_demo_menus_permissions.sql
```

**Dev租户**:
```bash
mysql -u root -p pantheon_dev < 02_demo_departments.sql
mysql -u root -p pantheon_dev < 03_demo_roles.sql
mysql -u root -p pantheon_dev < 04_demo_users.sql
```

**Demo租户**:
```bash
mysql -u root -p pantheon_demo < 02_demo_departments.sql
mysql -u root -p pantheon_demo < 03_demo_roles.sql
mysql -u root -p pantheon_demo < 04_demo_users.sql
```

### 步骤 4: 验证数据

**验证租户**:
```sql
SELECT id, name, code, status FROM tenants WHERE code IN ('enterprise', 'dev', 'demo');
```

**验证部门树**:
```sql
SELECT id, name, code, parent_id, level, sort
FROM system_dept
WHERE tenant_id = '00000000-0000-0000-0000-000000000010'
ORDER BY level, sort;
```

**验证用户**:
```sql
SELECT u.username, u.real_name, u.email, u.status, d.name as dept_name, r.name as role_name
FROM system_users u
LEFT JOIN system_dept d ON u.department_id = d.id
LEFT JOIN system_user_roles ur ON u.id = ur.user_id
LEFT JOIN system_roles r ON ur.role_id = r.id
WHERE u.tenant_id = '00000000-0000-0000-0000-000000000010';
```

**验证菜单树**:
```sql
SELECT id, title, icon, path, parent_id, type
FROM system_menus
WHERE tenant_id = '00000000-0000-0000-0000-000000000010'
ORDER BY parent_id, sort;
```

## 测试场景

### 场景 1: 正常登录流程

1. 使用 `zhangsan` / `admin123` 登录（研发总监）
2. 验证用户信息、角色、权限
3. 访问系统管理菜单
4. 验证所有权限可用

### 场景 2: 权限控制测试

1. 使用 `qianyi` / `admin123` 登录（财务专员）
2. 验证只能访问个人中心
3. 尝试访问系统管理（应被拒绝）

### 场景 3: 用户状态测试

1. 使用 `locked_user` / `admin123` 登录（应提示账户锁定）
2. 使用 `inactive_user` / `admin123` 登录（应提示账户未激活）

### 场景 4: 租户隔离测试

1. 登录 Enterprise 租户（zhangsan）
2. 查看用户列表（应显示 Enterprise 用户）
3. 切换到 Dev 租户（dev_user）
4. 查看用户列表（应显示 Dev 用户，与 Enterprise 隔离）

### 场景 5: 部门层级测试

1. 登录 Enterprise 租户
2. 查看部门树（三级结构）
3. 按部门筛选用户
4. 验证层级关系正确

## 清理演示数据

如需清理所有演示数据：

```sql
-- 清理主数据库
DELETE FROM tenant_database_configs WHERE tenant_id LIKE '00000000-0000-0000-0000-0000000000%';
DELETE FROM tenants WHERE code IN ('enterprise', 'dev', 'demo', 'suspended', 'pending');

-- 清理租户业务数据库（每个租户分别执行）
DELETE FROM system_role_permissions WHERE tenant_id = '00000000-0000-0000-0000-000000000010';
DELETE FROM system_role_menus WHERE tenant_id = '00000000-0000-0000-0000-000000000010';
DELETE FROM system_permissions WHERE tenant_id = '00000000-0000-0000-0000-000000000010';
DELETE FROM system_menus WHERE tenant_id = '00000000-0000-0000-0000-000000000010';
DELETE FROM system_user_roles WHERE user_id IN (SELECT id FROM system_users WHERE tenant_id = '00000000-0000-0000-0000-000000000010');
DELETE FROM system_users WHERE tenant_id = '00000000-0000-0000-0000-000000000010';
DELETE FROM system_roles WHERE tenant_id = '00000000-0000-0000-0000-000000000010';
DELETE FROM system_dept WHERE tenant_id = '00000000-0000-0000-0000-000000000010';
```

## 注意事项

1. **数据冲突**: 如果系统中已存在相同代码的租户、角色、用户，执行脚本会失败。请先清理或修改脚本中的数据。

2. **租户ID替换**: 执行脚本前必须替换 `{tenant_id}` 占位符，否则数据关联错误。

3. **密码安全**: 演示用户使用统一密码 `admin123`，生产环境必须修改。

4. **头像URL**: 用户头像使用 DiceBear API 生成，需要网络访问。

5. **Casbin策略**: 脚本中包含简化的 Casbin 策略，实际权限由服务端动态管理。

6. **执行顺序**: 严格按照 01 → 02 → 03 → 04 → 05 的顺序执行，确保外键依赖正确。

## 扩展建议

如需添加更多演示数据，可以：

1. 在 `04_demo_users.sql` 中添加更多用户
2. 在 `03_demo_roles.sql` 中创建更多角色
3. 在 `05_demo_menus_permissions.sql` 中添加更多菜单和权限
4. 创建新的 SQL 文件（如 `06_demo_dict_data.sql`）添加字典数据
5. 创建新的 SQL 文件（如 `07_demo_logs.sql`）添加日志数据

## 故障排查

### 问题：脚本执行失败 - Foreign key constraint fails

**原因**: 依赖表未创建或数据不存在

**解决**: 检查是否按顺序执行脚本，确保外键依赖正确

### 问题：用户登录失败 - 用户名或密码错误

**原因**:
- 用户未创建或状态非 active
- 密码错误（演示密码为 `admin123`）
- 租户状态非 active

**解决**:
```sql
-- 检查用户
SELECT id, username, status FROM system_users WHERE username = 'zhangsan';

-- 检查租户
SELECT id, code, status FROM tenants WHERE id = '00000000-0000-0000-0000-000000000010';
```

### 问题：权限验证失败

**原因**:
- 角色未分配权限
- 用户未分配角色
- Casbin 策略未正确加载

**解决**:
```sql
-- 检查用户角色
SELECT u.username, r.name as role_name
FROM system_users u
JOIN system_user_roles ur ON u.id = ur.user_id
JOIN system_roles r ON ur.role_id = r.id
WHERE u.username = 'zhangsan';

-- 检查角色权限
SELECT r.name as role_name, p.code as permission_code
FROM system_roles r
JOIN system_role_permissions rp ON r.id = rp.role_id
JOIN system_permissions p ON rp.permission_id = p.id
WHERE r.code = 'rd_director';
```

## 技术支持

如有问题，请：
1. 检查 SQL 脚本语法
2. 查看数据库错误日志
3. 验证数据完整性
4. 参考系统文档

---

**最后更新**: 2026-03-21
**版本**: 1.0.0

