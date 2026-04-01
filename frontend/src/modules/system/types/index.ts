// Backend entities use string IDs consistently.
export type ID = string;

export interface User {
  id: ID;
  username: string;
  realName: string;
  email: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'locked';
  departmentId: ID;
  departmentName: string;
  positionId?: ID;
  positionName?: string;
  roleIds: ID[];
  roleNames: string[];
  userGroupIds: ID[];
  permissions?: string[];
  createdAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  description?: string;
}

export interface UserGroup {
  id: ID;
  name: string;
  code: string;
  description: string;
  userCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}

export interface Department {
  id: ID;
  name: string;
  code: string;
  parentId: ID | null;
  parentName?: string;
  level: number;
  leaderId?: ID;
  leader: string;
  phone: string;
  email: string;
  userCount: number;
  status: 'active' | 'inactive';
  sort: number;
  description?: string;
  createdAt: string;
  children?: Department[];
}

export interface Position {
  id: ID;
  name: string;
  code: string;
  departmentId: ID | null;
  departmentName?: string;
  category: string;
  level: number;
  userCount: number;
  status: 'active' | 'inactive';
  sort: number;
  responsibilities?: string;
  requirements?: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}

export interface Role {
  id: ID;
  name: string;
  code: string;
  description: string;
  menuIds: ID[];
  permissionIds?: ID[];
  permissions?: string[];
  userCount: number;
  status: 'active' | 'inactive';
  type: 'system' | 'custom';
  createdAt: string;
  createdBy: string;
}

export interface Menu {
  id: ID;
  name: string;
  title?: string;
  code: string;
  path: string;
  icon: string;
  parentId: ID | null;
  level: number;
  type: 'menu' | 'button' | 'directory';
  sort: number;
  status: 'active' | 'inactive';
  visible: boolean;
  external?: boolean;
  permission?: string;
  permissions: string[];
  component?: string;
  description?: string;
  children?: Menu[];
}

export interface OperationLog {
  id: ID;
  username: string;
  realName: string;
  module: string;
  resource?: string;
  resourceId?: string;
  resourceName?: string;
  operation: string;
  summary?: string;
  detail?: string;
  method: string;
  requestUrl: string;
  requestParams?: string;
  responseBody?: string;
  ip: string;
  location: string;
  browser: string;
  os: string;
  status: 'success' | 'failure';
  errorMsg?: string;
  duration: number;
  createdAt: string;
}

export interface LoginLog {
  id: ID;
  username: string;
  ip: string;
  location: string;
  browser: string;
  os: string;
  status: 'success' | 'failure';
  message?: string;
  loginAt: string;
  logoutAt?: string;
}

