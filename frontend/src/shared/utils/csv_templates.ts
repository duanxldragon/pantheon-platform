/**
 * CSV模板配置
 * 为各个系统管理模块定义CSV导入导出模板
 */

import { CSVTemplateConfig } from './csv_export';

/**
 * 用户管理CSV模板
 */
export const userManagementTemplate: CSVTemplateConfig = {
  moduleName: 'UserManagement',
  headers: [
    { key: 'username', label: 'Username', example: 'zhangsan', description: 'Unique username' },
    { key: 'realName', label: 'Real Name', example: '张三', description: 'User full name' },
    { key: 'email', label: 'Email', example: 'zhangsan@example.com', description: 'Email address' },
    { key: 'phone', label: 'Phone', example: '13800138000', description: 'Phone number' },
    { key: 'departmentId', label: 'Department ID', example: 'dept-001', description: 'Department identifier' },
    { key: 'positionId', label: 'Position ID', example: 'pos-001', description: 'Position identifier' },
    { key: 'roleIds', label: 'Role IDs', example: 'role-001; role-002', description: 'Role IDs separated by semicolon' },
    { key: 'status', label: 'Status', example: 'active', description: 'active or inactive' },
  ],
};

/**
 * 角色管理CSV模板
 */
export const roleManagementTemplate: CSVTemplateConfig = {
  moduleName: 'RoleManagement',
  headers: [
    { key: 'roleName', label: 'Role Name', example: '系统管理员', description: 'Role display name' },
    { key: 'roleCode', label: 'Role Code', example: 'admin', description: 'Unique role code' },
    { key: 'description', label: 'Description', example: '系统管理员角色', description: 'Role description' },
    { key: 'status', label: 'Status', example: 'active', description: 'active or inactive' },
    { key: 'sort', label: 'Sort Order', example: '1', description: 'Display order number' },
  ],
};

/**
 * 菜单管理CSV模板
 */
export const menuManagementTemplate: CSVTemplateConfig = {
  moduleName: 'MenuManagement',
  headers: [
    { key: 'menuName', label: 'Menu Name', example: '用户管理', description: 'Menu display name' },
    { key: 'path', label: 'Path', example: '/system/users', description: 'Route path' },
    { key: 'permission', label: 'Permission', example: 'system:user:view', description: 'Permission code' },
    { key: 'icon', label: 'Icon', example: 'Users', description: 'Icon name' },
    { key: 'type', label: 'Type', example: 'menu', description: 'menu or button' },
    { key: 'sort', label: 'Sort Order', example: '1', description: 'Display order number' },
    { key: 'parentMenu', label: 'Parent Menu', example: '系统管理', description: 'Parent menu name' },
    { key: 'status', label: 'Status', example: 'active', description: 'active or inactive' },
  ],
};

/**
 * 数据字典CSV模板
 */
export const dataDictionaryTemplate: CSVTemplateConfig = {
  moduleName: 'DataDictionary',
  headers: [
    { key: 'dictType', label: 'Dict Type', example: 'user_status', description: 'Dictionary type code' },
    { key: 'dictName', label: 'Dict Name', example: '用户状态', description: 'Dictionary type name' },
    { key: 'dictLabel', label: 'Dict Label', example: '启用', description: 'Dictionary item label' },
    { key: 'dictValue', label: 'Dict Value', example: 'active', description: 'Dictionary item value' },
    { key: 'cssClass', label: 'CSS Class', example: 'success', description: 'CSS class name' },
    { key: 'listClass', label: 'List Class', example: 'default', description: 'List class name' },
    { key: 'sort', label: 'Sort Order', example: '1', description: 'Display order number' },
    { key: 'status', label: 'Status', example: 'active', description: 'active or inactive' },
    { key: 'remark', label: 'Remark', example: '用户账号启用状态', description: 'Additional notes' },
  ],
};

/**
 * 部门管理CSV模板
 */
export const departmentManagementTemplate: CSVTemplateConfig = {
  moduleName: 'DepartmentManagement',
  headers: [
    { key: 'departmentName', label: 'Department Name', example: '技术部', description: 'Department name' },
    { key: 'departmentCode', label: 'Department Code', example: 'TECH', description: 'Unique department code' },
    { key: 'parentDepartment', label: 'Parent Department', example: '研发中心', description: 'Parent department name' },
    { key: 'leader', label: 'Leader', example: '张三', description: 'Department leader name' },
    { key: 'phone', label: 'Phone', example: '010-12345678', description: 'Contact phone' },
    { key: 'email', label: 'Email', example: 'tech@example.com', description: 'Contact email' },
    { key: 'sort', label: 'Sort Order', example: '1', description: 'Display order number' },
    { key: 'status', label: 'Status', example: 'active', description: 'active or inactive' },
  ],
};

