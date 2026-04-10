import type { AppTranslations } from '../../stores/language_store';
import type { Menu } from '../../modules/system/types';
import {
  getMenuLabel,
  getViewConfig,
  getViewConfigByComponent,
  inferMenuComponent,
  inferMenuViewId,
} from '../constants/views_config';

export const ALWAYS_ACCESSIBLE_VIEW_IDS = new Set(['profile-center', 'account-settings']);

export function findMatchedMenu(viewId: string, menus: Menu[]): Menu | undefined {
  return menus.find(
    (menu) => String(menu.id) === String(viewId) || inferMenuViewId(menu) === viewId,
  );
}

export function isMenuVisible(menu: Menu): boolean {
  return menu.status === 'active' && menu.visible !== false && menu.type !== 'button';
}

export function canAccessView(
  viewId: string,
  menus: Menu[],
  hasPermission: (permission: string | readonly string[]) => boolean,
  hasRole: (role: string | readonly string[]) => boolean,
): boolean {
  if (ALWAYS_ACCESSIBLE_VIEW_IDS.has(viewId)) {
    return true;
  }

  const matchedMenu = findMatchedMenu(viewId, menus);
  if (menus.length > 0) {
    if (!matchedMenu || !isMenuVisible(matchedMenu)) {
      return false;
    }

    const viewConfig =
      getViewConfig(viewId) ||
      getViewConfigByComponent(inferMenuComponent(matchedMenu), String(matchedMenu.id));
    const requiredPermissions =
      viewConfig?.permissions || (matchedMenu.permissions?.length ? matchedMenu.permissions : undefined);
    const requiredRoles = viewConfig?.roles;

    if (requiredPermissions && !hasPermission(requiredPermissions)) {
      return false;
    }
    if (requiredRoles && !hasRole(requiredRoles)) {
      return false;
    }

    return true;
  }

  const viewConfig = getViewConfig(viewId);
  if (!viewConfig) {
    return viewId === 'system-dashboard';
  }
  if (viewConfig.permissions && !hasPermission(viewConfig.permissions)) {
    return false;
  }
  if (viewConfig.roles && !hasRole(viewConfig.roles)) {
    return false;
  }

  return true;
}

export function buildMenuBreadcrumb(
  menuId: string | number,
  menus: Array<{ id: string | number; name: string; title?: string; path?: string; component?: string; parentId?: string | number | null }>,
  language: string,
  t: AppTranslations,
): string[] {
  const trail: string[] = [];
  let current = menus.find((item) => String(item.id) === String(menuId));

  while (current) {
    trail.unshift(getMenuLabel(current, language, t));
    if (current.parentId === undefined || current.parentId === null || current.parentId === '') {
      break;
    }
    current = menus.find((item) => String(item.id) === String(current?.parentId));
  }

  return trail;
}




