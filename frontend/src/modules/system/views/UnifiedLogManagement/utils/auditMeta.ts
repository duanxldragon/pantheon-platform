export type AuditDetailMap = Record<string, string>;

export interface AuditDetailEntry {
  key: string;
  label: string;
  value: string;
}

const DETAIL_LABELS_ZH: Record<string, string> = {
  action: '操作动作',
  status: '当前状态',
  previous_status: '变更前状态',
  affected_users: '影响用户数',
  affected_roles: '影响角色数',
  refresh_strategy: '刷新策略',
  session_strategy: '会话策略',
  permission_count: '权限数量',
  menu_count: '菜单数量',
  code: '编码',
  path: '路径',
  type: '类型',
  department_id: '部门 ID',
  position_id: '岗位 ID',
  before_department: '变更前部门',
  after_department: '变更后部门',
  before_position: '变更前岗位',
  after_position: '变更后岗位',
};

const DETAIL_LABELS_EN: Record<string, string> = {
  action: 'Action',
  status: 'Status',
  previous_status: 'Previous Status',
  affected_users: 'Affected Users',
  affected_roles: 'Affected Roles',
  refresh_strategy: 'Refresh Strategy',
  session_strategy: 'Session Strategy',
  permission_count: 'Permission Count',
  menu_count: 'Menu Count',
  code: 'Code',
  path: 'Path',
  type: 'Type',
  department_id: 'Department ID',
  position_id: 'Position ID',
  before_department: 'Previous Department',
  after_department: 'Current Department',
  before_position: 'Previous Position',
  after_position: 'Current Position',
};

const RESOURCE_BADGE_CLASS_MAP: Record<string, string> = {
  user: 'border-blue-100 bg-blue-50 text-blue-700',
  user_status: 'border-amber-100 bg-amber-50 text-amber-700',
  user_password: 'border-rose-100 bg-rose-50 text-rose-700',
  department: 'border-cyan-100 bg-cyan-50 text-cyan-700',
  position: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  role: 'border-violet-100 bg-violet-50 text-violet-700',
  role_permission: 'border-purple-100 bg-purple-50 text-purple-700',
  role_menu: 'border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700',
  permission: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  menu: 'border-teal-100 bg-teal-50 text-teal-700',
  setting: 'border-slate-200 bg-slate-50 text-slate-700',
};

export function parseAuditDetail(detail?: string): AuditDetailMap {
  if (!detail?.trim()) {
    return {};
  }

  return normalizeAuditDetail(detail)
    .split('\uff1b')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<AuditDetailMap>((result, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex <= 0) {
        return result;
      }

      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();
      if (!key || !value) {
        return result;
      }

      result[key] = value;
      return result;
    }, {});
}

export function isRefreshStrategy(value?: string): boolean {
  return value === 'bump_auth_version' || value === 'refresh_auth_version';
}

export function isRevokeStrategy(value?: string): boolean {
  return value === 'revoke';
}

export function getAuditDetailEntries(detail?: string, language: string = 'zh'): AuditDetailEntry[] {
  const detailLabels = language === 'zh' ? DETAIL_LABELS_ZH : DETAIL_LABELS_EN;
  return Object.entries(parseAuditDetail(detail)).map(([key, value]) => ({
    key,
    label: detailLabels[key] || humanizeAuditDetailKey(key, language),
    value,
  }));
}

export function getAuditResourceBadgeClass(resource?: string): string {
  if (!resource) {
    return 'border-slate-100 bg-slate-50 text-slate-700';
  }

  return RESOURCE_BADGE_CLASS_MAP[resource] || 'border-slate-200 bg-slate-50 text-slate-700';
}

function normalizeAuditDetail(detail: string): string {
  return detail
    .trim()
    .replaceAll('；', '\uff1b')
    .replaceAll(';', '\uff1b')
    .replaceAll('\r\n', '\uff1b')
    .replaceAll('\n', '\uff1b');
}

function humanizeAuditDetailKey(key: string, language: string = 'en'): string {
  if (language === 'zh') {
    return key.replaceAll('_', ' / ');
  }

  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
