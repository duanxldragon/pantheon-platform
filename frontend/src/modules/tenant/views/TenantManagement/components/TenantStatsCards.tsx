import { Activity, Building2, ShieldAlert, Zap } from 'lucide-react';

import { Card } from '../../../../../components/ui/card';
import { useLanguageStore } from '../../../../../stores/languageStore';

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

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="group border-none bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="mb-1 text-[10px] font-bold uppercase leading-none tracking-widest text-gray-400">
                {item.label}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className={`text-2xl font-black ${item.color}`}>{item.value}</h3>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">{item.desc}</p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${item.bg}`}
            >
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