/**
 * 职位管理CSV模板
 */
export const positionManagementTemplate: CSVTemplateConfig = {
  moduleName: 'PositionManagement',
  headers: [
    { key: 'positionName', label: 'Position Name', example: '高级工程师', description: 'Position name' },
    { key: 'positionCode', label: 'Position Code', example: 'SENIOR_ENG', description: 'Unique position code' },
    { key: 'departmentId', label: 'Department ID', example: 'dept-001', description: 'Department identifier' },
    { key: 'departmentCode', label: 'Department Code', example: 'TECH', description: 'Department code' },
    { key: 'departmentName', label: 'Department Name', example: '技术部', description: 'Department name' },
    { key: 'category', label: 'Category', example: 'technical', description: 'Position category' },
    { key: 'positionLevel', label: 'Position Level', example: 'P7', description: 'Position level' },
    { key: 'responsibilities', label: 'Responsibilities', example: '负责核心模块设计与交付', description: 'Position responsibilities' },
    { key: 'requirements', label: 'Requirements', example: '5年以上相关经验', description: 'Position requirements' },
    { key: 'description', label: 'Description', example: '高级技术岗位', description: 'Position description' },
    { key: 'sort', label: 'Sort Order', example: '1', description: 'Display order number' },
    { key: 'status', label: 'Status', example: 'active', description: 'active or inactive' },
  ],
};

/**
 * 权限管理CSV模板
 */
export const permissionManagementTemplate: CSVTemplateConfig = {
  moduleName: 'PermissionManagement',
  headers: [
    { key: 'permissionName', label: 'Permission Name', example: '查看用户', description: 'Permission display name' },
    { key: 'permissionCode', label: 'Permission Code', example: 'system:user:view', description: 'Unique permission code' },
    { key: 'permissionType', label: 'Permission Type', example: 'menu', description: 'menu, button, or api' },
    { key: 'module', label: 'Module', example: '系统管理', description: 'Module name' },
    { key: 'description', label: 'Description', example: '查看用户列表权限', description: 'Permission description' },
    { key: 'status', label: 'Status', example: 'active', description: 'active or inactive' },
  ],
};

/**
 * 登录日志CSV模板
 */
export const loginLogTemplate: CSVTemplateConfig = {
  moduleName: 'LoginLog',
  headers: [
    { key: 'username', label: 'Username', example: 'admin', description: 'User login name' },
    { key: 'realName', label: 'Real Name', example: '系统管理员', description: 'User full name' },
    { key: 'loginTime', label: 'Login Time', example: '2024-01-15 10:00:00', description: 'Login timestamp' },
    { key: 'ipAddress', label: 'IP Address', example: '192.168.1.100', description: 'Login IP' },
    { key: 'location', label: 'Location', example: 'Shanghai, China', description: 'Login location' },
    { key: 'device', label: 'Device', example: 'desktop', description: 'desktop, mobile, or tablet' },
    { key: 'browser', label: 'Browser', example: 'Chrome 120', description: 'Browser info' },
    { key: 'os', label: 'OS', example: 'Windows 11', description: 'Operating system' },
    { key: 'status', label: 'Status', example: 'success', description: 'success, failed, or locked' },
    { key: 'failReason', label: 'Fail Reason', example: 'Invalid password', description: 'Reason if failed' },
  ],
};

/**
 * 操作日志CSV模板
 */
export const operationLogTemplate: CSVTemplateConfig = {
  moduleName: 'OperationLog',
  headers: [
    { key: 'username', label: 'Username', example: 'admin', description: 'Operator username' },
    { key: 'realName', label: 'Real Name', example: '系统管理员', description: 'Operator full name' },
    { key: 'module', label: 'Module', example: '用户管理', description: 'Operation module' },
    { key: 'action', label: 'Action', example: '新增用户', description: 'Operation action' },
    { key: 'method', label: 'Method', example: 'POST', description: 'HTTP method' },
    { key: 'params', label: 'Params', example: '{"username":"test"}', description: 'Request parameters' },
    { key: 'ipAddress', label: 'IP Address', example: '192.168.1.100', description: 'Operation IP' },
    { key: 'location', label: 'Location', example: 'Shanghai, China', description: 'Operation location' },
    { key: 'status', label: 'Status', example: 'success', description: 'success or failed' },
    { key: 'errorMsg', label: 'Error Message', example: '', description: 'Error message if failed' },
    { key: 'operateTime', label: 'Operate Time', example: '2024-01-15 10:00:00', description: 'Operation timestamp' },
    { key: 'duration', label: 'Duration', example: '150', description: 'Duration in ms' },
  ],
};

