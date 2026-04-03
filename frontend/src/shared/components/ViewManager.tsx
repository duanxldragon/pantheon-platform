import { lazy, Suspense, useEffect } from 'react';

import { useAuthStore } from '../../modules/auth/store/authStore';
import type { Menu } from '../../modules/system/types';
import { useLanguageStore } from '../../stores/languageStore';
import type { AppTranslations } from '../../stores/languageStore';
import type { Tab } from '../../stores/uiStore';
import { useUIStore } from '../../stores/uiStore';
import { useSystemStore } from '../../stores/systemStore';
import {
  getMenuLabel,
  getViewBreadcrumbPath,
  getViewConfig,
  getViewConfigByComponent,
  getViewLabel,
  inferMenuComponent,
  inferMenuViewId,
} from '../constants/viewsConfig';
import { systemNotification } from '../utils/notification';
import { RouteGuard } from './RouteGuard';
import {
  ALWAYS_ACCESSIBLE_VIEW_IDS,
  buildMenuBreadcrumb,
  canAccessView,
  findMatchedMenu,
  isMenuVisible,
} from './viewManagerUtils';

function PageSkeleton() {
  const t = useLanguageStore((state) => state.t);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-gray-500">{t.common.loading}</p>
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

export function ViewManager() {
  const language = useLanguageStore((state) => state.language);
  const t = useLanguageStore((state) => state.t);
  const { activeTab, updateTabLabel, updateTabPath, tabs, replaceTabs } = useUIStore();
  const menus = useSystemStore((state) => state.menus);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);

  const activeMenu = findMatchedMenu(activeTab, menus);

  const updateTabInfo = (viewId: string) => {
    const menu = findMatchedMenu(viewId, menus);
    const label = getMenuLabel(menu, language, t) || getViewLabel(viewId, language, t);
    const breadcrumbPath = menu ? buildMenuBreadcrumb(menu.id, menus, language, t) : getViewBreadcrumbPath(viewId, t);

    updateTabLabel(viewId, label);
    updateTabPath(viewId, breadcrumbPath);
  };

  const updateAllTabs = () => {
    tabs.forEach((tab) => {
      updateTabInfo(tab.id);
    });
  };

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

  const renderView = () => {
    const menuViewConfig = activeMenu
      ? getViewConfigByComponent(inferMenuComponent(activeMenu), String(activeMenu.id))
      : undefined;
    const viewConfig = getViewConfig(activeTab) || menuViewConfig;

    if (!viewConfig) {
      const DefaultView = lazy(() =>
        import('../../modules/system/views/SystemDashboard').then((m) => ({
          default: m.SystemDashboard,
        })),
      );
      return (
        <Suspense fallback={<PageSkeleton />}>
          <DefaultView />
        </Suspense>
      );
    }

    const LazyComponent = lazy(viewConfig.component);

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
  };

  return {
    renderView,
    updateAllTabs,
    getViewLabel: (viewId: string) => getViewLabel(viewId, language, t),
    getViewBreadcrumbPath: (viewId: string) => getViewBreadcrumbPath(viewId, t),
  };
}
