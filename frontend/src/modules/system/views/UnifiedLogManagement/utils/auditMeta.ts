export type AuditDetailMap = Record<string, string>;

export interface AuditDetailEntry {
  key: string;
  label: string;
  value: string;
}

const DETAIL_LABELS: Record<string, string> = {
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
  user: 'bg-blue-50 text-blue-700 border-blue-100',
  user_status: 'bg-amber-50 text-amber-700 border-amber-100',
  user_password: 'bg-rose-50 text-rose-700 border-rose-100',
  department: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  position: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  role: 'bg-violet-50 text-violet-700 border-violet-100',
  role_permission: 'bg-purple-50 text-purple-700 border-purple-100',
  role_menu: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  permission: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  menu: 'bg-teal-50 text-teal-700 border-teal-100',
  setting: 'bg-slate-50 text-slate-700 border-slate-200',
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

export function getAuditDetailEntries(detail?: string): AuditDetailEntry[] {
  return Object.entries(parseAuditDetail(detail)).map(([key, value]) => ({
    key,
    label: DETAIL_LABELS[key] || humanizeAuditDetailKey(key),
    value,
  }));
}

export function getAuditResourceBadgeClass(resource?: string): string {
  if (!resource) {
    return 'bg-gray-50 text-gray-700 border-gray-100';
  }

  return RESOURCE_BADGE_CLASS_MAP[resource] || 'bg-slate-50 text-slate-700 border-slate-200';
}

function normalizeAuditDetail(detail: string): string {
  return detail
    .trim()
    .replaceAll('；', '\uff1b')
    .replaceAll(';', '\uff1b')
    .replaceAll('\r\n', '\uff1b')
    .replaceAll('\n', '\uff1b');
}

function humanizeAuditDetailKey(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
