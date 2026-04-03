import React from 'react';
import { Activity, Clock, FileJson, Globe, Info, Shield, Terminal, User } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

import { Badge } from '../../../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../../components/ui/dialog';
import { getDialogClassName, getDialogStyle } from '../../../../../shared/constants/dialogSizes';
import { useLanguageStore } from '../../../../../stores/languageStore';
import {
  getAuditDetailEntries,
  getAuditResourceBadgeClass,
  isRefreshStrategy,
  isRevokeStrategy,
  parseAuditDetail,
} from '../utils/auditMeta';
import { getUnifiedLogManagementCopy } from '../unifiedLogManagementCopy';

import type { UnifiedLogItem } from './LogTable';

interface LogDetailDrawerProps {
  log: UnifiedLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LogDetailDrawer: React.FC<LogDetailDrawerProps> = ({ log, open, onOpenChange }) => {
  const { language } = useLanguageStore();
  const dateLocale = language === 'zh' ? zhCN : enUS;
  const copy = getUnifiedLogManagementCopy(language).detail;

  if (!log) {
    return null;
  }

  const DetailItem = ({
    label,
    value,
    icon: Icon,
    color,
  }: {
    label: string;
    value?: string | number | null;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
  }) => (
    <div className="group flex items-start gap-3 rounded-[24px] border border-slate-200/70 bg-white/92 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
      <div
        className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/70 bg-slate-50/90 transition-transform group-hover:scale-105 ${
          color || 'text-slate-400'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
        <span className="break-all text-sm font-semibold text-slate-700">
          {value === undefined || value === null || value === '' ? '-' : value}
        </span>
      </div>
    </div>
  );

  const SummaryCard = ({
    label,
    value,
    accent,
  }: {
    label: string;
    value?: string | number | null;
    accent?: string;
  }) => (
    <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-2 break-all text-sm font-semibold ${accent || 'text-slate-900'}`}>
        {value === undefined || value === null || value === '' ? '-' : value}
      </div>
    </div>
  );

  const JsonBlock = ({ title, value }: { title: string; value?: string }) => {
    if (!value) {
      return null;
    }

    return (
      <section className="space-y-3 rounded-[28px] bg-slate-900 p-5 shadow-inner">
        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <FileJson className="h-3 w-3" /> {title}
        </h4>
        <div className="overflow-auto rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4">
          <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-emerald-400">{value}</pre>
        </div>
      </section>
    );
  };

  const tagClass = log.kind === 'login' ? 'bg-blue-500' : 'bg-emerald-500';
  const detailMap = log.kind === 'operation' ? parseAuditDetail(log.detail) : {};
  const detailEntries =
    log.kind === 'operation'
      ? getAuditDetailEntries(log.detail, language).filter(
          (item) => !['affected_users', 'affected_roles', 'refresh_strategy', 'session_strategy'].includes(item.key),
        )
      : [];
  const resourceBadgeClass = log.kind === 'operation' ? getAuditResourceBadgeClass(log.resource) : '';

  const timestamp = log.kind === 'login' ? log.loginAt : log.createdAt;
  const formatted = format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: dateLocale });
  const statusText =
    log.status === 'success'
      ? copy.statusSuccess
      : log.status === 'failure'
        ? copy.statusFailed
        : log.status;
  const targetText =
    log.kind === 'operation'
      ? `${log.resourceName || log.resource || '-'}${log.resourceId ? ` / ${log.resourceId}` : ''}`
      : `${log.browser || '-'} / ${log.os || '-'}`;
  const summaryText =
    log.kind === 'operation' ? `${log.method || ''} ${log.requestUrl || ''}`.trim() : log.message || '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClassName('2xl', 'flex min-h-0 flex-col p-0')} style={getDialogStyle('2xl')}>
        <DialogHeader className="sticky top-0 z-10 mb-0 shrink-0 border-b border-slate-100/90 bg-slate-50/90 px-6 py-5 text-left backdrop-blur-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className={tagClass}>
              {log.kind === 'login' ? copy.loginBadge : copy.operationBadge}
            </Badge>
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-400">
              {copy.idLabel}: {log.id}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-6">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SummaryCard
              label={copy.overviewLabel}
              value={log.kind === 'operation' ? log.summary || log.operation : log.username}
              accent="text-slate-900"
            />
            <SummaryCard
              label={copy.statusLabel}
              value={statusText}
              accent={log.status === 'success' ? 'text-emerald-600' : log.status === 'failure' ? 'text-rose-600' : 'text-slate-900'}
            />
            <SummaryCard label={copy.targetLabel} value={targetText} accent="text-cyan-700" />
            <SummaryCard
              label={log.kind === 'operation' ? copy.requestSummaryLabel : copy.loginSummaryLabel}
              value={summaryText}
              accent="text-slate-700"
            />
          </section>

          <section className="space-y-2 rounded-[28px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
            <h4 className="flex items-center gap-2 px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <User className="h-3 w-3" /> {copy.sections.userEnv}
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DetailItem label={copy.fields.username} value={log.username} icon={User} color="text-blue-500" />
              <DetailItem label={copy.fields.time} value={formatted} icon={Clock} color="text-amber-500" />
              <DetailItem label={copy.fields.ip} value={log.ip} icon={Globe} color="text-emerald-500" />
              <DetailItem label={copy.fields.location} value={log.location} icon={Info} color="text-indigo-500" />
            </div>
          </section>

          <section className="space-y-2 rounded-[28px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
            <h4 className="flex items-center gap-2 px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Activity className="h-3 w-3" /> {copy.sections.bizAction}
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {log.kind === 'operation' ? (
                <>
                  <DetailItem label={copy.fields.module} value={log.module} icon={Shield} color="text-purple-500" />
                  <DetailItem label={copy.fields.operation} value={log.summary || log.operation} icon={Terminal} color="text-slate-700" />
                  <div className="group flex items-start gap-3 rounded-[24px] border border-slate-200/70 bg-white/92 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/70 bg-slate-50/90 text-cyan-600 transition-transform group-hover:scale-105">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex flex-col gap-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        {copy.fields.resource}
                      </span>
                      <Badge variant="outline" className={`w-fit ${resourceBadgeClass}`}>
                        {log.resource || '-'}
                      </Badge>
                    </div>
                  </div>
                  <DetailItem label={copy.fields.resourceName} value={log.resourceName || '-'} icon={Info} color="text-cyan-500" />
                  <DetailItem label={copy.fields.resourceId} value={log.resourceId || '-'} icon={Info} color="text-indigo-600" />
                  <DetailItem label={copy.fields.request} value={`${log.method} ${log.requestUrl}`} icon={Terminal} color="text-slate-600" />
                  <DetailItem label={copy.fields.duration} value={`${log.duration}ms`} icon={Clock} color="text-amber-600" />
                </>
              ) : (
                <>
                  <DetailItem label={copy.fields.device} value={log.os || '-'} icon={Terminal} color="text-slate-600" />
                  <DetailItem label={copy.fields.browser} value={log.browser || '-'} icon={Globe} color="text-blue-400" />
                  {log.logoutAt ? (
                    <DetailItem
                      label={copy.fields.logoutTime}
                      value={format(new Date(log.logoutAt), 'yyyy-MM-dd HH:mm:ss', { locale: dateLocale })}
                      icon={Clock}
                      color="text-amber-500"
                    />
                  ) : null}
                </>
              )}
            </div>
          </section>

          {log.kind === 'operation' &&
          (detailMap.affected_users || detailMap.affected_roles || detailMap.refresh_strategy || detailMap.session_strategy) ? (
            <section className="space-y-3 rounded-[28px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
              <h4 className="flex items-center gap-2 px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Shield className="h-3 w-3" /> {copy.sections.impactScope}
              </h4>
              <div className="flex flex-wrap gap-2 px-3">
                {detailMap.affected_users ? (
                  <Badge className="border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-50">
                    {copy.impact.users(detailMap.affected_users)}
                  </Badge>
                ) : null}
                {detailMap.affected_roles ? (
                  <Badge className="border border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-50">
                    {copy.impact.roles(detailMap.affected_roles)}
                  </Badge>
                ) : null}
                {isRefreshStrategy(detailMap.refresh_strategy) ? (
                  <Badge className="border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    {copy.impact.authRefresh}
                  </Badge>
                ) : null}
                {isRevokeStrategy(detailMap.session_strategy) ? (
                  <Badge className="border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-50">
                    {copy.impact.sessionRevoke}
                  </Badge>
                ) : null}
              </div>
            </section>
          ) : null}

          {log.kind === 'operation' && detailEntries.length > 0 ? (
            <section className="space-y-3 rounded-[28px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
              <h4 className="flex items-center gap-2 px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Info className="h-3 w-3" /> {copy.fields.detail}
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {detailEntries.map((item) => (
                  <DetailItem key={item.key} label={item.label} value={item.value} icon={Info} color="text-slate-500" />
                ))}
              </div>
            </section>
          ) : null}

          {log.kind === 'operation' ? (
            <>
              <JsonBlock title={copy.fields.requestBody} value={log.requestBody} />
              <JsonBlock title={copy.fields.responseBody} value={log.responseBody} />
            </>
          ) : null}

          {(log.kind === 'operation' && log.errorMsg) || (log.kind === 'login' && log.message) ? (
            <section className="space-y-3 rounded-[28px] bg-slate-900 p-5 shadow-inner">
              <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <Terminal className="h-3 w-3" /> {copy.sections.detailNote}
              </h4>
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4">
                <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-emerald-400">
                  {log.kind === 'operation' ? log.errorMsg : log.message}
                </pre>
              </div>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
