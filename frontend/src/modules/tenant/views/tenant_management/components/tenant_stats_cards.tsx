import { Activity, Building2, ShieldAlert, Zap } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Card } from '../../../../../components/ui/card';
import { useLanguageStore } from '../../../../../stores/language_store';

interface TenantStatsProps {
  stats: {
    total: number;
    active: number;
    suspended: number;
    warning: number;
  };
}

export function TenantStatsCards({ stats }: TenantStatsProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';

  const copy = zh
    ? {
        total: { label: '租户总数', desc: '当前平台已接入的租户数量' },
        active: { label: '运行中', desc: '状态正常、可持续登录使用' },
        suspended: { label: '已停用', desc: '被停用或策略限制的租户' },
        warning: { label: '资源预警', desc: '用户配额接近上限的租户' },
      }
    : {
        total: { label: 'Total Tenants', desc: 'Tenants currently onboarded' },
        active: { label: 'Active', desc: 'Healthy tenants that can sign in normally' },
        suspended: { label: 'Suspended', desc: 'Tenants suspended or restricted by policy' },
        warning: { label: 'Warnings', desc: 'Tenants nearing their user quota limit' },
      };

  const items = [
    {
      ...copy.total,
      value: stats.total,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      ...copy.active,
      value: stats.active,
      icon: Zap,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      ...copy.suspended,
      value: stats.suspended,
      icon: ShieldAlert,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      ...copy.warning,
      value: stats.warning,
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];
  const total = Math.max(stats.total, 1);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const share = Math.round((item.value / total) * 100);
        const levelLabel =
          item.label === copy.warning.label
            ? (zh ? '重点关注' : 'Watch')
            : item.label === copy.active.label
              ? (zh ? '主力状态' : 'Primary')
              : item.label === copy.suspended.label
                ? (zh ? '需跟进' : 'Follow-up')
                : (zh ? '总体概览' : 'Overview');
        return (
        <Card
          key={item.label}
          className="group rounded-[28px] border border-slate-200/70 bg-white/88 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.24)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-30px_rgba(15,23,42,0.28)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${item.bg}`}
            >
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <Badge
              variant={
                item.label === copy.active.label
                  ? 'success'
                  : item.label === copy.suspended.label
                    ? 'warning'
                    : item.label === copy.total.label
                      ? 'info'
                      : 'mono'
              }
            >
              {share}%
            </Badge>
          </div>
          <div className="mt-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {item.label}
              </p>
              <h3 className={`text-3xl font-semibold tracking-tight ${item.color}`}>{item.value}</h3>
              <p className="text-[11px] leading-5 text-slate-500">{item.desc}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{levelLabel}</span>
                <span className="text-[10px] text-slate-500">{zh ? `占比 ${share}%` : `${share}% share`}</span>
              </div>
            </div>
        </Card>
      )})}
    </div>
  );
}

