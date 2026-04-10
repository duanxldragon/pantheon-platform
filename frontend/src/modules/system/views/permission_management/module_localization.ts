import { getPermissionManagementCopy, getPermissionModuleCatalog } from './permission_management_copy';

const normalizeKeyword = (value?: string) => value?.trim().toLowerCase() || '';

const findModuleEntry = (value?: string) => {
  const keyword = normalizeKeyword(value);
  if (!keyword) {
    return undefined;
  }

  return getPermissionModuleCatalog().find((entry) =>
    entry.aliases.some((alias) => normalizeKeyword(alias) === keyword),
  );
};

export const normalizePermissionModule = (value?: string) => {
  const entry = findModuleEntry(value);
  return entry?.value || value?.trim() || '';
};

export const getPermissionModuleLabel = (value: string | undefined, language: string) => {
  const entry = findModuleEntry(value);
  if (entry) {
    return language === 'zh' ? entry.zh : entry.en;
  }

  if (value?.trim()) {
    return value.trim();
  }

  return getPermissionManagementCopy(language === 'zh' ? 'zh' : 'en').modules.uncategorized;
};

export const getPermissionModuleOptions = (language: string) =>
  getPermissionModuleCatalog().map((entry) => ({
    value: entry.value,
    label: language === 'zh' ? entry.zh : entry.en,
  }));

export const getPermissionModuleWeight = (value: string | undefined) => {
  const normalizedValue = normalizePermissionModule(value);
  const index = getPermissionModuleCatalog().findIndex((entry) => entry.value === normalizedValue);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};



