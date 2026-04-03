import { useEffect, useState } from 'react';

import { CheckCircle2, Download, RefreshCw, Users, XCircle } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { ManagementActionBar } from '../../../../shared/components/ui';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { useLanguageStore } from '../../../../stores/languageStore';
import { useAuthStore } from '../../../auth/store/authStore';
import { api } from '../../api';
import type { MonitorOverview } from '../../api/monitorApi';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { getSystemMonitorCopy } from './systemMonitorCopy';

function formatDuration(sec: number): string {
  const secondsTotal = Math.max(0, Math.floor(sec));
  const days = Math.floor(secondsTotal / 86400);
  const hours = Math.floor((secondsTotal % 86400) / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

function formatBytes(bytes: number): string {
  const normalizedBytes = Math.max(0, Number(bytes) || 0);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = normalizedBytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function SystemMonitor() {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getSystemMonitorCopy(language);
  const monitorOverviewMessages = createEntityFeedback(zh, copy.entity.overview);
  const monitorSnapshotMessages = createEntityFeedback(zh, copy.entity.snapshot);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryMonitor = hasPermission(systemPermissions.monitor.query);
  const canExportMonitor = hasPermission(systemPermissions.monitor.export);

  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<MonitorOverview | null>(null);
  const summaryCardClass =
    'h-full rounded-[24px] border border-slate-200/70 bg-white/88 p-5 shadow-[0_20px_48px_-32px_rgba(15,23,42,0.25)] backdrop-blur-sm';
  const panelCardClass =
    'h-full rounded-[28px] border border-slate-200/70 bg-white/88 p-5 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm';
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs: {},
    guardedDialogs: {},
    closeDialogs: () => undefined,
  });

  const load = useCallback(async () => {
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
  }, [canQueryMonitor, monitorOverviewMessages.loadFailed]);

  useEffect(() => {
    if (!canQueryMonitor) {
      setOverview(null);
      return;
    }
    void load();
  }, [canQueryMonitor, load]);

  return (
    <PageLayout
      title={copy.page.title}
      description={copy.page.description}
      actions={
        canQueryMonitor ? (
          <ManagementActionBar>
            <Button
              variant="outline"
              onClick={() => void load()}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 text-primary" />
              {copy.page.refresh}
            </Button>
            {canExportMonitor ? (
              <Button
                variant="outline"
                onClick={() => {
                  if (!ensureActionPermission(canExportMonitor, copy.page.exportSnapshot)) return;
                  if (!overview) return;
                  downloadJson(`monitor-snapshot-${new Date().toISOString()}.json`, overview);
                  toast.success(monitorSnapshotMessages.exportSuccess);
                }}
                className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                disabled={!overview}
              >
                <Download className="h-4 w-4" />
                {copy.page.exportSnapshot}
              </Button>
            ) : null}
          </ManagementActionBar>
        ) : undefined
      }
    >
      {!canQueryMonitor ? (
        <QueryAccessBoundary
          viewId="system-monitor"
          title={copy.page.title}
          queryPermission={systemPermissions.monitor.query}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className={summaryCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{copy.summary.uptime}</div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">
                {overview ? formatDuration(overview.uptime_sec) : '-'}
              </div>
              {overview?.timestamp ? (
                <div className="mt-2 text-[11px] text-slate-400">{new Date(overview.timestamp).toLocaleString()}</div>
              ) : null}
            </Card>
            <Card className={summaryCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{copy.summary.goroutines}</div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{overview?.goroutines ?? '-'}</div>
            </Card>
            <Card className={summaryCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{copy.summary.goVersion}</div>
              <div className="mt-3 break-all text-sm font-semibold text-slate-900">{overview?.go_version ?? '-'}</div>
            </Card>
            <Card className={summaryCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{copy.summary.numCPU}</div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{overview?.num_cpu ?? '-'}</div>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className={`${panelCardClass} lg:col-span-1`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">{copy.panels.coreResourcesTitle}</div>
                <Badge variant="outline" className="rounded-full border-slate-200 bg-white/90 px-3 py-1">
                  {overview?.tenant_id ? `tenant: ${overview.tenant_id}` : copy.panels.master}
                </Badge>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-3">
                  <span className="text-slate-500">{copy.panels.memoryAlloc}</span>
                  <span className="font-semibold text-slate-900">{overview ? formatBytes(overview.memory.alloc) : '-'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-3">
                  <span className="text-slate-500">{copy.panels.heapAlloc}</span>
                  <span className="font-semibold text-slate-900">{overview ? formatBytes(overview.memory.heap_alloc) : '-'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-3">
                  <span className="text-slate-500">{copy.panels.memorySys}</span>
                  <span className="font-semibold text-slate-900">{overview ? formatBytes(overview.memory.sys) : '-'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-3">
                  <span className="text-slate-500">GC</span>
                  <span className="font-semibold text-slate-900">{overview?.memory.num_gc ?? '-'}</span>
                </div>
              </div>
            </Card>

            <Card className={`${panelCardClass} lg:col-span-2`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">{copy.panels.serviceHealthTitle}</div>
                {overview?.services?.every((service) => service.ok) ? (
                  <Badge className="rounded-full bg-emerald-100 text-emerald-700">{copy.panels.allServicesRunning}</Badge>
                ) : (
                  <Badge className="rounded-full bg-rose-100 text-rose-700">{copy.panels.warning}</Badge>
                )}
              </div>

              <div className="space-y-2">
                {(overview?.services || []).map((service) => (
                  <div
                    key={service.name}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white/92 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {service.ok ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-600" />
                        )}
                        <span className="font-medium text-slate-900">{service.name}</span>
                        <Badge variant="outline" className="rounded-full bg-slate-50">
                          {service.ok ? copy.panels.healthy : copy.panels.error}
                        </Badge>
                      </div>
                      {service.error ? <div className="mt-1 break-all text-xs text-rose-700">{service.error}</div> : null}
                    </div>
                    <div className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">{service.latency_ms} ms</div>
                  </div>
                ))}

                {!overview?.services?.length ? (
                  <div className="py-10 text-center text-sm text-slate-500">{copy.panels.noData}</div>
                ) : null}
              </div>
            </Card>

            <Card className={panelCardClass}>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">{copy.panels.redisAndUsers}</div>
              </div>
              <div className="space-y-4">
                {overview?.redis ? (
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/92 p-4">
                    <div className="flex items-center gap-2">
                      {overview.redis.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      )}
                      <span className="font-medium text-slate-900">Redis</span>
                      <Badge variant="outline" className="rounded-full bg-slate-50">
                        {overview.redis.ok ? copy.panels.healthy : copy.panels.error}
                      </Badge>
                    </div>
                    <div className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">{overview.redis.latency_ms} ms</div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/92 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-slate-900">{copy.panels.onlineUsers}</span>
                  </div>
                  <Badge className="rounded-full bg-blue-100 text-blue-700">{overview?.online?.count ?? '-'}</Badge>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </PageLayout>
  );
}
