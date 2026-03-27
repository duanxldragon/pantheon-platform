import { useState } from 'react';
import { Clock3, LogOut, Monitor, Smartphone } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { systemNotification } from '../../../../../shared/utils/notification';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useThemeStore } from '../../../../../stores/themeStore';
import { useProfilePreferenceSettings } from '../../hooks/useProfilePreferenceSettings';

interface SessionItem {
  id: string;
  name: string;
  ip: string;
  location: {
    zh: string;
    en: string;
  };
  lastActiveMinutes: number;
  isCurrent: boolean;
  type: 'desktop' | 'mobile';
}

function buildMockSessions(): SessionItem[] {
  return [
    {
      id: 'current-desktop',
      name: 'Chrome on Windows',
      location: {
        zh: '上海',
        en: 'Shanghai',
      },
      ip: '192.168.1.100',
      lastActiveMinutes: 0,
      isCurrent: true,
      type: 'desktop',
    },
    {
      id: 'iphone',
      name: 'Safari on iPhone',
      location: {
        zh: '北京',
        en: 'Beijing',
      },
      ip: '192.168.1.218',
      lastActiveMinutes: 10,
      isCurrent: false,
      type: 'mobile',
    },
  ];
}

function formatRelativeTime(minutes: number, zh: boolean): string {
  if (minutes <= 0) {
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
    currentSession: zh ? '当前会话' : 'Current',
    otherSession: zh ? '其他会话' : 'Other',
    revoke: zh ? '终止' : 'Revoke',
    securityTips: zh ? '安全建议' : 'Security Tips',
    noUnknownDevices: zh ? '定期检查活动会话，确认没有陌生设备在线。' : 'Review active sessions regularly for unknown devices.',
    signOutShared: zh ? '在共享或公共设备上使用后，请及时退出登录。' : 'Sign out after using shared or public devices.',
    revokeSuspicious: zh ? '发现异常会话时，请立即终止并同步修改密码。' : 'Revoke suspicious sessions and change your password immediately.',
  };

  const [sessions, setSessions] = useState<SessionItem[]>(() => buildMockSessions());

  const revokeSession = (id: string) => {
    setSessions((current) => current.filter((item) => item.id !== id));
    systemNotification.success(copy.sessionRevoked);
  };

  const revokeAll = () => {
    setSessions((current) => current.filter((item) => item.isCurrent));
    systemNotification.success(copy.allRevoked);
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
          <Button variant="outline" onClick={revokeAll}>
            {copy.revokeOthers}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {sessions.map((session) => {
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
                      <span>{zh ? session.location.zh : session.location.en}</span>
                      <span>{session.ip}</span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatRelativeTime(session.lastActiveMinutes, zh)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={session.isCurrent ? 'default' : 'outline'}>
                    {session.isCurrent ? copy.currentSession : copy.otherSession}
                  </Badge>
                  {!session.isCurrent ? (
                    <Button variant="outline" size="sm" onClick={() => revokeSession(session.id)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {copy.revoke}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
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
    </div>
  );
}
