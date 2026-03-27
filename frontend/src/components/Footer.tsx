import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore } from '../stores/languageStore';
import { Server, Activity, HardDrive, Wifi } from 'lucide-react';
import { Badge } from './ui/badge';

export function Footer() {
  const { theme } = useThemeStore();
  const { t } = useLanguageStore();

  const systemStatus = {
    api: 'normal',
    database: 'normal',
    cache: 'normal',
  };

  const getStatusBadge = (status: string) => {
    if (status === 'normal') {
      return <Badge className="bg-green-100 text-green-700 text-xs">{t.footer.normal}</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700 text-xs">{t.footer.error}</Badge>;
  };

  return (
    <footer
      className="h-10 border-t flex items-center justify-between px-6 text-xs transition-colors duration-200"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        color: theme.colors.textSecondary,
      }}
    >
      {/* 左侧：版权信息 */}
      <div className="flex items-center gap-4">
        <span>&copy; 2025 {t.footer.copyright}</span>
        <span className="text-xs">v1.0.0</span>
      </div>

      {/* 中间：系统状态 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Server className="w-3 h-3" />
          <span>API</span>
          {getStatusBadge(systemStatus.api)}
        </div>
        <div className="flex items-center gap-2">
          <HardDrive className="w-3 h-3" />
          <span>{t.footer.database}</span>
          {getStatusBadge(systemStatus.database)}
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3" />
          <span>{t.footer.cache}</span>
          {getStatusBadge(systemStatus.cache)}
        </div>
      </div>

      {/* 右侧：在线状态 */}
      <div className="flex items-center gap-2">
        <Wifi className="w-3 h-3 text-green-500" />
        <span style={{ color: theme.colors.text }}>{t.footer.systemStatus}</span>
      </div>
    </footer>
  );
}