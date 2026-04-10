import { useLanguageStore } from '../stores/language_store';
import { Server, Activity, HardDrive, Wifi } from 'lucide-react';
import { Badge } from './ui/badge';

export function Footer() {
  const { t } = useLanguageStore();

  const systemStatus = {
    api: 'normal',
    database: 'normal',
    cache: 'normal',
  };

  const getStatusBadge = (status: string) => {
    if (status === 'normal') {
      return <Badge className="bg-success/10 text-success text-xs border-success/20">{t.footer.normal}</Badge>;
    }
    return <Badge className="bg-destructive/10 text-destructive text-xs border-destructive/20">{t.footer.error}</Badge>;
  };

  return (
    <footer className="h-10 border-t flex items-center justify-between px-6 text-xs transition-colors duration-200 bg-card border-border text-muted-foreground">
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
        <Wifi className="w-3 h-3 text-success" />
        <span className="text-foreground">{t.footer.systemStatus}</span>
      </div>
    </footer>
  );
}
