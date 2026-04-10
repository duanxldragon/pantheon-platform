/**
 * Dashboard视图组件
 * 显示系统概览和统计信息
 */
import { useI18n } from '../../hooks/use_i18n';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export function DashboardView() {
  const { t } = useI18n();
  const navigate = useNavigate();

  // 导航到各模块
  const navigateToModule = (path: string) => {
    navigate(path);
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('modules.system.dashboard.title')}</h1>
        <Button variant="outline" onClick={() => navigateToModule('/system')}>
          {t('common.actions.more')}
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">
            {t('modules.system.dashboard.totalUsers')}
          </h3>
          <p className="text-3xl font-bold text-blue-600">1,234</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">
            {t('modules.system.dashboard.activeUsers')}
          </h3>
          <p className="text-3xl font-bold text-green-600">567</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">
            {t('modules.system.dashboard.totalRoles')}
          </h3>
          <p className="text-3xl font-bold text-purple-600">12</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">
            {t('modules.system.dashboard.todayLogins')}
          </h3>
          <p className="text-3xl font-bold text-orange-600">89</p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">{t('common.ui.dashboard')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => navigateToModule('/system/users')}
            className="justify-start"
          >
            👥 {t('modules.system.user.title')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateToModule('/system/roles')}
            className="justify-start"
          >
            🔐 {t('modules.system.role.title')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateToModule('/system/settings')}
            className="justify-start"
          >
            ⚙️ {t('modules.system.setting.title')}
          </Button>
        </div>
      </div>

      {/* 系统概览 */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">{t('modules.system.monitor.title')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span>{t('modules.system.dashboard.systemVersion')}</span>
            <span className="font-semibold">v1.0.0</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span>{t('modules.system.dashboard.environment')}</span>
            <span className="font-semibold text-green-600">
              {t('common.status.active')}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span>{t('modules.system.dashboard.databaseStatus')}</span>
            <span className="font-semibold text-green-600">
              {t('common.status.success')}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span>{t('modules.system.dashboard.cacheStatus')}</span>
            <span className="font-semibold text-green-600">
              {t('common.status.success')}
            </span>
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">{t('modules.system.log.title')}</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border-b">
            <span>{t('modules.system.log.user')} admin</span>
            <span className="text-sm text-gray-600">{t('common.time.justNow')}</span>
          </div>
          <div className="flex items-center justify-between p-3 border-b">
            <span>{t('modules.system.log.action')} {t('common.actions.create')}</span>
            <span className="text-sm text-gray-600">{t('common.time.minuteAgo', { count: 5 })}</span>
          </div>
          <div className="flex items-center justify-between p-3">
            <span>{t('modules.system.log.status')} {t('common.status.success')}</span>
            <span className="text-sm text-gray-600">{t('common.time.hourAgo', { count: 1 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
