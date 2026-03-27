import React from 'react';
import { Activity, Clock, FileJson, Globe, Info, Shield, Terminal, User } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

import { Badge } from '../../../../../components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../../../components/ui/sheet';
import { useLanguageStore } from '../../../../../stores/languageStore';
import {
  getAuditDetailEntries,
  getAuditResourceBadgeClass,
  isRefreshStrategy,
  isRevokeStrategy,
  parseAuditDetail,
} from '../utils/auditMeta';

import type { UnifiedLogItem } from './LogTable';

interface LogDetailDrawerProps {
  log: UnifiedLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LogDetailDrawer: React.FC<LogDetailDrawerProps> = ({ log, open, onOpenChange }) => {
  const { t, language } = useLanguageStore();
  const dateLocale = language === 'zh' ? zhCN : enUS;

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
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
      <div
        className={`mt-0.5 p-2 rounded-lg bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform ${
          color || 'text-gray-400'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm text-gray-700 font-semibold break-all">
          {value === undefined || value === null || value === '' ? '-' : value}
        </span>
      </div>
    </div>
  );

  const JsonBlock = ({ title, value }: { title: string; value?: string }) => {
    if (!value) {
      return null;
    }

    return (
      <section className="bg-slate-900 p-5 rounded-2xl shadow-inner space-y-3">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <FileJson className="w-3 h-3" /> {title}
        </h4>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 overflow-auto">
          <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">{value}</pre>
        </div>
      </section>
    );
  };

  const tagClass = log.kind === 'login' ? 'bg-blue-500' : 'bg-emerald-500';
  const title = t.systemManagement.logs.detailTitle;
  const description = t.systemManagement.logs.detailDesc;
  const detailMap = log.kind === 'operation' ? parseAuditDetail(log.detail) : {};
  const detailEntries =
    log.kind === 'operation'
      ? getAuditDetailEntries(log.detail).filter(
          (item) => !['affected_users', 'affected_roles', 'refresh_strategy', 'session_strategy'].includes(item.key)
        )
      : [];
  const resourceBadgeClass = log.kind === 'operation' ? getAuditResourceBadgeClass(log.resource) : '';

  const timestamp = log.kind === 'login' ? log.loginAt : log.createdAt;
  const formatted = format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: dateLocale });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto custom-scrollbar bg-slate-50/50 backdrop-blur-xl border-l border-white/20 shadow-2xl">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={tagClass}>{log.kind === 'login' ? t.systemManagement.logs.tabLogin : t.systemManagement.logs.tabOperation}</Badge>
            <div className="h-1 w-1 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-400">ID: {log.id}</span>
          </div>
          <SheetTitle className="text-xl font-bold text-slate-900">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/50 space-y-1">
            <h4 className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" /> {t.systemManagement.logs.sections.userEnv}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <DetailItem label={t.systemManagement.logs.fields.username} value={log.username} icon={User} color="text-blue-500" />
              <DetailItem label={t.systemManagement.logs.fields.time} value={formatted} icon={Clock} color="text-amber-500" />
              <DetailItem label={t.systemManagement.logs.fields.ip} value={log.ip} icon={Globe} color="text-emerald-500" />
              <DetailItem label={t.systemManagement.logs.fields.location} value={log.location} icon={Info} color="text-indigo-500" />
            </div>
          </section>

          <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/50 space-y-1">
            <h4 className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> {t.systemManagement.logs.sections.bizAction}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {log.kind === 'operation' ? (
                <>
                  <DetailItem label={t.systemManagement.logs.fields.module} value={log.module} icon={Shield} color="text-purple-500" />
                  <DetailItem label={t.systemManagement.logs.fields.operation} value={log.summary || log.operation} icon={Terminal} color="text-slate-700" />
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                    <div className="mt-0.5 p-2 rounded-lg bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform text-cyan-600">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        {t.systemManagement.logs.fields.resource}
                      </span>
                      <Badge variant="outline" className={`w-fit ${resourceBadgeClass}`}>
                        {log.resource || '-'}
                      </Badge>
                    </div>
                  </div>
                  <DetailItem label={t.systemManagement.logs.fields.resourceName} value={log.resourceName || '-'} icon={Info} color="text-cyan-500" />
                  <DetailItem label={t.systemManagement.logs.fields.resourceId} value={log.resourceId || '-'} icon={Info} color="text-indigo-600" />
                  <DetailItem label={t.systemManagement.logs.fields.request} value={`${log.method} ${log.requestUrl}`} icon={Terminal} color="text-slate-600" />
                  <DetailItem label={t.systemManagement.logs.fields.duration} value={`${log.duration}ms`} icon={Clock} color="text-amber-600" />
                </>
              ) : (
                <>
                  <DetailItem label={t.systemManagement.logs.fields.device} value={log.os || '-'} icon={Terminal} color="text-slate-600" />
                  <DetailItem label={t.systemManagement.logs.fields.browser} value={log.browser || '-'} icon={Globe} color="text-blue-400" />
                  {log.logoutAt ? (
                    <DetailItem
                      label={t.systemManagement.logs.fields.logoutTime}
                      value={format(new Date(log.logoutAt), 'yyyy-MM-dd HH:mm:ss', { locale: dateLocale })}
                      icon={Clock}
                      color="text-amber-500"
                    />
                  ) : null}
                </>
              )}
            </div>
          </section>

          {log.kind === 'operation' && (detailMap.affected_users || detailMap.affected_roles || detailMap.refresh_strategy || detailMap.session_strategy) ? (
            <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/50 space-y-3">
              <h4 className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" /> {t.systemManagement.logs.sections.impactScope}
              </h4>
              <div className="flex flex-wrap gap-2 px-3">
                {detailMap.affected_users ? (
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-50">
                    {t.systemManagement.logs.impact.users.replace('{count}', detailMap.affected_users)}
                  </Badge>
                ) : null}
                {detailMap.affected_roles ? (
                  <Badge className="bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-50">
                    {t.systemManagement.logs.impact.roles.replace('{count}', detailMap.affected_roles)}
                  </Badge>
                ) : null}
                {isRefreshStrategy(detailMap.refresh_strategy) ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50">
                    {t.systemManagement.logs.impact.authRefresh}
                  </Badge>
                ) : null}
                {isRevokeStrategy(detailMap.session_strategy) ? (
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-50">
                    {t.systemManagement.logs.impact.sessionRevoke}
                  </Badge>
                ) : null}
              </div>
            </section>
          ) : null}

          {log.kind === 'operation' && detailEntries.length > 0 ? (
            <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/50 space-y-3">
              <h4 className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Info className="w-3 h-3" /> {t.systemManagement.logs.fields.detail}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {detailEntries.map((item) => (
                  <DetailItem key={item.key} label={item.label} value={item.value} icon={Info} color="text-slate-500" />
                ))}
              </div>
            </section>
          ) : null}

          {log.kind === 'operation' ? (
            <>
              <JsonBlock title={t.systemManagement.logs.fields.requestBody} value={log.requestBody} />
              <JsonBlock title={t.systemManagement.logs.fields.responseBody} value={log.responseBody} />
            </>
          ) : null}

          {(log.kind === 'operation' && log.errorMsg) || (log.kind === 'login' && log.message) ? (
            <section className="bg-slate-900 p-5 rounded-2xl shadow-inner space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-3 h-3" /> {t.systemManagement.logs.sections.detailNote}
              </h4>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                  {log.kind === 'operation' ? log.errorMsg : log.message}
                </pre>
              </div>
            </section>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};
