import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, LogOut, Monitor, Smartphone } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { ConfirmDialog } from '../../../../../shared/components/ui/confirm_dialog';
import { systemNotification } from '../../../../../shared/utils/notification';
import { useLanguageStore } from '../../../../../stores/language_store';
import { useThemeStore } from '../../../../../stores/theme_store';
import { authApi, type SessionInfo } from '../../../api/auth_api';
import { useProfilePreferenceSettings } from '../../hooks/use_profile_preference_settings';

interface SessionItem {
  id: string;
  name: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  type: 'desktop' | 'mobile';
}

function detectDeviceType(name: string): 'desktop' | 'mobile' {
  return /iphone|android|mobile|ipad/i.test(name) ? 'mobile' : 'desktop';
}

function formatRelativeTime(timestamp: number, zh: boolean): string {
  if (!timestamp) {
    return zh ? '未知' : 'Unknown';
  }

  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return zh ? '刚刚' : 'Just now';
  }
  if (minutes < 60) {
    return zh ? `${minutes} 分钟前` : `${minutes} minute(s) ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return zh ? `${hours} 小时前` : `${hours} hour(s) ago`;
  }

  const days = Math.floor(hours / 24);
  return zh ? `${days} 天前` : `${days} day(s) ago`;
}

function mapSession(session: SessionInfo, zh: boolean): SessionItem {
  const name = session.deviceName || (zh ? '未知设备' : 'Unknown device');
  return {
    id: session.jti,
    name,
    ip: session.ipAddress || '-',
    location: zh ? '未知地区' : 'Unknown',
    lastActive: formatRelativeTime(session.lastActive, zh),
    isCurrent: session.isCurrent,
    type: detectDeviceType(name),
  };
}

export function SessionManagement() {
  const { theme } = useThemeStore();
  const { language } = useLanguageStore();
  const { compactMode } = useProfilePreferenceSettings();
  const zh = language === 'zh';
  const copy = {
    sessionRevoked: zh ? '会话已终止' : 'Session revoked',
    allRevoked: zh ? '其他会话已全部终止' : 'All other sessions revoked',
    activeSessions: zh ? '活动会话' : 'Active Sessions',
    activeSessionsDesc: zh ? '查看当前账号所有在线会话，并及时终止可疑设备。' : 'Review all active sessions and revoke suspicious devices.',
    revokeOthers: zh ? '终止其他会话' : 'Revoke Others',
    refresh: zh ? '刷新' : 'Refresh',
    loading: zh ? '加载中...' : 'Loading...',
    currentSession: zh ? '当前会话' : 'Current',
    otherSession: zh ? '其他会话' : 'Other',
    revoke: zh ? '终止' : 'Revoke',
    noSessions: zh ? '暂无活动会话' : 'No active sessions',
    loadFailed: zh ? '加载会话失败' : 'Failed to load sessions',
    revokeFailed: zh ? '终止会话失败' : 'Failed to revoke session',
    revokeOthersFailed: zh ? '终止其他会话失败' : 'Failed to revoke other sessions',
    revokeTitle: zh ? '确认终止会话' : 'Confirm Session Revoke',
    revokeDesc: (name: string) =>
      zh
        ? `终止会话“${name}”后，该设备需要重新登录。`
        : `Revoking "${name}" signs that device out immediately.`,
    revokeOthersTitle: zh ? '确认终止其他会话' : 'Confirm Revoke Others',
    revokeOthersDesc: (count: number) =>
      zh
        ? `将终止其余 ${count} 个在线会话，当前设备保持登录。`
        : `This revokes ${count} other active session(s) while keeping the current device signed in.`,
    securityTips: zh ? '安全建议' : 'Security Tips',
    noUnknownDevices: zh ? '定期检查活动会话，确认没有陌生设备在线。' : 'Review active sessions regularly for unknown devices.',
    signOutShared: zh ? '在共享或公共设备上使用后，请及时退出登录。' : 'Sign out after using shared or public devices.',
    revokeSuspicious: zh ? '发现异常会话时，请立即终止并同步修改密码。' : 'Revoke suspicious sessions and change your password immediately.',
    cancel: zh ? '取消' : 'Cancel',
  };

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<SessionItem | null>(null);
  const [revokeOthersOpen, setRevokeOthersOpen] = useState(false);

  const otherSessions = useMemo(() => sessions.filter((item) => !item.isCurrent), [sessions]);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApi.listSessions();
      setSessions((res.data.sessions || []).map((session) => mapSession(session, zh)));
    } catch (error) {
      console.error('Failed to load sessions', error);
      setSessions([]);
      systemNotification.error(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed, zh]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const revokeSession = async (id: string) => {
    try {
      setRevokeLoading(true);
      await authApi.kickSession(id);
      setSessions((current) => current.filter((item) => item.id !== id));
      systemNotification.success(copy.sessionRevoked);
    } catch (error) {
      console.error('Failed to revoke session', error);
      systemNotification.error(copy.revokeFailed);
    } finally {
      setRevokeLoading(false);
      setRevokeTarget(null);
    }
  };

  const revokeAll = async () => {
    if (otherSessions.length === 0) {
      setRevokeOthersOpen(false);
      return;
    }

    try {
      setRevokeLoading(true);
      await Promise.all(otherSessions.map((session) => authApi.kickSession(session.id)));
      setSessions((current) => current.filter((item) => item.isCurrent));
      systemNotification.success(copy.allRevoked);
    } catch (error) {
      console.error('Failed to revoke other sessions', error);
      systemNotification.error(copy.revokeOthersFailed);
      await loadSessions();
    } finally {
      setRevokeLoading(false);
      setRevokeOthersOpen(false);
    }
  };

  return (
    <div className={compactMode ? 'space-y-4' : 'space-y-6'}>
      <Card
        className={compactMode ? 'p-4' : 'p-6'}
        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg" style={{ color: theme.colors.text }}>
              {copy.activeSessions}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {copy.activeSessionsDesc}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadSessions()} disabled={loading || revokeLoading}>
              {copy.refresh}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRevokeOthersOpen(true)}
              disabled={otherSessions.length === 0 || loading || revokeLoading}
            >
              {copy.revokeOthers}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <Card
            className="p-6 text-center text-sm"
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textSecondary }}
          >
            {copy.loading}
          </Card>
        ) : sessions.length === 0 ? (
          <Card
            className="p-6 text-center text-sm"
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textSecondary }}
          >
            {copy.noSessions}
          </Card>
        ) : (
          sessions.map((session) => {
            const Icon = session.type === 'desktop' ? Monitor : Smartphone;
            return (
              <Card
                key={session.id}
                className={compactMode ? 'p-3' : 'p-4'}
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: theme.colors.hover }}>
                      <Icon className="h-5 w-5" style={{ color: theme.colors.primary }} />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.text }}>
                        {session.name}
                      </div>
                      <div
                        className="mt-1 flex flex-wrap items-center gap-3 text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        <span>{session.location}</span>
                        <span>{session.ip}</span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {session.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={session.isCurrent ? 'default' : 'outline'}>
                      {session.isCurrent ? copy.currentSession : copy.otherSession}
                    </Badge>
                    {!session.isCurrent ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRevokeTarget(session)}
                        disabled={revokeLoading}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {copy.revoke}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Card
        className={compactMode ? 'p-3' : 'p-4'}
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
      >
        <div className="text-sm font-medium" style={{ color: theme.colors.text }}>
          {copy.securityTips}
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: theme.colors.textSecondary }}>
          <li>{copy.noUnknownDevices}</li>
          <li>{copy.signOutShared}</li>
          <li>{copy.revokeSuspicious}</li>
        </ul>
      </Card>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
          }
        }}
        onConfirm={() => {
          if (revokeTarget) {
            void revokeSession(revokeTarget.id);
          }
        }}
        title={copy.revokeTitle}
        description={revokeTarget ? copy.revokeDesc(revokeTarget.name) : ' '}
        confirmText={copy.revoke}
        cancelText={copy.cancel}
        loading={revokeLoading}
        variant="warning"
      />

      <ConfirmDialog
        open={revokeOthersOpen}
        onOpenChange={setRevokeOthersOpen}
        onConfirm={() => {
          void revokeAll();
        }}
        title={copy.revokeOthersTitle}
        description={copy.revokeOthersDesc(otherSessions.length)}
        confirmText={copy.revokeOthers}
        cancelText={copy.cancel}
        loading={revokeLoading}
        variant="warning"
      />
    </div>
  );
}
