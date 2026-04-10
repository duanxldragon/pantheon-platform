import React from 'react';
import { Activity, Database, Layout, Shield } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Card } from '../../../../../components/ui/card';
import { useLanguageStore } from '../../../../../stores/language_store';
import { getPermissionManagementCopy } from '../permission_management_copy';

interface PermissionStatsProps {
  stats: {
    total: number;
    operation: number;
    data: number;
    menu: number;
  };
}

export const PermissionStats: React.FC<PermissionStatsProps> = ({ stats }) => {
  const { language } = useLanguageStore();
  const copy = getPermissionManagementCopy(language).stats;
  const total = Math.max(stats.total, 1);

  const items = [
    {
      label: copy.total,
      value: stats.total,
      icon: Shield,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      badge: 'info' as const,
      share: 100,
    },
    {
      label: copy.operation,
      value: stats.operation,
      icon: Activity,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      badge: 'success' as const,
      share: Math.round((stats.operation / total) * 100),
    },
    {
      label: copy.data,
      value: stats.data,
      icon: Database,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      badge: 'warning' as const,
      share: Math.round((stats.data / total) * 100),
    },
    {
      label: copy.menu,
      value: stats.menu,
      icon: Layout,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      badge: 'mono' as const,
      share: Math.round((stats.menu / total) * 100),
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="group rounded-[28px] border border-slate-200/70 bg-white/88 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.24)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-30px_rgba(15,23,42,0.28)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${item.bg}`}
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <Badge variant={item.badge}>{item.share}%</Badge>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {item.label}
            </p>
            <div className="flex items-end justify-between gap-3">
              <p className={`text-3xl font-semibold tracking-tight ${item.color}`}>
                {item.value.toLocaleString()}
              </p>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${item.bg.replace('50', '500')}`}
                  style={{ width: `${Math.max(item.share, item.value > 0 ? 12 : 0)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};






