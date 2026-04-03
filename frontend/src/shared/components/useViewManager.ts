import { useLanguageStore } from '../../stores/languageStore';
import { useSystemStore } from '../../stores/systemStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../modules/auth/store/authStore';
import {
  getMenuLabel,
  getViewBreadcrumbPath,
  getViewLabel,
} from '../constants/viewsConfig';
import { systemNotification } from '../utils/notification';
import { buildMenuBreadcrumb, canAccessView, findMatchedMenu } from './viewManagerUtils';

export function useViewManager() {
  const language = useLanguageStore((state) => state.language);
  const t = useLanguageStore((state) => state.t);
  const { addTab } = useUIStore();
  const menus = useSystemStore((state) => state.menus);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);

  const navigateToView = (viewId: string) => {
    if (!canAccessView(viewId, menus, hasPermission, hasRole)) {
      systemNotification.warning(
        language === 'zh' ? '页面不可访问' : 'View unavailable',
        language === 'zh'
          ? '当前菜单或权限已变更，无法继续访问该页面。'
          : 'The page is no longer accessible because menus or permissions changed.',
      );
      return;
    }

    const menu = findMatchedMenu(viewId, menus);
    const label = getMenuLabel(menu, language, t) || getViewLabel(viewId, language, t);
    const breadcrumbPath = menu ? buildMenuBreadcrumb(menu.id, menus, language, t) : getViewBreadcrumbPath(viewId, t);

    addTab({
      id: viewId,
      label,
      closable: true,
      path: breadcrumbPath,
    });
  };

  return {
    navigateToView,
    getViewLabel: (viewId: string) => getViewLabel(viewId, language, t),
    getViewBreadcrumbPath: (viewId: string) => getViewBreadcrumbPath(viewId, t),
  };
}
