import { getUnifiedLogManagementCopy } from '../unifiedLogManagementCopy';

export type AuditDetailMap = Record<string, string>;

export interface AuditDetailEntry {
  key: string;
  label: string;
  value: string;
}

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
  const detailLabels = getUnifiedLogManagementCopy(language === 'zh' ? 'zh' : 'en').detail.auditDetailLabels;
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
