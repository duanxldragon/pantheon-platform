import { lazy, Suspense, useEffect, useMemo } from 'react';

import { useAuthStore } from '../../modules/auth/store/auth_store';
import type { Menu } from '../../modules/system/types';
import { useLanguageStore } from '../../stores/language_store';
import type { AppTranslations } from '../../stores/language_store';
import type { Tab } from '../../stores/ui_store';
import { useUIStore } from '../../stores/ui_store';
import { useSystemStore } from '../../stores/system_store';
import {
  getMenuLabel,
  getViewBreadcrumbPath,
  getViewConfig,
  getViewConfigByComponent,
  getViewLabel,
  inferMenuComponent,
  inferMenuViewId,
} from '../constants/views_config';
import { systemNotification } from '../utils/notification';
import { RouteGuard } from './route_guard';
import {
  ALWAYS_ACCESSIBLE_VIEW_IDS,
  buildMenuBreadcrumb,
  canAccessView,
  findMatchedMenu,
  isMenuVisible,
} from './view_manager_utils';

function PageSkeleton() {
  const t = useLanguageStore((state) => state.t);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    </div>
  );
}

function buildTabItem(viewId: string, menus: Menu[], language: string, t: AppTranslations): Tab {
  const menu = findMatchedMenu(viewId, menus);
  return {
    id: viewId,
    label: getMenuLabel(menu, language, t) || getViewLabel(viewId, language, t),
    closable: false,
    path: menu ? buildMenuBreadcrumb(menu.id, menus, language, t) : getViewBreadcrumbPath(viewId, t),
  };
}

function getFallbackViewId(
  tabs: Tab[],
  menus: Menu[],
  hasPermission: (permission: string | readonly string[]) => boolean,
  hasRole: (role: string | readonly string[]) => boolean,
): string {
  const tabFallback = tabs.find((tab) => canAccessView(tab.id, menus, hasPermission, hasRole));
  if (tabFallback) {
    return tabFallback.id;
  }

  const preferredIds = ['system-dashboard', ...ALWAYS_ACCESSIBLE_VIEW_IDS];
  const preferredFallback = preferredIds.find((id) =>
    canAccessView(id, menus, hasPermission, hasRole),
  );
  if (preferredFallback) {
    return preferredFallback;
  }

  const menuFallback = menus.find((menu) => isMenuVisible(menu));
  if (menuFallback) {
    return inferMenuViewId(menuFallback) || String(menuFallback.id);
  }

  return 'profile-center';
}

// Map to store memoized lazy components to avoid recreation on every render
const lazyComponentCache = new Map<string, React.LazyExoticComponent<React.ComponentType<object>>>();

function getLazyComponent(loader: () => Promise<{ default: React.ComponentType<object> }>, id: string) {
  if (!lazyComponentCache.has(id)) {
    lazyComponentCache.set(id, lazy(loader));
  }
  return lazyComponentCache.get(id)!;
}

export function ViewRenderer() {
  const language = useLanguageStore((state) => state.language);
  const t = useLanguageStore((state) => state.t);
  const { activeTab, tabs, replaceTabs } = useUIStore();
  const menus = useSystemStore((state) => state.menus);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);

  useEffect(() => {
    const invalidTabs = tabs.filter((tab) => !canAccessView(tab.id, menus, hasPermission, hasRole));
    const activeTabAccessible = canAccessView(activeTab, menus, hasPermission, hasRole);
    if (invalidTabs.length === 0 && activeTabAccessible) {
      return;
    }

    const validTabs = tabs.filter((tab) => canAccessView(tab.id, menus, hasPermission, hasRole));
    const fallbackViewId = getFallbackViewId(validTabs, menus, hasPermission, hasRole);
    const nextTabs =
      validTabs.length > 0
        ? validTabs
        : [buildTabItem(fallbackViewId, menus, language, t)];
    const nextActiveTab =
      activeTabAccessible && nextTabs.some((tab) => tab.id === activeTab)
        ? activeTab
        : fallbackViewId;

    replaceTabs(nextTabs, nextActiveTab);

    if (invalidTabs.length > 0) {
      systemNotification.warning(
        language === 'zh' ? '页面访问权限已更新' : 'View access updated',
        language === 'zh'
          ? '部分已打开标签页因菜单或权限变化被自动关闭，并切换到当前可访问页面。'
          : 'Some open tabs were closed because menus or permissions changed. The app switched to an accessible page.',
      );
    }
  }, [activeTab, hasPermission, hasRole, language, menus, replaceTabs, t, tabs]);

  const viewElement = useMemo(() => {
    const activeMenu = findMatchedMenu(activeTab, menus);
    const menuViewConfig = activeMenu
      ? getViewConfigByComponent(inferMenuComponent(activeMenu), String(activeMenu.id))
      : undefined;
    const viewConfig = getViewConfig(activeTab) || menuViewConfig;

    if (!viewConfig) {
      const DefaultView = getLazyComponent(
        () => import('../../modules/system/views/system_dashboard').then((m) => ({
          default: m.SystemDashboard,
        })),
        'system-dashboard'
      );
      return (
        <Suspense fallback={<PageSkeleton />}>
          <DefaultView />
        </Suspense>
      );
    }

    const LazyComponent = getLazyComponent(viewConfig.component, viewConfig.id);

    return (
      <RouteGuard
        requiredPermissions={viewConfig.permissions}
        requiredRoles={viewConfig.roles}
      >
        <Suspense fallback={<PageSkeleton />}>
          <LazyComponent />
        </Suspense>
      </RouteGuard>
    );
  }, [activeTab, menus]);

  return viewElement;
}









