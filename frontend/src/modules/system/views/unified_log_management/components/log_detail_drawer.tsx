import React from 'react';
import { ArrowRightLeft, Clock, Globe, Info, Shield, Terminal, User } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

import { Badge } from '../../../../../components/ui/badge';
import {
  DetailCodeBlock,
  DetailKeyValueItem,
  DetailDialogWrapper,
  DetailKeyValueSection,
} from '../../../../../shared/components/ui';
import { useLanguageStore } from '../../../../../stores/language_store';
import {
  getAuditDetailEntries,
  getAuditResourceBadgeClass,
  isRefreshStrategy,
  isRevokeStrategy,
  parseAuditDetail,
} from '../utils/audit_meta';
import { getUnifiedLogManagementCopy } from '../unified_log_management_copy';

import type { UnifiedLogItem } from './log_table';

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

  const parseStructuredPayload = (value?: string) => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const getPayloadValueType = (value: unknown) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getPayloadValuePreview = (text: string) => (text.length > 160 ? `${text.slice(0, 160)}…` : text);

  const requestPayload = log.kind === 'operation' ? parseStructuredPayload(log.requestBody) : null;
  const responsePayload = log.kind === 'operation' ? parseStructuredPayload(log.responseBody) : null;
  const requestKeys = requestPayload ? Object.keys(requestPayload) : [];
  const responseKeys = responsePayload ? Object.keys(responsePayload) : [];
  const sharedPayloadKeys = requestKeys.filter((key) => responseKeys.includes(key));
  const requestOnlyKeys = requestKeys.filter((key) => !responseKeys.includes(key));
  const responseOnlyKeys = responseKeys.filter((key) => !requestKeys.includes(key));
  const changedPayloadEntries = sharedPayloadKeys
    .map((key) => {
      const requestValue = requestPayload?.[key];
      const responseValue = responsePayload?.[key];
      const requestText = requestValue === undefined ? '-' : JSON.stringify(requestValue);
      const responseText = responseValue === undefined ? '-' : JSON.stringify(responseValue);
      return {
        key,
        requestValue,
        responseValue,
        requestText,
        responseText,
        requestType: getPayloadValueType(requestValue),
        responseType: getPayloadValueType(responseValue),
        requestLength: requestText.length,
        responseLength: responseText.length,
        severity:
          getPayloadValueType(requestValue) !== getPayloadValueType(responseValue)
            ? 'high'
            : Math.abs(requestText.length - responseText.length) > 20
              ? 'medium'
              : 'low',
      };
    })
    .filter((item) => item.requestText !== item.responseText);
  const typeChangedCount = changedPayloadEntries.filter((item) => item.requestType !== item.responseType).length;
  const lengthChangedCount = changedPayloadEntries.filter((item) => item.requestLength !== item.responseLength).length;
  const reviewOutcome =
    log.status === 'failure'
      ? {
          variant: 'warning' as const,
          label: language === 'zh' ? '优先处理失败记录' : 'Prioritize this failed record',
          hint:
            language === 'zh'
              ? '当前日志为失败状态，建议先检查错误说明、请求摘要与资源对象。'
              : 'This log failed. Review the error note, request summary, and target resource first.',
          action:
            language === 'zh'
              ? '优先展开详细说明与请求体'
              : 'Expand detail notes and request payload first',
        }
      : changedPayloadEntries.length > 0
        ? {
            variant: 'info' as const,
            label: language === 'zh' ? '优先核对载荷差异' : 'Review payload differences first',
            hint:
              language === 'zh'
                ? `当前有 ${changedPayloadEntries.length} 个共同字段发生变化，建议先看差异概览。`
                : `${changedPayloadEntries.length} shared fields changed. Review the diff overview first.`,
            action:
              language === 'zh'
                ? '先检查类型变化和长度变化摘要'
                : 'Check type and length changes before raw payloads',
          }
        : log.kind === 'operation' && (detailMap.affected_users || detailMap.affected_roles)
          ? {
              variant: 'warning' as const,
              label: language === 'zh' ? '优先确认影响范围' : 'Review impact scope first',
              hint:
                language === 'zh'
                  ? '当前操作涉及用户或角色影响，建议先核对受影响对象和授权刷新策略。'
                  : 'This operation affects users or roles. Review affected subjects and refresh strategy first.',
              action:
                language === 'zh'
                  ? '先检查影响范围，再查看原始载荷'
                  : 'Review impact scope before raw payloads',
            }
          : {
              variant: 'success' as const,
              label: language === 'zh' ? '当前记录结构稳定' : 'This record looks stable',
              hint:
                language === 'zh'
                  ? '当前日志没有明显失败或高变化特征，可按摘要 → 详情 → 原文顺序查看。'
                  : 'No obvious failure or high-shift signals were found. Review summary, details, then raw payloads.',
              action:
                language === 'zh'
                  ? '先看摘要，再按需展开原文'
                  : 'Start with summaries, then expand raw payloads as needed',
            };

  return (
    <DetailDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description}
      size="2xl"
    >
      <div className="space-y-6">
        <section className="rounded-[24px] border border-slate-200/70 bg-slate-50/85 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className={tagClass}>
              {log.kind === 'login' ? copy.loginBadge : copy.operationBadge}
            </Badge>
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-400">
              {copy.idLabel}: {log.id}
            </span>
          </div>
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
        </section>

        <DetailKeyValueSection
          eyebrow="FLOW"
          title={language === 'zh' ? '阅读顺序建议' : 'Recommended Reading Order'}
          description={
            language === 'zh'
              ? '先按风险等级决定阅读入口，再进入结构化差异和原始报文。'
              : 'Pick the first inspection step by risk level, then review structured diffs and raw payloads.'
          }
        >
          <DetailKeyValueItem
            label={language === 'zh' ? '第一步' : 'Step 1'}
            value={reviewOutcome.label}
            hint={reviewOutcome.hint}
          />
          <DetailKeyValueItem
            label={language === 'zh' ? '第二步' : 'Step 2'}
            value={
              changedPayloadEntries.length > 0
                ? language === 'zh'
                  ? '查看载荷差异摘要与字段变化'
                  : 'Review payload diff summaries and changed fields'
                : language === 'zh'
                  ? '查看业务动作、资源对象与影响范围'
                  : 'Review business action, target resource, and impact scope'
            }
          />
          <DetailKeyValueItem
            label={language === 'zh' ? '第三步' : 'Step 3'}
            value={
              language === 'zh'
                ? '按需展开请求体、响应体与详细说明原文'
                : 'Expand request body, response body, and raw detail notes as needed'
            }
          />
          <DetailKeyValueItem
            label={language === 'zh' ? '优先级' : 'Priority'}
            value={
              <Badge variant={reviewOutcome.variant}>
                {log.status === 'failure'
                  ? language === 'zh' ? '高优先级' : 'High Priority'
                  : changedPayloadEntries.length > 0
                    ? language === 'zh' ? '中优先级' : 'Medium Priority'
                    : language === 'zh' ? '常规检查' : 'Routine Review'}
              </Badge>
            }
          />
        </DetailKeyValueSection>

        <DetailKeyValueSection
          eyebrow="REVIEW"
          title={copy.sections.review}
          description={
            language === 'zh'
              ? '先判断这条日志应该优先看失败、差异还是影响范围。'
              : 'Determine whether to review failure, diff, or impact scope first.'
          }
        >
          <DetailKeyValueItem
            label={copy.fields.reviewOutcome}
            className="md:col-span-2"
            value={
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={reviewOutcome.variant}>{reviewOutcome.label}</Badge>
                <span>{reviewOutcome.hint}</span>
              </div>
            }
          />
          <DetailKeyValueItem
            label={copy.fields.nextAction}
            value={reviewOutcome.action}
            hint={
              language === 'zh'
                ? '用于快速决定本次日志详情的阅读顺序。'
                : 'Helps decide the reading order for this log detail.'
            }
          />
          <DetailKeyValueItem
            label={copy.statusLabel}
            value={statusText}
          />
          <DetailKeyValueItem
            label={copy.fields.changedFields}
            value={changedPayloadEntries.length}
            hint={
              language === 'zh'
                ? '仅统计请求体与响应体共同字段里的变化项。'
                : 'Counts only changed fields shared by request and response payloads.'
            }
          />
        </DetailKeyValueSection>

        <DetailKeyValueSection
          eyebrow="USER ENV"
          title={copy.sections.userEnv}
          description={language === 'zh' ? '登录主体、时间与来源环境。' : 'Actor, timestamp, and source environment.'}
        >
            <DetailKeyValueItem
              label={copy.fields.username}
              value={
                <span className="inline-flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  {log.username || '-'}
                </span>
              }
            />
            <DetailKeyValueItem
              label={copy.fields.time}
              value={
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  {formatted}
                </span>
              }
            />
            <DetailKeyValueItem
              label={copy.fields.ip}
              value={
                <span className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  {log.ip || '-'}
                </span>
              }
            />
            <DetailKeyValueItem
              label={copy.fields.location}
              value={
                <span className="inline-flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-500" />
                  {log.location || '-'}
                </span>
              }
            />
        </DetailKeyValueSection>

        <DetailKeyValueSection
          eyebrow="ACTION"
          title={copy.sections.bizAction}
          description={language === 'zh' ? '业务动作、资源对象与请求摘要。' : 'Business action, target resource, and request summary.'}
        >
          {log.kind === 'operation' ? (
            <>
              <DetailKeyValueItem
                label={copy.fields.module}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    {log.module || '-'}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.fields.operation}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-slate-700" />
                    {log.summary || log.operation || '-'}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.fields.resource}
                value={<Badge variant="outline" className={`w-fit ${resourceBadgeClass}`}>{log.resource || '-'}</Badge>}
              />
              <DetailKeyValueItem
                label={copy.fields.resourceName}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Info className="h-4 w-4 text-cyan-500" />
                    {log.resourceName || '-'}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.fields.resourceId}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Info className="h-4 w-4 text-indigo-600" />
                    {log.resourceId || '-'}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.fields.request}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-slate-600" />
                    {`${log.method} ${log.requestUrl}`.trim() || '-'}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.fields.duration}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    {`${log.duration}ms`}
                  </span>
                }
              />
            </>
          ) : (
            <>
              <DetailKeyValueItem
                label={copy.fields.device}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-slate-600" />
                    {log.os || '-'}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.fields.browser}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    {log.browser || '-'}
                  </span>
                }
              />
              {log.logoutAt ? (
                <DetailKeyValueItem
                  label={copy.fields.logoutTime}
                  value={
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      {format(new Date(log.logoutAt), 'yyyy-MM-dd HH:mm:ss', { locale: dateLocale })}
                    </span>
                  }
                />
              ) : null}
            </>
          )}
        </DetailKeyValueSection>

        {log.kind === 'operation' &&
          (detailMap.affected_users || detailMap.affected_roles || detailMap.refresh_strategy || detailMap.session_strategy) ? (
            <DetailKeyValueSection
              eyebrow="IMPACT"
              title={copy.sections.impactScope}
              description={language === 'zh' ? '该操作对用户、角色与授权会话的影响范围。' : 'Impact scope on users, roles, and authorization sessions.'}
            >
              <DetailKeyValueItem
                label={language === 'zh' ? '受影响对象' : 'Affected Subjects'}
                className="md:col-span-2"
                value={
                  <div className="flex flex-wrap gap-2">
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
                }
              />
            </DetailKeyValueSection>
          ) : null}

        {log.kind === 'operation' && detailEntries.length > 0 ? (
          <DetailKeyValueSection
            eyebrow="DETAIL"
            title={copy.fields.detail}
            description={language === 'zh' ? '审计明细中的补充键值对。' : 'Additional audit key-value entries.'}
          >
                {detailEntries.map((item) => (
                  <DetailKeyValueItem
                    key={item.key}
                    label={item.label}
                    value={
                      <span className="inline-flex items-center gap-2">
                        <Info className="h-4 w-4 text-slate-500" />
                        {item.value}
                      </span>
                      }
                  />
                ))}
          </DetailKeyValueSection>
        ) : null}

        {log.kind === 'operation' && (requestPayload || responsePayload) ? (
          <DetailKeyValueSection
            eyebrow="STRUCTURE"
            title={copy.sections.payloadStructure}
            description={
              language === 'zh'
                ? '对可解析的请求体 / 响应体展示结构化字段摘要。'
                : 'Shows structured field summaries for parseable request and response payloads.'
            }
          >
            {requestPayload ? (
              <>
                <DetailKeyValueItem label={`${copy.fields.requestBody} · ${copy.fields.fieldCount}`} value={requestKeys.length} />
                <DetailKeyValueItem
                  label={`${copy.fields.requestBody} · ${copy.fields.topLevelKeys}`}
                  value={requestKeys.length ? requestKeys.join(', ') : '-'}
                />
              </>
            ) : null}
            {responsePayload ? (
              <>
                <DetailKeyValueItem label={`${copy.fields.responseBody} · ${copy.fields.fieldCount}`} value={responseKeys.length} />
                <DetailKeyValueItem
                  label={`${copy.fields.responseBody} · ${copy.fields.topLevelKeys}`}
                  value={responseKeys.length ? responseKeys.join(', ') : '-'}
                />
              </>
            ) : null}
            {requestPayload && responsePayload ? (
              <>
                <DetailKeyValueItem
                  label={copy.fields.sharedKeys}
                  value={sharedPayloadKeys.length ? sharedPayloadKeys.join(', ') : '-'}
                />
                <DetailKeyValueItem
                  label={copy.fields.requestOnly}
                  value={requestOnlyKeys.length ? requestOnlyKeys.join(', ') : '-'}
                />
                <DetailKeyValueItem
                  label={copy.fields.responseOnly}
                  value={responseOnlyKeys.length ? responseOnlyKeys.join(', ') : '-'}
                  className="md:col-span-2"
                />
              </>
            ) : null}
          </DetailKeyValueSection>
        ) : null}

        {log.kind === 'operation' && changedPayloadEntries.length > 0 ? (
          <DetailKeyValueSection
            eyebrow="DIFF"
            title={copy.sections.payloadDiff}
            description={
              language === 'zh'
                ? '仅展示请求体与响应体中共同字段里值发生变化的部分。'
                : 'Shows only the shared payload fields whose values differ between request and response.'
            }
          >
            <DetailKeyValueItem
              label={copy.fields.diffOverview}
              className="md:col-span-2"
              value={
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-amber-700">
                      {copy.fields.changedFields}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-amber-950">{changedPayloadEntries.length}</div>
                    <div className="mt-1 text-xs text-amber-800/80">{copy.fields.diffOverviewHint}</div>
                  </div>
                  <div className="rounded-2xl border border-blue-200/70 bg-blue-50/80 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-blue-700">
                      {copy.fields.typeChanged}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-blue-950">{typeChangedCount}</div>
                    <div className="mt-1 text-xs text-blue-800/80">{copy.fields.typeChangedHint}</div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700">
                      {copy.fields.lengthChanged}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-emerald-950">{lengthChangedCount}</div>
                    <div className="mt-1 text-xs text-emerald-800/80">{copy.fields.lengthChangedHint}</div>
                  </div>
                </div>
              }
            />
            <DetailKeyValueItem
              label={copy.fields.changedFields}
              value={changedPayloadEntries.length}
              hint={language === 'zh' ? '用于快速定位差异数量。' : 'Quick count of differing fields.'}
            />
            <DetailKeyValueItem
              label={copy.fields.sharedKeys}
              value={sharedPayloadKeys.length}
            />
            {changedPayloadEntries.map((item) => (
              <DetailKeyValueItem
                key={`diff-${item.key}`}
                label={item.key}
                className="md:col-span-2"
                value={
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.severity === 'high' ? 'warning' : item.severity === 'medium' ? 'info' : 'mono'}>
                        {copy.fields.valueChanged}
                      </Badge>
                      <Badge variant="info">
                        {copy.fields.typePair(item.requestType, item.responseType)}
                      </Badge>
                      <Badge variant="mono">
                        {copy.fields.lengthPair(item.requestLength, item.responseLength)}
                      </Badge>
                      <Badge variant={item.severity === 'high' ? 'warning' : item.severity === 'medium' ? 'info' : 'mono'}>
                        {item.severity === 'high'
                          ? language === 'zh' ? '高变化' : 'High Shift'
                          : item.severity === 'medium'
                            ? language === 'zh' ? '中变化' : 'Medium Shift'
                            : language === 'zh' ? '轻变化' : 'Light Shift'}
                      </Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch">
                      <div className={`rounded-2xl px-4 py-3 ${
                        item.severity === 'high'
                          ? 'border border-rose-300/80 bg-rose-50/90'
                          : item.severity === 'medium'
                            ? 'border border-amber-200/70 bg-amber-50/80'
                            : 'border border-slate-200/70 bg-slate-50/80'
                      }`}>
                        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-rose-700">
                          {copy.fields.requestValue}
                        </div>
                        <div className="mb-2 text-xs leading-5 text-rose-700/80">
                          {copy.fields.previewLabel(getPayloadValuePreview(item.requestText))}
                        </div>
                        <div className="break-words font-mono text-xs text-rose-950">
                          {item.requestText}
                        </div>
                      </div>
                      <div className="hidden items-center justify-center md:flex">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
                          <ArrowRightLeft className="h-4 w-4" />
                        </div>
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${
                        item.severity === 'high'
                          ? 'border border-emerald-300/80 bg-emerald-50/90'
                          : item.severity === 'medium'
                            ? 'border border-cyan-200/70 bg-cyan-50/80'
                            : 'border border-slate-200/70 bg-slate-50/80'
                      }`}>
                        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700">
                          {copy.fields.responseValue}
                        </div>
                        <div className="mb-2 text-xs leading-5 text-emerald-700/80">
                          {copy.fields.previewLabel(getPayloadValuePreview(item.responseText))}
                        </div>
                        <div className="break-words font-mono text-xs text-emerald-950">
                          {item.responseText}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                          {copy.fields.requestMeta}
                        </div>
                        <div className="text-xs text-slate-600">
                          {copy.fields.metaSummary(item.requestType, item.requestLength)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                          {copy.fields.responseMeta}
                        </div>
                        <div className="text-xs text-slate-600">
                          {copy.fields.metaSummary(item.responseType, item.responseLength)}
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            ))}
          </DetailKeyValueSection>
        ) : null}

        {log.kind === 'operation' ? (
          <>
            <DetailCodeBlock
              title={copy.fields.requestBody}
              value={log.requestBody}
              collapsible
              defaultExpanded={false}
              downloadable
              downloadFileName={`log-${log.id}-request.json`}
              copyText={copy.actions.copy}
              copiedText={copy.actions.copied}
              expandText={copy.actions.expand}
              collapseText={copy.actions.collapse}
              downloadText={copy.actions.download}
              formatJson
              formatText={copy.actions.format}
              formatSuccessText={copy.actions.formatSuccess}
              formatFailedText={copy.actions.formatFailed}
            />
            <DetailCodeBlock
              title={copy.fields.responseBody}
              value={log.responseBody}
              collapsible
              defaultExpanded={false}
              downloadable
              downloadFileName={`log-${log.id}-response.json`}
              copyText={copy.actions.copy}
              copiedText={copy.actions.copied}
              expandText={copy.actions.expand}
              collapseText={copy.actions.collapse}
              downloadText={copy.actions.download}
              formatJson
              formatText={copy.actions.format}
              formatSuccessText={copy.actions.formatSuccess}
              formatFailedText={copy.actions.formatFailed}
            />
          </>
        ) : null}

        {(log.kind === 'operation' && log.errorMsg) || (log.kind === 'login' && log.message) ? (
          <DetailCodeBlock
            title={copy.sections.detailNote}
            value={log.kind === 'operation' ? log.errorMsg : log.message}
            icon={Terminal}
            collapsible
            defaultExpanded={false}
            downloadable
            downloadFileName={`log-${log.id}-detail.txt`}
            copyText={copy.actions.copy}
            copiedText={copy.actions.copied}
            expandText={copy.actions.expand}
            collapseText={copy.actions.collapse}
            downloadText={copy.actions.download}
          />
        ) : null}
      </div>
    </DetailDialogWrapper>
  );
};








