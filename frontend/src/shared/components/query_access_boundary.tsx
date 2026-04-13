import { useEffect, useMemo, useRef } from 'react';

import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAuthStore } from '../../modules/auth/store/auth_store';
import { useLanguageStore } from '../../stores/language_store';
import { useUIStore } from '../../stores/ui_store';
import { getViewBreadcrumbPath, getViewConfig, getViewLabel } from '../constants/views_config';
import { systemNotification } from '../utils/notification';
import { resolveQueryAccessFallback } from './access_control_utils';

interface QueryAccessBoundaryProps {
  viewId: string;
  title: string;
  queryPermission: string | readonly string[];
  description?: string;
  notificationDescription?: string;
  autoRedirectMs?: number;
}

function canAccessFallbackView(
  viewId: string,
  hasPermission: (permission: string | readonly string[]) => boolean,
  hasRole: (role: string | readonly string[]) => boolean,
) {
  if (viewId === 'profile-center' || viewId === 'account-settings') {
    return true;
  }

  const config = getViewConfig(viewId);
  if (!config) {
    return false;
  }
  if (config.permissions && !hasPermission(config.permissions)) {
    return false;
  }
  if (config.roles && !hasRole(config.roles)) {
    return false;
  }
  return true;
}

export function QueryAccessBoundary({
  viewId,
  title,
  queryPermission,
  description,
  notificationDescription,
  autoRedirectMs = 1200,
}: QueryAccessBoundaryProps) {
  const { language, t } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);
  const { activeTab, tabs, replaceTabs } = useUIStore();
  const notifiedRef = useRef(false);

  const canQuery = hasPermission(queryPermission);

  const fallback = useMemo(() => {
    return resolveQueryAccessFallback(
      tabs,
      viewId,
      (candidateViewId) => canAccessFallbackView(candidateViewId, hasPermission, hasRole),
    );
  }, [hasPermission, hasRole, tabs, viewId]);

  useEffect(() => {
    if (canQuery || activeTab !== viewId) {
      notifiedRef.current = false;
      return;
    }

    if (!notifiedRef.current) {
      notifiedRef.current = true;
      systemNotification.warning(
        language === 'zh' ? '查询权限已失效' : 'Query access removed',
        notificationDescription || (
          language === 'zh'
            ? `当前账号已失去「${title}」查询权限，页面数据区已收起，并将自动返回到可访问页面。`
            : `Query access to "${title}" was removed. The page will return to an accessible view automatically.`
        ),
      );
    }

    const timer = window.setTimeout(() => {
      const nextTabs = fallback.existingTabs.length > 0
        ? fallback.existingTabs
        : [{
          id: fallback.id,
          label: getViewLabel(fallback.id, language, t),
          closable: fallback.id !== 'system-dashboard',
          path: getViewBreadcrumbPath(fallback.id, t),
        }];

      replaceTabs(nextTabs, fallback.id);
    }, autoRedirectMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeTab, autoRedirectMs, canQuery, fallback.existingTabs, fallback.id, language, notificationDescription, replaceTabs, t, title, viewId]);

  if (canQuery) {
    return null;
  }

  return (
    <Card className="border-dashed border-amber-200 bg-amber-50/60">
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          {language === 'zh' ? `${title}查询权限已失效` : `Query access removed for ${title}`}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {description || (
            language === 'zh'
              ? '为避免继续展示过期数据，页面列表、搜索区和批量操作区已自动收起。请联系管理员恢复查询权限。'
              : 'To avoid showing stale data, the list, filters, and batch actions have been hidden. Contact an administrator to restore query access.'
          )}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
            <Lock className="h-3.5 w-3.5" />
            {language === 'zh' ? '数据区已安全收起' : 'Data area safely collapsed'}
          </span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">
            {language === 'zh'
              ? `${Math.round(autoRedirectMs / 100) / 10} 秒后自动返回可访问页面`
              : `Auto-return in ${Math.round(autoRedirectMs / 100) / 10}s`}
          </span>
        </div>
        <Button
          variant="outline"
          className="mt-6 gap-2"
          onClick={() => {
            const nextTabs = fallback.existingTabs.length > 0
              ? fallback.existingTabs
              : [{
                id: fallback.id,
                label: getViewLabel(fallback.id, language, t),
                closable: fallback.id !== 'system-dashboard',
                path: getViewBreadcrumbPath(fallback.id, t),
              }];

            replaceTabs(nextTabs, fallback.id);
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          {language === 'zh' ? '立即返回' : 'Return now'}
        </Button>
      </div>
    </Card>
  );
}







