import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../stores/language_store';
import { useSystemStore } from '../../stores/system_store';
import { useUIStore } from '../../stores/ui_store';
import { useAuthStore } from '../../modules/auth/store/auth_store';
import {
  getMenuLabel,
  getViewBreadcrumbPath,
  getViewLabel,
  getViewPath,
} from '../constants/views_config';
import { systemNotification } from '../utils/notification';
import { buildMenuBreadcrumb, canAccessView, findMatchedMenu } from './view_manager_utils';

export function useViewManager() {
  const navigate = useNavigate();
  const language = useLanguageStore((state) => state.language);
  const t = useLanguageStore((state) => state.t);
  const { addTab, tabs, updateTabLabel, updateTabPath } = useUIStore();
  const menus = useSystemStore((state) => state.menus);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);

  const getTabInfo = useCallback((viewId: string) => {
    const menu = findMatchedMenu(viewId, menus);
    const label = getMenuLabel(menu, language, t) || getViewLabel(viewId, language, t);
    const breadcrumbPath = menu ? buildMenuBreadcrumb(menu.id, menus, language, t) : getViewBreadcrumbPath(viewId, t);
    
    return { label, breadcrumbPath };
  }, [language, menus, t]);

  const navigateToView = useCallback((viewId: string) => {
    if (!canAccessView(viewId, menus, hasPermission, hasRole)) {
      systemNotification.warning(
        language === 'zh' ? '页面不可访问' : 'View unavailable',
        language === 'zh'
          ? '当前菜单或权限已变更，无法继续访问该页面。'
          : 'The page is no longer accessible because menus or permissions changed.',
      );
      return;
    }

    const { label, breadcrumbPath } = getTabInfo(viewId);

    addTab({
      id: viewId,
      label,
      closable: true,
      path: breadcrumbPath,
    });
    const routePath = getViewPath(viewId);
    if (routePath) {
      navigate(routePath);
    }
  }, [addTab, getTabInfo, hasPermission, hasRole, language, menus, navigate]);

  const updateAllTabs = useCallback(() => {
    tabs.forEach((tab) => {
      const { label, breadcrumbPath } = getTabInfo(tab.id);
      updateTabLabel(tab.id, label);
      updateTabPath(tab.id, breadcrumbPath);
    });
  }, [getTabInfo, tabs, updateTabLabel, updateTabPath]);

  return {
    navigateToView,
    updateAllTabs,
    getViewLabel: useCallback((viewId: string) => getViewLabel(viewId, language, t), [language, t]),
    getViewBreadcrumbPath: useCallback((viewId: string) => getViewBreadcrumbPath(viewId, t), [t]),
  };
}







