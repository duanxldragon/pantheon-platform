import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Download, CheckCircle2, XCircle, Users } from 'lucide-react';

import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { useLanguageStore } from '../../../../stores/languageStore';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { api } from '../../api';
import type { MonitorOverview } from '../../api/monitorApi';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

function formatBytes(bytes: number): string {
  const b = Math.max(0, Number(bytes) || 0);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = b;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SystemMonitor() {
  const { t } = useLanguageStore();
  const i18n = t.systemManagement.monitor;
  const zh = t.language === 'zh';
  const monitorOverviewMessages = createEntityFeedback(zh, { zh: '监控概览', en: 'Monitor overview' });
  const monitorSnapshotMessages = createEntityFeedback(zh, { zh: '监控快照', en: 'Monitor snapshot' });
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryMonitor = hasPermission(systemPermissions.monitor.query);
  const canExportMonitor = hasPermission(systemPermissions.monitor.export);

  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<MonitorOverview | null>(null);
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: i18n.pageTitle,
    dialogs: {},
    guardedDialogs: {},
    closeDialogs: () => undefined,
  });

  const load = async () => {
    if (!canQueryMonitor) {
      setOverview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getOverview();
      setOverview(data);
    } catch {
      toast.error(monitorOverviewMessages.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canQueryMonitor) {
      setOverview(null);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQueryMonitor]);

  return (
    <PageLayout
      title={i18n.pageTitle}
      description={i18n.pageDescription}
      actions={canQueryMonitor ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            className="gap-2 border-gray-200"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 text-primary" />
            {i18n.refresh}
          </Button>
          {canExportMonitor ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!ensureActionPermission(canExportMonitor, zh ? '导出监控快照' : 'export snapshot')) return;
                if (!overview) {
                  return;
                }
                downloadJson(`monitor-snapshot-${new Date().toISOString()}.json`, overview);
                toast.success(monitorSnapshotMessages.exportSuccess);
              }}
              className="gap-2 border-gray-200"
              disabled={!overview}
            >
              <Download className="w-4 h-4" />
              {i18n.exportSnapshot}
            </Button>
          ) : null}
        </div>
      ) : undefined}
    >
      {!canQueryMonitor ? (
        <QueryAccessBoundary
          viewId="system-monitor"
          title={i18n.pageTitle}
          queryPermission={systemPermissions.monitor.query}
        />
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-gray-500">{i18n.uptime}</div>
          <div className="mt-2 text-xl font-semibold text-gray-900">
            {overview ? formatDuration(overview.uptime_sec) : '-'}
          </div>
          {overview?.timestamp && (
            <div className="mt-1 text-[11px] text-gray-400">{new Date(overview.timestamp).toLocaleString()}</div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">{i18n.goroutines}</div>
          <div className="mt-2 text-xl font-semibold text-gray-900">{overview?.goroutines ?? '-'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">{i18n.goVersion}</div>
          <div className="mt-2 text-sm font-semibold text-gray-900 break-all">{overview?.go_version ?? '-'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">{i18n.numCPU}</div>
          <div className="mt-2 text-xl font-semibold text-gray-900">{overview?.num_cpu ?? '-'}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">{t.systemManagement.monitor.coreResourcesTitle}</div>
            <Badge variant="outline">{overview?.tenant_id ? `tenant: ${overview.tenant_id}` : 'master'}</Badge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{i18n.memoryAlloc}</span>
              <span className="font-medium text-gray-900">
                {overview ? formatBytes(overview.memory.alloc) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{i18n.heapAlloc}</span>
              <span className="font-medium text-gray-900">
                {overview ? formatBytes(overview.memory.heap_alloc) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{i18n.memorySys}</span>
              <span className="font-medium text-gray-900">
                {overview ? formatBytes(overview.memory.sys) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">GC</span>
              <span className="font-medium text-gray-900">{overview?.memory.num_gc ?? '-'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">{i18n.serviceHealthTitle}</div>
            {overview?.services?.every((s) => s.ok) ? (
              <Badge className="bg-emerald-100 text-emerald-700">{i18n.allServicesRunning}</Badge>
            ) : (
              <Badge className="bg-rose-100 text-rose-700">{t.status.warning}</Badge>
            )}
          </div>

          <div className="space-y-2">
            {(overview?.services || []).map((s) => (
              <div key={s.name} className="flex items-start justify-between gap-4 p-3 border rounded-lg bg-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {s.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <Badge variant="outline">{s.ok ? t.status.healthy : t.status.error}</Badge>
                  </div>
                  {s.error && <div className="mt-1 text-xs text-rose-700 break-all">{s.error}</div>}
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">{s.latency_ms} ms</div>
              </div>
            ))}

            {!overview?.services?.length && (
              <div className="text-sm text-gray-500 py-10 text-center">{t.common.noData}</div>
            )}
          </div>
        </Card>

        {/* Redis Status & Online Users */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">{i18n.redisOnlineTitle || 'Redis & Online Users'}</div>
          </div>
          <div className="space-y-4">
            {/* Redis Status */}
            {overview?.redis && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-2">
                  {overview.redis.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className="font-medium text-gray-900">Redis</span>
                  <Badge variant="outline">{overview.redis.ok ? t.status.healthy : t.status.error}</Badge>
                </div>
                <div className="text-xs text-gray-500">{overview.redis.latency_ms} ms</div>
              </div>
            )}

            {/* Online Users */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">{i18n.onlineUsers || 'Online Users'}</span>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                {overview?.online?.count ?? '-'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
      </>
      )}
    </PageLayout>
  );
}