/**
 * 审计日志CSV模板
 */
export const auditLogTemplate: CSVTemplateConfig = {
  moduleName: 'AuditLog',
  headers: [
    { key: 'username', label: 'Username', example: 'admin', description: 'Operator username' },
    { key: 'realName', label: 'Real Name', example: '系统管理员', description: 'Operator full name' },
    { key: 'action', label: 'Action', example: '登录系统', description: 'Audit action' },
    { key: 'module', label: 'Module', example: '认证', description: 'Related module' },
    { key: 'resource', label: 'Resource', example: '/api/auth/login', description: 'Resource path' },
    { key: 'ipAddress', label: 'IP Address', example: '192.168.1.100', description: 'Operation IP' },
    { key: 'userAgent', label: 'User Agent', example: 'Mozilla/5.0...', description: 'User agent string' },
    { key: 'result', label: 'Result', example: 'success', description: 'success or failed' },
    { key: 'riskLevel', label: 'Risk Level', example: 'low', description: 'low, medium, or high' },
    { key: 'timestamp', label: 'Timestamp', example: '2024-01-15 10:00:00', description: 'Operation timestamp' },
  ],
};

/**
 * 系统设置CSV模板
 */
export const systemSettingsTemplate: CSVTemplateConfig = {
  moduleName: 'SystemSettings',
  headers: [
    { key: 'category', label: 'Category', example: 'basic', description: 'Setting category' },
    { key: 'key', label: 'Setting Key', example: 'systemName', description: 'Setting key name' },
    { key: 'value', label: 'Value', example: '运维管理系统', description: 'Setting value' },
    { key: 'type', label: 'Type', example: 'text', description: 'text, number, boolean, etc.' },
    { key: 'label', label: 'Label', example: '系统名称', description: 'Display label' },
    { key: 'description', label: 'Description', example: '系统的显示名称', description: 'Setting description' },
    { key: 'editable', label: 'Editable', example: 'true', description: 'Can be edited' },
    { key: 'required', label: 'Required', example: 'true', description: 'Is required' },
  ],
};

/**
 * 系统监控CSV模板
 */
export const systemMonitorTemplate: CSVTemplateConfig = {
  moduleName: 'SystemMonitor',
  headers: [
    { key: 'timestamp', label: 'Timestamp', example: '2024-01-15 10:00:00', description: 'Monitor timestamp' },
    { key: 'metricType', label: 'Metric Type', example: 'cpu', description: 'cpu, memory, disk, etc.' },
    { key: 'metricName', label: 'Metric Name', example: 'CPU使用率', description: 'Metric display name' },
    { key: 'value', label: 'Value', example: '45.5', description: 'Metric value' },
    { key: 'unit', label: 'Unit', example: '%', description: 'Value unit' },
    { key: 'threshold', label: 'Threshold', example: '80', description: 'Alert threshold' },
    { key: 'status', label: 'Status', example: 'normal', description: 'normal, warning, or critical' },
  ],
};

/**
 * 主机管理CSV模板
 */
export const hostManagementTemplate: CSVTemplateConfig = {
  moduleName: 'HostManagement',
  headers: [
    { key: 'name', label: 'Host Name', example: 'web-server-01', description: 'Host display name' },
    { key: 'ip', label: 'IP Address', example: '192.168.1.100', description: 'IP address' },
    { key: 'status', label: 'Status', example: 'online', description: 'online, offline, or maintenance' },
    { key: 'os', label: 'OS', example: 'Ubuntu 22.04', description: 'Operating system' },
    { key: 'location', label: 'Location', example: '北京机房A', description: 'Physical location' },
    { key: 'cpu', label: 'CPU', example: '45%', description: 'CPU usage' },
    { key: 'memory', label: 'Memory', example: '60%', description: 'Memory usage' },
    { key: 'disk', label: 'Disk', example: '70%', description: 'Disk usage' },
    { key: 'tags', label: 'Tags', example: 'production; web', description: 'Tags separated by semicolon' },
    { key: 'description', label: 'Description', example: 'Web服务器', description: 'Host description' },
  ],
};

/**
 * 获取所有模板
 */
export const csvTemplates = {
  user: userManagementTemplate,
  role: roleManagementTemplate,
  menu: menuManagementTemplate,
  dict: dataDictionaryTemplate,
  department: departmentManagementTemplate,
  position: positionManagementTemplate,
  permission: permissionManagementTemplate,
  loginLog: loginLogTemplate,
  operationLog: operationLogTemplate,
  auditLog: auditLogTemplate,
  settings: systemSettingsTemplate,
  monitor: systemMonitorTemplate,
  host: hostManagementTemplate,
};



