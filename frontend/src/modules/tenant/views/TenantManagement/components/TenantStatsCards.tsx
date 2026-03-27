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

  const items = [
    {
      label: zh ? '租户总数' : 'Total Tenants',
      value: stats.total,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      desc: zh ? '当前平台已接入的租户数量' : 'Tenants currently onboarded',
    },
    {
      label: zh ? '运行中' : 'Active',
      value: stats.active,
      icon: Zap,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      desc: zh ? '状态正常、可持续登录使用' : 'Healthy tenants that can sign in normally',
    },
    {
      label: zh ? '已停用' : 'Suspended',
      value: stats.suspended,
      icon: ShieldAlert,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      desc: zh ? '被停用或策略限制的租户' : 'Tenants suspended or restricted by policy',
    },
    {
      label: zh ? '资源预警' : 'Warnings',
      value: stats.warning,
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      desc: zh ? '用户配额接近上限的租户' : 'Tenants nearing their user quota limit',
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
