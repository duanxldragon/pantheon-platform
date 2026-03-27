import { Dashboard } from '../../../../components/Dashboard';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useLanguageStore } from '../../../../stores/languageStore';
import { useAuthStore } from '../../../auth/store/authStore';
import { systemPermissions } from '../../constants/permissions';

export function SystemDashboard() {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryDashboard = hasPermission(systemPermissions.dashboard.query);

  if (!canQueryDashboard) {
    return (
      <QueryAccessBoundary
        viewId="system-dashboard"
        title={t?.menu?.systemOverview || (zh ? '系统概览' : 'System Overview')}
        queryPermission={systemPermissions.dashboard.query}
      />
    );
  }

  return <Dashboard />;
}