export interface SystemSetting {
  id: ID;
  category: string;
  key: string;
  value: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  options?: string[];
  description: string;
  editable: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface UserFormData {
  username: string;
  realName: string;
  email: string;
  phone: string;
  password?: string;
  departmentId: ID;
  positionId?: ID;
  roleIds: ID[];
  userGroupIds: ID[];
  status: 'active' | 'inactive';
  description?: string;
}

export interface DepartmentFormData {
  name: string;
  code: string;
  parentId: ID | null;
  leaderId?: ID;
  leader: string;
  phone: string;
  email: string;
  sort: number;
  status: 'active' | 'inactive';
  description?: string;
}

export interface RoleFormData {
  name: string;
  code: string;
  menuIds: ID[];
  permissionIds?: ID[];
  status: 'active' | 'inactive';
  description: string;
}

export interface UserGroupFormData {
  name: string;
  code: string;
  status: 'active' | 'inactive';
  description: string;
}

export interface MenuFormData {
  name: string;
  code: string;
  path: string;
  icon: string;
  parentId: ID | null;
  type: 'menu' | 'button' | 'directory';
  sort: number;
  status: 'active' | 'inactive';
  visible: boolean;
  external?: boolean;
  permissions: string[];
  component?: string;
  description?: string;
}

export interface PositionFormData {
  name: string;
  code: string;
  departmentId: ID | null;
  category: string;
  level: number;
  sort: number;
  status: 'active' | 'inactive';
  responsibilities?: string;
  requirements?: string;
  description?: string;
}

export interface Permission {
  id: ID;
  code: string;
  name: string;
  type: 'menu' | 'operation' | 'data' | 'field';
  module: string;
  menuId?: ID;
  actions?: PermissionAction[];
  status: 'active' | 'inactive';
  description?: string;
  createdAt: string;
}

export interface PermissionAction {
  code: string;
  name: string;
  enabled: boolean;
}

export interface RolePermission {
  roleId: ID;
  permissionId: ID;
  permissionCode: string;
  granted: boolean;
  grantedBy?: ID;
  grantedByName?: string;
  grantedAt: string;
  expiresAt?: string;
  dataScope?: 'all' | 'dept' | 'dept_and_sub' | 'self' | 'custom';
  customScope?: ID[];
}

export interface UserPermissionDetail {
  userId: ID;
  username: string;
  permissions: PermissionSource[];
  conflicts: PermissionConflict[];
}

export interface PermissionSource {
  permissionId: ID;
  permissionCode: string;
  permissionName: string;
  source: 'direct' | 'role' | 'dept' | 'group';
  sourceId?: ID;
  sourceName?: string;
  grantedAt: string;
  expiresAt?: string;
}

export interface PermissionConflict {
  permissionId1: ID;
  permissionId2: ID;
  conflictType: 'mutual_exclusive' | 'insufficient_level' | 'data_scope_conflict';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface PermissionImpactAnalysis {
  changeType: 'grant' | 'revoke' | 'modify';
  targetType: 'user' | 'role' | 'dept';
  targetId: ID;
  targetName: string;
  affectedUsers: AffectedUser[];
  affectedPermissions: AffectedPermission[];
  risks: RiskWarning[];
}

export interface AffectedUser {
  userId: ID;
  username: string;
  realName: string;
  departmentName: string;
  currentPermissions: string[];
  futurePermissions: string[];
  gainedPermissions: string[];
  lostPermissions: string[];
}

export interface AffectedPermission {
  permissionId: ID;
  permissionCode: string;
  permissionName: string;
  changeType: 'add' | 'remove' | 'modify';
  before?: any;
  after?: any;
}

export interface RiskWarning {
  level: 'critical' | 'high' | 'medium' | 'low';
  type: 'security' | 'compliance' | 'business';
  message: string;
  recommendation?: string;
}

export interface PermissionAuditLog {
  id: ID;
  operatorId: ID;
  operatorName: string;
  operationType: 'grant' | 'revoke' | 'modify' | 'batch_grant' | 'batch_revoke';
  targetType: 'user' | 'role' | 'dept';
  targetId: ID;
  targetName: string;
  permissionChanges: PermissionChange[];
  reason?: string;
  approvalId?: ID;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  ip: string;
  userAgent: string;
  status: 'success' | 'failure';
  errorMsg?: string;
  createdAt: string;
}

export interface PermissionChange {
  permissionId: ID;
  permissionCode: string;
  permissionName: string;
  action: 'add' | 'remove' | 'modify';
  before?: any;
  after?: any;
}

export interface PermissionApproval {
  id: ID;
  applicantId: ID;
  applicantName: string;
  changeType: 'grant' | 'revoke' | 'modify';
  targetType: 'user' | 'role';
  targetId: ID;
  targetName: string;
  permissions: ID[];
  permissionNames: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  approvalSteps: ApprovalStep[];
  createdAt: string;
  effectiveAt?: string;
  expiresAt?: string;
}

export interface ApprovalStep {
  step: number;
  approverIds: ID[];
  approverNames: string[];
  approvalType: 'or' | 'and';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: ID;
  approvedByName?: string;
  approvedAt?: string;
  comment?: string;
}

export interface PermissionTemplate {
  id: ID;
  name: string;
  code: string;
  category: string;
  description: string;
  permissions: ID[];
  permissionNames: string[];
  useCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionFormData {
  code: string;
  name: string;
  type: 'menu' | 'operation' | 'data' | 'field';
  module: string;
  menuId?: ID;
  description?: string;
}
