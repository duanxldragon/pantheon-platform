/**
 * 用户个人中心视图组件
 */
import { useI18n } from '../../hooks/use_i18n';
import { useAuthStore } from '../../modules/auth/store/auth_store';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function UserProfileView() {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-gray-600">{t('common.status.loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('modules.auth.profile.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('modules.auth.profile.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-gray-600">👤</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.username}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">{t('modules.auth.profile.realName')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('modules.auth.profile.email')}:</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('modules.auth.profile.phone')}:</span>
                    <span>{user.phone || t('common.ui.none')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 安全设置 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('modules.auth.profile.security')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('modules.auth.login.2fa.title')}:</span>
                <span className="text-green-600 font-semibold">
                  {t('common.status.active')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('common.time.lastLogin')}:</span>
                <span>
                  {user.lastLoginTime
                    ? new Date(user.lastLoginTime).toLocaleString()
                    : t('common.time.never')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('modules.system.log.login.ip')}:</span>
                <span>{user.lastLoginIp || t('common.ui.unknown')}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button variant="outline" className="w-full">
                {t('modules.auth.profile.changePassword')}
              </Button>
              <Button variant="outline" className="w-full">
                {t('modules.auth.profile.2faSettings')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 组织信息 */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{t('modules.auth.profile.department')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">{t('modules.system.department.title')}</h4>
              <p className="text-gray-600">
                {user.departmentId || t('common.ui.none')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t('modules.system.position.title')}</h4>
              <p className="text-gray-600">
                {user.positionId || t('common.ui.none')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
