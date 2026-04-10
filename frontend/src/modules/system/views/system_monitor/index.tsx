import { Activity, ArrowDownUp, CheckCircle2, Download, Eye, HardDrive, RefreshCw, ServerCog, Users, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Progress } from '../../../../components/ui/progress';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import {
  DetailCodeBlock,
  DetailKeyValueItem,
  DetailDialogWrapper,
  DetailKeyValueSection,
  ManagementContentCard,
  ManagementFocusCard,
  ManagementMetricCard,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/use_action_permission_dialog_guard';
import { useLanguageStore } from '../../../../stores/language_store';
import { useAuthStore } from '../../../auth/store/auth_store';
import { api } from '../../api';
import type { MonitorDiskStatus, MonitorOverview, MonitorServiceStatus } from '../../api/monitor_api';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { getSystemMonitorCopy } from './system_monitor_copy';

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

function formatRate(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
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
  const [selectedService, setSelectedService] = useState<MonitorServiceStatus | null>(null);
  const [selectedDisk, setSelectedDisk] = useState<MonitorDiskStatus | null>(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const panelCardClass =
    'h-full rounded-[28px] border border-slate-200/70 bg-white/88 p-5 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm';
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs: {},
    guardedDialogs: {},
    closeDialogs: () => undefined,
  });
  const openSnapshot = useCallback(() => {
    if (!ensureActionPermission(canQueryMonitor, copy.page.viewSnapshot)) {
      return;
    }
    setSelectedService(null);
    setSelectedDisk(null);
    setSnapshotOpen(true);
  }, [canQueryMonitor, copy.page.viewSnapshot, ensureActionPermission]);

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
    const timer = setInterval(() => void load(), 10000);
    return () => clearInterval(timer);
  }, [canQueryMonitor, load]);

  useEffect(() => {
    if (!overview) {
      setSelectedService(null);
      setSelectedDisk(null);
      setSnapshotOpen(false);
      return;
    }

    setSelectedService((current) => {
      if (!current) {
        return current;
      }
      return overview.services.find((service) => service.name === current.name) ?? null;
    });

    setSelectedDisk((current) => {
      if (!current) {
        return current;
      }
      return overview.disk?.find((disk) => disk.path === current.path) ?? null;
    });
  }, [overview]);

  const healthyServiceCount = useMemo(
    () => overview?.services.filter((service) => service.ok).length ?? 0,
    [overview],
  );
  const firstUnhealthyService = useMemo(
    () => overview?.services.find((service) => !service.ok) ?? overview?.services[0] ?? null,
    [overview],
  );
  const firstDisk = useMemo(() => overview?.disk?.[0] ?? null, [overview]);
  const highestUsageDisk = useMemo(() => {
    if (!overview?.disk?.length) return null;
    return [...overview.disk].sort((left, right) => right.usedPercent - left.usedPercent)[0] ?? null;
  }, [overview]);
  const unhealthyServiceCount = useMemo(
    () => Math.max(0, (overview?.services?.length ?? 0) - healthyServiceCount),
    [healthyServiceCount, overview?.services?.length],
  );
  const diskPressureHigh = (highestUsageDisk?.usedPercent ?? 0) >= 80;
  const monitorChecklist = useMemo(
    () => [
      {
        label: zh ? '服务健康' : 'Service Health',
        ok: unhealthyServiceCount === 0,
        detail:
          unhealthyServiceCount === 0
            ? zh ? '当前无异常服务' : 'No unhealthy services'
            : zh ? `${unhealthyServiceCount} 个服务需处理` : `${unhealthyServiceCount} services need attention`,
      },
      {
        label: zh ? '磁盘压力' : 'Disk Pressure',
        ok: !diskPressureHigh,
        detail: highestUsageDisk
          ? `${highestUsageDisk.path} · ${highestUsageDisk.usedPercent.toFixed(1)}%`
          : copy.panels.noData,
      },
      {
        label: 'Redis',
        ok: overview?.redis?.ok ?? false,
        detail: overview?.redis ? `${overview.redis.latencyMs} ms` : copy.panels.noData,
      },
    ],
    [zh, unhealthyServiceCount, diskPressureHigh, highestUsageDisk, overview?.redis, copy.panels.noData],
  );
  const snapshotTimestampText = overview?.timestamp
    ? new Date(overview.timestamp).toLocaleString()
    : zh
      ? '等待采样'
      : 'Awaiting snapshot';
  const reviewOutcome = useMemo(() => {
    if (unhealthyServiceCount > 0) {
      return {
        variant: 'warning' as const,
        label: zh ? '优先处理异常服务' : 'Prioritize unhealthy services',
        detail: zh
          ? '建议先进入服务详情，确认延迟、连接池和错误说明。'
          : 'Open service details first to review latency, connection pool, and error notes.',
        actionLabel: copy.page.viewDetail,
        action: () => {
          if (firstUnhealthyService) {
            setSelectedService(firstUnhealthyService);
          }
        },
        disabled: !firstUnhealthyService,
      };
    }

    if (diskPressureHigh) {
      return {
        variant: 'warning' as const,
        label: zh ? '关注磁盘容量压力' : 'Review disk capacity pressure',
        detail: zh
          ? '建议检查高占用磁盘的容量趋势与清理空间。'
          : 'Review the highest-usage disk and plan cleanup capacity.',
        actionLabel: copy.page.viewDiskDetail,
        action: () => {
          if (highestUsageDisk) {
            setSelectedDisk(highestUsageDisk);
          }
        },
        disabled: !highestUsageDisk,
      };
    }

    if (overview && !overview.redis?.ok) {
      return {
        variant: 'warning' as const,
        label: zh ? '关注 Redis 响应' : 'Review Redis responsiveness',
        detail: zh
          ? '服务与磁盘稳定，但 Redis 仍需要进一步确认。'
          : 'Services and disks look stable, but Redis still needs follow-up.',
        actionLabel: copy.page.viewSnapshot,
        action: openSnapshot,
        disabled: false,
      };
    }

    return {
      variant: 'success' as const,
      label: zh ? '本轮巡检通过' : 'Review passed',
      detail: zh
        ? '当前服务、磁盘与 Redis 状态稳定，可继续结合快照做留档。'
        : 'Services, disks, and Redis look stable. Use the snapshot for record keeping.',
      actionLabel: copy.page.viewSnapshot,
      action: openSnapshot,
      disabled: !overview,
    };
  }, [copy.page.viewDetail, copy.page.viewDiskDetail, copy.page.viewSnapshot, diskPressureHigh, firstUnhealthyService, highestUsageDisk, openSnapshot, overview, unhealthyServiceCount, zh]);
  const riskSummary = useMemo(() => {
    if (unhealthyServiceCount >= 2 || (diskPressureHigh && !(overview?.redis?.ok ?? true))) {
      return {
        variant: 'warning' as const,
        label: zh ? '高风险' : 'High Risk',
        detail: zh
          ? '当前同时存在服务异常、磁盘压力或 Redis 问题，建议立即进入重点对象详情。'
          : 'Service issues, disk pressure, or Redis problems are overlapping. Review priority details immediately.',
      };
    }
    if (unhealthyServiceCount === 1 || diskPressureHigh || (overview && !overview.redis?.ok)) {
      return {
        variant: 'warning' as const,
        label: zh ? '需关注' : 'Needs Review',
        detail: zh
          ? '当前存在单点异常或资源压力，建议优先按巡检结论继续检查。'
          : 'A focused issue or resource pressure is present. Continue with the review outcome guidance.',
      };
    }
    return {
      variant: 'success' as const,
      label: zh ? '整体稳定' : 'Stable',
      detail: zh
        ? '当前服务、磁盘与 Redis 状态整体稳定，可继续查看快照留档。'
        : 'Services, disks, and Redis look stable overall. Continue with the snapshot for record keeping.',
    };
  }, [diskPressureHigh, overview, unhealthyServiceCount, zh]);

  return (
    <div className="space-y-6">
      {canQueryMonitor ? (
        <ManagementPageHeader
          eyebrow="SYSTEM"
          title={copy.page.title}
          description={copy.page.description}
          meta={
            <>
              <Badge variant="mono">Monitor</Badge>
              <Badge variant="info">
                {overview?.timestamp
                  ? new Date(overview.timestamp).toLocaleString()
                  : zh
                    ? '等待采样'
                    : 'Awaiting snapshot'}
              </Badge>
              {overview?.services?.length ? (
                <Badge variant={overview.services.every((service) => service.ok) ? 'success' : 'warning'}>
                  {zh
                    ? `${overview.services.filter((service) => service.ok).length}/${overview.services.length} 服务正常`
                    : `${overview.services.filter((service) => service.ok).length}/${overview.services.length} healthy`}
                </Badge>
              ) : null}
            </>
          }
          actions={
            <>
            <Button
              variant="mono"
              size="pill"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 text-primary" />
              {copy.page.refresh}
            </Button>
            {canQueryMonitor ? (
              <Button
                variant="mono"
                size="pill"
                onClick={openSnapshot}
                disabled={!overview}
              >
                {copy.page.viewSnapshot}
              </Button>
            ) : null}
            {canExportMonitor ? (
              <Button
                variant="mono"
                size="pill"
                onClick={() => {
                  if (!ensureActionPermission(canExportMonitor, copy.page.exportSnapshot)) return;
                  if (!overview) return;
                  downloadJson(`monitor-snapshot-${new Date().toISOString()}.json`, overview);
                  toast.success(monitorSnapshotMessages.exportSuccess);
                }}
                disabled={!overview}
              >
                <Download className="h-4 w-4" />
                {copy.page.exportSnapshot}
              </Button>
            ) : null}
            </>
          }
        />
      ) : null}
      {!canQueryMonitor ? (
        <QueryAccessBoundary
          viewId="system-monitor"
          title={copy.page.title}
          queryPermission={systemPermissions.monitor.query}
        />
      ) : (
        <ManagementContentCard className="space-y-6 p-6">
          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <Card className={panelCardClass}>
              <DetailKeyValueSection
                eyebrow="REVIEW"
                title={zh ? '监控巡检结论' : 'Monitor Review'}
                description={
                  zh
                    ? '先判断本轮应优先处理服务、磁盘，还是继续查看快照。'
                    : 'Decide whether this round should prioritize services, disks, or the snapshot view.'
                }
                className="border-none bg-transparent p-0 shadow-none"
              >
                <DetailKeyValueItem
                  label={zh ? '当前结论' : 'Outcome'}
                  className="md:col-span-2"
                  value={
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={reviewOutcome.variant}>{reviewOutcome.label}</Badge>
                      <span>{reviewOutcome.detail}</span>
                    </div>
                  }
                />
                <DetailKeyValueItem label={zh ? '风险等级' : 'Risk Level'} value={<Badge variant={riskSummary.variant}>{riskSummary.label}</Badge>} />
                <DetailKeyValueItem label={zh ? '检查焦点' : 'Focus'} value={riskSummary.detail} />
                <DetailKeyValueItem
                  label={zh ? '建议动作' : 'Recommended Action'}
                  value={
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={reviewOutcome.action}
                      disabled={reviewOutcome.disabled}
                    >
                      {reviewOutcome.actionLabel}
                    </Button>
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '巡检清单' : 'Checklist'}
                  className="md:col-span-2"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {monitorChecklist.map((item) => (
                        <Badge key={item.label} variant={item.ok ? 'success' : 'warning'}>
                          {item.label}: {item.detail}
                        </Badge>
                      ))}
                    </div>
                  }
                />
              </DetailKeyValueSection>
            </Card>

            <Card className={panelCardClass}>
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">PRIORITY</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">
                    {zh ? '本轮处理顺序' : 'Suggested Priority Order'}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {zh ? '按当前健康状态，建议优先查看以下对象。' : 'Based on current health signals, review these targets first.'}
                  </div>
                </div>
                {[
                  unhealthyServiceCount > 0
                    ? {
                        id: 'service',
                        title: zh ? '异常服务' : 'Unhealthy Services',
                        detail: zh ? '先查延迟、连接池和错误说明。' : 'Review latency, connection pool, and error notes first.',
                      }
                    : null,
                  diskPressureHigh
                    ? {
                        id: 'disk',
                        title: zh ? '高占用磁盘' : 'High-usage Disk',
                        detail: zh ? '确认容量趋势与清理空间。' : 'Confirm capacity trend and cleanup headroom.',
                      }
                    : null,
                  overview && !overview.redis?.ok
                    ? {
                        id: 'redis',
                        title: 'Redis',
                        detail: zh ? '继续核对 Redis 延迟和快照上下文。' : 'Review Redis latency and snapshot context.',
                      }
                    : null,
                  overview
                    ? {
                        id: 'snapshot',
                        title: zh ? '系统快照' : 'System Snapshot',
                        detail: zh ? '最后结合快照做留档和全局复核。' : 'Finish with the snapshot for record keeping and global review.',
                      }
                    : null,
                ]
                  .filter((item): item is { id: string; title: string; detail: string } => Boolean(item))
                  .map((item, index) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? 'warning' : 'mono'}>{`0${index + 1}`}</Badge>
                        <div className="font-medium text-slate-900">{item.title}</div>
                      </div>
                      <div className="mt-2 text-sm text-slate-500">{item.detail}</div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ManagementMetricCard
              label={copy.summary.uptime}
              value={overview ? formatDuration(overview.uptimeSec) : '-'}
              hint={overview?.timestamp ? new Date(overview.timestamp).toLocaleString() : undefined}
            />
            <ManagementMetricCard label={copy.summary.goroutines} value={overview?.goroutines ?? '-'} />
            <ManagementMetricCard label={copy.summary.goVersion} value={overview?.goVersion ?? '-'} />
            <ManagementMetricCard label={copy.summary.numCPU} value={overview?.numCpu ?? '-'} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ManagementFocusCard
              icon={ServerCog}
              eyebrow="SERVICE"
              title={copy.panels.focusService}
              value={firstUnhealthyService ? firstUnhealthyService.name : copy.panels.noUnhealthyService}
              hint={
                unhealthyServiceCount > 0
                  ? zh
                    ? `当前共有 ${unhealthyServiceCount} 个异常服务，优先检查延迟与错误说明。`
                    : `${unhealthyServiceCount} unhealthy services detected. Review latency and error notes first.`
                  : copy.panels.allHealthyHint
              }
              badge={
                <Badge variant={unhealthyServiceCount > 0 ? 'warning' : 'success'}>
                  {unhealthyServiceCount > 0 ? copy.panels.warning : copy.panels.healthy}
                </Badge>
              }
              action={
                firstUnhealthyService ? (
                  <Button
                    type="button"
                    variant="mono"
                    size="pill"
                    onClick={() => {
                      setSnapshotOpen(false);
                      setSelectedService(firstUnhealthyService);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    {copy.page.viewDetail}
                  </Button>
                ) : null
              }
            />
            <ManagementFocusCard
              icon={HardDrive}
              eyebrow="DISK"
              title={copy.panels.focusDisk}
              value={highestUsageDisk ? `${highestUsageDisk.path} · ${highestUsageDisk.usedPercent.toFixed(1)}%` : copy.panels.noData}
              hint={
                highestUsageDisk
                  ? diskPressureHigh
                    ? zh
                      ? '该磁盘已进入高占用区间，建议优先查看容量明细。'
                      : 'This disk is in a high-usage band. Review capacity details first.'
                    : zh
                      ? '当前磁盘占用稳定，可结合快照继续观察。'
                      : 'Disk usage is stable. Continue with the snapshot for broader context.'
                  : undefined
              }
              badge={
                highestUsageDisk ? (
                  <Badge variant={diskPressureHigh ? 'warning' : 'info'}>
                    {diskPressureHigh ? copy.panels.warning : copy.panels.healthy}
                  </Badge>
                ) : undefined
              }
              action={
                highestUsageDisk ? (
                  <Button
                    type="button"
                    variant="mono"
                    size="pill"
                    onClick={() => {
                      setSnapshotOpen(false);
                      setSelectedDisk(highestUsageDisk);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    {copy.page.viewDiskDetail}
                  </Button>
                ) : null
              }
            />
            <ManagementFocusCard
              icon={Activity}
              eyebrow="SNAPSHOT"
              title={copy.panels.focusSnapshot}
              value={snapshotTimestampText}
              hint={
                overview
                  ? zh
                    ? '从当前快照进入服务、磁盘与原始载荷详情。'
                    : 'Use the current snapshot as the hub for services, disks, and raw payload details.'
                  : undefined
              }
              badge={overview ? <Badge variant="mono">{copy.panels.snapshotReady}</Badge> : undefined}
              action={
                <Button
                  type="button"
                  variant="mono"
                  size="pill"
                  onClick={() => setSnapshotOpen(true)}
                  disabled={!overview}
                >
                  <ArrowDownUp className="h-4 w-4" />
                  {copy.page.viewSnapshot}
                </Button>
              }
            />
          </div>

          <DetailKeyValueSection
            eyebrow="HUB"
            title={copy.panels.overviewHubTitle}
            description={copy.panels.overviewHubDescription}
          >
            <DetailKeyValueItem
              label={copy.panels.focusService}
              value={
                firstUnhealthyService ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={firstUnhealthyService.ok ? 'success' : 'warning'}>
                      {firstUnhealthyService.ok ? copy.panels.healthy : copy.panels.error}
                    </Badge>
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => setSelectedService(firstUnhealthyService)}
                    >
                      {firstUnhealthyService.name}
                    </Button>
                  </div>
                ) : (
                  copy.panels.noUnhealthyService
                )
              }
              hint={firstUnhealthyService?.ok ? copy.panels.allHealthyHint : undefined}
            />
            <DetailKeyValueItem
              label={copy.panels.focusDisk}
              value={
                highestUsageDisk ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={highestUsageDisk.usedPercent >= 80 ? 'warning' : 'info'}>
                      {highestUsageDisk.usedPercent.toFixed(1)}%
                    </Badge>
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => setSelectedDisk(highestUsageDisk)}
                    >
                      {highestUsageDisk.path}
                    </Button>
                  </div>
                ) : (
                  copy.panels.noData
                )
              }
            />
            <DetailKeyValueItem
              label={copy.panels.focusSnapshot}
              value={
                <Button
                  type="button"
                  variant="mono"
                  size="pill"
                  onClick={() => setSnapshotOpen(true)}
                  disabled={!overview}
                >
                  {copy.page.viewSnapshot}
                </Button>
              }
            />
            <DetailKeyValueItem
              label={zh ? '健康概览' : 'Health Overview'}
              value={
                overview?.services?.length
                  ? `${healthyServiceCount}/${overview.services.length}`
                  : '-'
              }
              hint={zh ? '健康服务 / 总服务数' : 'Healthy services / total services'}
            />
            <DetailKeyValueItem
              label={zh ? '刷新节奏' : 'Refresh Cadence'}
              value={zh ? '10 秒自动刷新' : 'Auto refresh every 10 seconds'}
              hint={snapshotTimestampText}
            />
            <DetailKeyValueItem
              label={copy.panels.riskSummaryTitle}
              className="md:col-span-2"
              value={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={riskSummary.variant}>{riskSummary.label}</Badge>
                  <span>{riskSummary.detail}</span>
                </div>
              }
              hint={copy.panels.riskSummaryDescription}
            />
            <DetailKeyValueItem
              label={zh ? '巡检结论' : 'Review Outcome'}
              value={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={reviewOutcome.variant}>{reviewOutcome.label}</Badge>
                  <span>{reviewOutcome.detail}</span>
                </div>
              }
            />
            <DetailKeyValueItem
              label={zh ? '下一步动作' : 'Next Action'}
              value={
                <Button
                  type="button"
                  variant="mono"
                  size="pill"
                  onClick={reviewOutcome.action}
                  disabled={reviewOutcome.disabled}
                >
                  {reviewOutcome.actionLabel}
                </Button>
              }
            />
            <DetailKeyValueItem
              label={zh ? '巡检清单' : 'Review Checklist'}
              className="md:col-span-2"
              value={
                <div className="grid gap-3 md:grid-cols-3">
                  {monitorChecklist.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border px-4 py-3 ${
                        item.ok
                          ? 'border-emerald-200/70 bg-emerald-50/70'
                          : 'border-amber-200/70 bg-amber-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em]">
                        {item.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        <span className={item.ok ? 'text-emerald-700' : 'text-amber-700'}>{item.label}</span>
                      </div>
                      <div className={`mt-2 text-xs ${item.ok ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>
              }
            />
          </DetailKeyValueSection>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className={`${panelCardClass} lg:col-span-1`}>
              <DetailKeyValueSection
                eyebrow="RESOURCE"
                title={copy.panels.coreResourcesTitle}
                description={overview?.tenantId ? `${copy.panels.tenantScope}: ${overview.tenantId}` : copy.panels.master}
                className="h-full border-none bg-transparent p-0 shadow-none"
              >
                <DetailKeyValueItem label={copy.panels.memoryAlloc} value={overview ? formatBytes(overview.memory.alloc) : '-'} />
                <DetailKeyValueItem label={copy.panels.memoryTotalAlloc} value={overview ? formatBytes(overview.memory.totalAlloc) : '-'} />
                <DetailKeyValueItem label={copy.panels.heapAlloc} value={overview ? formatBytes(overview.memory.heapAlloc) : '-'} />
                <DetailKeyValueItem label={copy.panels.heapSys} value={overview ? formatBytes(overview.memory.heapSys) : '-'} />
                <DetailKeyValueItem label={copy.panels.memorySys} value={overview ? formatBytes(overview.memory.sys) : '-'} />
                <DetailKeyValueItem label={copy.panels.gcCount} value={overview?.memory.numGc ?? '-'} />
              </DetailKeyValueSection>
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

              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <DetailKeyValueItem label={zh ? '服务总数' : 'Services'} value={overview?.services?.length ?? 0} />
                <DetailKeyValueItem label={zh ? '健康服务' : 'Healthy'} value={healthyServiceCount} />
                <DetailKeyValueItem label={zh ? '异常服务' : 'Unhealthy'} value={(overview?.services?.length ?? 0) - healthyServiceCount} />
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
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">{service.latencyMs} ms</div>
                      <Button
                        variant="mono"
                        size="pill"
                        onClick={() => {
                          setSnapshotOpen(false);
                          setSelectedService(service);
                        }}
                      >
                        {copy.page.viewDetail}
                      </Button>
                    </div>
                  </div>
                ))}

                {!overview?.services?.length ? (
                  <div className="py-10 text-center text-sm text-slate-500">{copy.panels.noData}</div>
                ) : null}
              </div>
            </Card>

            <Card className={panelCardClass}>
              <DetailKeyValueSection
                eyebrow="NETWORK"
                title={copy.panels.diskAndNetwork}
                description={copy.panels.networkTraffic}
                className="mb-4 border-none bg-transparent p-0 shadow-none"
              >
                <DetailKeyValueItem
                  label={copy.panels.networkReceivedRate}
                  value={overview?.network ? formatRate(overview.network.recvRateBps) : '-'}
                  hint={copy.panels.received}
                />
                <DetailKeyValueItem
                  label={copy.panels.networkSentRate}
                  value={overview?.network ? formatRate(overview.network.sentRateBps) : '-'}
                  hint={copy.panels.sent}
                />
                <DetailKeyValueItem
                  label={copy.panels.networkReceivedTotal}
                  value={overview?.network ? formatBytes(overview.network.bytesRecv) : '-'}
                />
                <DetailKeyValueItem
                  label={copy.panels.networkSentTotal}
                  value={overview?.network ? formatBytes(overview.network.bytesSent) : '-'}
                />
              </DetailKeyValueSection>
              <div className="space-y-4">
                {overview?.disk?.map((disk) => (
                  <div key={disk.path} className="space-y-3 rounded-2xl border border-slate-100 bg-white/92 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <HardDrive className="h-4 w-4 text-slate-500" />
                      {copy.panels.diskTitle}
                    </div>
                    <DetailKeyValueSection
                      title={disk.path}
                      description={`${disk.usedPercent.toFixed(1)}% ${copy.panels.diskUsage}`}
                      className="border-none bg-transparent p-0 shadow-none"
                    >
                      <DetailKeyValueItem label={copy.panels.diskPath} value={disk.path} valueClassName="font-mono text-xs" />
                      <DetailKeyValueItem label={copy.panels.diskCapacity} value={formatBytes(disk.total)} />
                      <DetailKeyValueItem label={copy.panels.diskUsed} value={formatBytes(disk.used)} />
                      <DetailKeyValueItem label={copy.panels.diskFree} value={formatBytes(disk.free)} />
                    </DetailKeyValueSection>
                    <Progress value={disk.usedPercent} className="h-1.5" />
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-right text-[10px] text-slate-400">{disk.usedPercent.toFixed(1)}% {copy.panels.diskUsage}</div>
                      <Button
                        variant="mono"
                        size="pill"
                        onClick={() => {
                          setSnapshotOpen(false);
                          setSelectedDisk(disk);
                        }}
                      >
                        {copy.page.viewDiskDetail}
                      </Button>
                    </div>
                  </div>
                ))}

                {!overview?.disk?.length ? (
                  <div className="py-6 text-center text-sm text-slate-500">{copy.panels.noData}</div>
                ) : null}
              </div>
            </Card>

            <Card className={panelCardClass}>
              <DetailKeyValueSection
                eyebrow="REDIS"
                title={copy.panels.redisAndUsers}
                description={copy.panels.redisSummary}
                className="mb-4 border-none bg-transparent p-0 shadow-none"
              >
                <DetailKeyValueItem
                  label="Redis"
                  value={
                    <span className="inline-flex items-center gap-2">
                      {overview?.redis?.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      )}
                      {overview?.redis ? (overview.redis.ok ? copy.panels.healthy : copy.panels.error) : '-'}
                    </span>
                  }
                />
                <DetailKeyValueItem
                  label={copy.panels.redisLatency}
                  value={overview?.redis ? `${overview.redis.latencyMs} ms` : '-'}
                />
                <DetailKeyValueItem
                  label={copy.panels.onlineUsers}
                  value={overview?.online?.count ?? '-'}
                  hint={copy.panels.onlineUsersHint}
                />
                <DetailKeyValueItem
                  label={zh ? '租户库状态' : 'Tenant DB'}
                  value={overview ? (overview.hasTenantDb ? copy.panels.healthy : copy.panels.master) : '-'}
                />
              </DetailKeyValueSection>
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
                    <div className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">{overview.redis.latencyMs} ms</div>
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
        </ManagementContentCard>
      )}

      {selectedService ? (
        <DetailDialogWrapper
          open={Boolean(selectedService)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedService(null);
            }
          }}
          title={selectedService.name}
          description={zh ? '服务运行详情与连接池状态。' : 'Service runtime detail and pool status.'}
          size="lg"
        >
          <div className="space-y-4">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={zh ? '服务详情摘要' : 'Service Review Summary'}
              description={zh ? '帮助快速判断当前服务应先看什么。' : 'Helps decide what to review first for this service.'}
            >
              <DetailKeyValueItem
                label={zh ? '当前结论' : 'Current Outcome'}
                value={
                  <Badge variant={selectedService.ok ? 'success' : 'warning'}>
                    {selectedService.ok ? (zh ? '运行稳定' : 'Stable') : (zh ? '异常优先' : 'Issue First')}
                  </Badge>
                }
                hint={
                  selectedService.ok
                    ? (zh ? '当前服务健康，可继续查看连接池细节。' : 'The service is healthy. Continue with pool details.')
                    : (zh ? '当前服务异常，建议优先查看错误说明和连接池压力。' : 'The service is unhealthy. Review error notes and pool pressure first.')
                }
              />
              <DetailKeyValueItem label={zh ? '延迟' : 'Latency'} value={`${selectedService.latencyMs} ms`} />
              <DetailKeyValueItem
                label={zh ? '下一步动作' : 'Next Action'}
                value={
                  selectedService.ok
                    ? (zh ? '先看连接池，再返回快照继续巡检。' : 'Review the pool, then return to the snapshot.')
                    : (zh ? '先看错误说明，再检查连接池指标。' : 'Review the error note first, then inspect pool metrics.')
                }
                className="md:col-span-2"
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="SERVICE"
              title={selectedService.name}
              description={zh ? '查看服务当前健康状态与响应延迟。' : 'Review current service health and response latency.'}
            >
              <DetailKeyValueItem
                label={copy.panels.serviceStatus}
                value={
                  <Badge variant={selectedService.ok ? 'success' : 'warning'}>
                    {selectedService.ok ? copy.panels.healthy : copy.panels.error}
                  </Badge>
                }
              />
              <DetailKeyValueItem label={copy.panels.serviceLatency} value={`${selectedService.latencyMs} ms`} />
              <DetailKeyValueItem
                label={copy.panels.quickNavigate}
                value={
                  <Button
                    type="button"
                    variant="mono"
                    size="pill"
                    onClick={() => {
                      setSelectedService(null);
                      setSnapshotOpen(true);
                    }}
                  >
                    {copy.page.backToSnapshot}
                  </Button>
                }
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="POOL"
              title={copy.panels.servicePoolTitle}
              description={copy.panels.servicePoolDescription}
            >
              <DetailKeyValueItem label={copy.panels.serviceMaxOpenConns} value={selectedService.pool?.maxOpenConns ?? '-'} />
              <DetailKeyValueItem label={copy.panels.serviceOpenConns} value={selectedService.pool?.openConns ?? '-'} />
              <DetailKeyValueItem label={copy.panels.serviceInUse} value={selectedService.pool?.inUse ?? '-'} />
              <DetailKeyValueItem label={copy.panels.serviceIdle} value={selectedService.pool?.idle ?? '-'} />
              <DetailKeyValueItem label={copy.panels.serviceWaitCount} value={selectedService.pool?.waitCount ?? '-'} />
              <DetailKeyValueItem
                label={copy.panels.serviceWaitDuration}
                value={selectedService.pool ? `${selectedService.pool.waitDurationMs} ms` : '-'}
                hint={!selectedService.pool ? copy.panels.serviceNoPool : undefined}
              />
            </DetailKeyValueSection>

            {selectedService.error ? (
              <DetailKeyValueSection
                eyebrow="ERROR"
                title={copy.panels.serviceErrorTitle}
                description={zh ? '用于定位当前服务异常。' : 'Used to inspect the current service failure reason.'}
              >
                <DetailKeyValueItem
                  label={copy.panels.serviceErrorTitle}
                  value={selectedService.error}
                  className="md:col-span-2"
                />
              </DetailKeyValueSection>
            ) : null}
          </div>
        </DetailDialogWrapper>
      ) : null}

      {overview ? (
        <DetailDialogWrapper
          open={snapshotOpen}
          onOpenChange={setSnapshotOpen}
          title={copy.panels.snapshotTitle}
          description={copy.panels.snapshotDescription}
          size="xl"
        >
          <div className="space-y-4">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={zh ? '快照摘要' : 'Snapshot Review Summary'}
              description={zh ? '帮助快速判断当前快照应先跳到哪里。' : 'Helps decide where to jump next from the current snapshot.'}
            >
              <DetailKeyValueItem
                label={zh ? '当前结论' : 'Current Outcome'}
                value={
                  <Badge variant={firstUnhealthyService || (highestUsageDisk && highestUsageDisk.usedPercent >= 80) ? 'warning' : 'success'}>
                    {firstUnhealthyService || (highestUsageDisk && highestUsageDisk.usedPercent >= 80)
                      ? (zh ? '重点巡检' : 'Priority Review')
                      : (zh ? '快照稳定' : 'Stable Snapshot')}
                  </Badge>
                }
                hint={
                  firstUnhealthyService
                    ? (zh ? '当前快照检测到异常服务，建议优先深入服务详情。' : 'This snapshot includes unhealthy services. Review service detail first.')
                    : highestUsageDisk && highestUsageDisk.usedPercent >= 80
                      ? (zh ? '当前磁盘压力偏高，建议先看磁盘详情。' : 'Disk pressure is elevated. Review disk detail first.')
                      : (zh ? '当前快照整体稳定，可用于留档和常规巡检。' : 'This snapshot looks stable and is suitable for record keeping and routine review.')
                }
              />
              <DetailKeyValueItem label={zh ? '服务 / 磁盘' : 'Services / Disks'} value={`${overview.services.length} / ${overview.disk?.length ?? 0}`} />
              <DetailKeyValueItem
                label={zh ? '下一步动作' : 'Next Action'}
                value={
                  firstUnhealthyService
                    ? (zh ? '先进入异常服务详情。' : 'Open the unhealthy service detail first.')
                    : highestUsageDisk
                      ? (zh ? '先查看高占用磁盘详情。' : 'Open the highest-usage disk detail first.')
                      : (zh ? '继续查看原始快照或返回总览。' : 'Continue with raw snapshot review or return to the overview.')
                }
                className="md:col-span-2"
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="SNAPSHOT"
              title={copy.panels.snapshotTitle}
              description={copy.panels.snapshotDescription}
            >
              <DetailKeyValueItem
                label={copy.panels.snapshotGeneratedAt}
                value={new Date(overview.timestamp).toLocaleString()}
              />
              <DetailKeyValueItem label={copy.panels.snapshotServices} value={overview.services.length} />
              <DetailKeyValueItem label={copy.panels.snapshotDisks} value={overview.disk?.length ?? 0} />
              <DetailKeyValueItem
                label={copy.panels.snapshotRedis}
                value={overview.redis ? (overview.redis.ok ? copy.panels.healthy : copy.panels.error) : '-'}
              />
              <DetailKeyValueItem
                label={copy.panels.snapshotTenantDb}
                value={overview.hasTenantDb ? copy.panels.healthy : copy.panels.master}
              />
              <DetailKeyValueItem
                label={zh ? '在线用户' : 'Online Users'}
                value={overview.online?.count ?? '-'}
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="NAVIGATE"
              title={copy.panels.quickNavigate}
              description={zh ? '从当前快照直接跳到更细的服务或磁盘详情。' : 'Jump from this snapshot directly to service or disk details.'}
            >
              <DetailKeyValueItem
                label={copy.panels.viewServiceDetail}
                value={
                  firstUnhealthyService ? (
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => {
                        setSnapshotOpen(false);
                        setSelectedService(firstUnhealthyService);
                      }}
                    >
                      {firstUnhealthyService.name}
                    </Button>
                  ) : (
                    copy.panels.noUnhealthyService
                  )
                }
              />
              <DetailKeyValueItem
                label={copy.panels.viewDiskList}
                value={
                  firstDisk ? (
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => {
                        setSnapshotOpen(false);
                        setSelectedDisk(firstDisk);
                      }}
                    >
                      {firstDisk.path}
                    </Button>
                  ) : (
                    copy.panels.noData
                  )
                }
              />
            </DetailKeyValueSection>

            <DetailCodeBlock
              title={copy.panels.snapshotRaw}
              value={JSON.stringify(overview, null, 2)}
              collapsible
              defaultExpanded={false}
              copyText={zh ? '复制内容' : 'Copy Content'}
              copiedText={zh ? '内容已复制' : 'Content copied'}
              expandText={zh ? '展开全文' : 'Expand'}
              collapseText={zh ? '收起内容' : 'Collapse'}
            />
          </div>
        </DetailDialogWrapper>
      ) : null}

      {selectedDisk ? (
        <DetailDialogWrapper
          open={Boolean(selectedDisk)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDisk(null);
            }
          }}
          title={copy.panels.diskDetailTitle}
          description={copy.panels.diskDetailDescription}
          size="lg"
        >
          <div className="space-y-4">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={zh ? '磁盘详情摘要' : 'Disk Review Summary'}
              description={zh ? '帮助快速判断当前磁盘应先看什么。' : 'Helps decide what to review first for this disk.'}
            >
              <DetailKeyValueItem
                label={zh ? '当前结论' : 'Current Outcome'}
                value={
                  <Badge variant={selectedDisk.usedPercent >= 80 ? 'warning' : 'success'}>
                    {selectedDisk.usedPercent >= 80 ? (zh ? '容量预警' : 'Capacity Watch') : (zh ? '容量稳定' : 'Stable')}
                  </Badge>
                }
                hint={
                  selectedDisk.usedPercent >= 80
                    ? (zh ? '当前磁盘已接近高占用区间，建议优先关注释放空间。' : 'This disk is nearing a high-usage band. Review free-space actions first.')
                    : (zh ? '当前磁盘容量仍有余量，可继续常规巡检。' : 'This disk still has healthy headroom for routine review.')
                }
              />
              <DetailKeyValueItem label={copy.panels.diskUsagePercent} value={`${selectedDisk.usedPercent.toFixed(1)}%`} />
              <DetailKeyValueItem
                label={zh ? '下一步动作' : 'Next Action'}
                value={
                  selectedDisk.usedPercent >= 80
                    ? (zh ? '先关注释放空间和容量扩展。' : 'Review cleanup and capacity expansion first.')
                    : (zh ? '继续返回快照查看全局状态。' : 'Return to the snapshot for broader context.')
                }
                className="md:col-span-2"
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="DISK"
              title={selectedDisk.path}
              description={copy.panels.diskDetailDescription}
            >
              <DetailKeyValueItem label={copy.panels.diskPath} value={selectedDisk.path} valueClassName="font-mono text-xs" />
              <DetailKeyValueItem label={copy.panels.diskCapacity} value={formatBytes(selectedDisk.total)} />
              <DetailKeyValueItem label={copy.panels.diskUsed} value={formatBytes(selectedDisk.used)} />
              <DetailKeyValueItem label={copy.panels.diskFree} value={formatBytes(selectedDisk.free)} />
              <DetailKeyValueItem
                label={copy.panels.diskUsagePercent}
                value={`${selectedDisk.usedPercent.toFixed(1)}%`}
              />
              <DetailKeyValueItem
                label={copy.panels.diskUsage}
                value={
                  <div className="space-y-2">
                    <Progress value={selectedDisk.usedPercent} className="h-2" />
                    <span className="text-xs text-slate-500">
                      {formatBytes(selectedDisk.used)} / {formatBytes(selectedDisk.total)}
                    </span>
                  </div>
                }
              />
              <DetailKeyValueItem
                label={copy.panels.quickNavigate}
                value={
                  <Button
                    type="button"
                    variant="mono"
                    size="pill"
                    onClick={() => {
                      setSelectedDisk(null);
                      setSnapshotOpen(true);
                    }}
                  >
                    {copy.page.backToSnapshot}
                  </Button>
                }
              />
            </DetailKeyValueSection>
          </div>
        </DetailDialogWrapper>
      ) : null}
    </div>
  );
}








