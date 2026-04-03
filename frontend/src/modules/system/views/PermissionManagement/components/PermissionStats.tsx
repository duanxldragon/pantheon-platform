import React from 'react';
import { Activity, Database, Layout, Shield } from 'lucide-react';

import { Card } from '../../../../../components/ui/card';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { getPermissionManagementCopy } from '../permissionManagementCopy';

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

  const items = [
    { label: copy.total, value: stats.total, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: copy.operation, value: stats.operation, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: copy.data, value: stats.data, icon: Database, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: copy.menu, value: stats.menu, icon: Layout, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {items.map((item, index) => (
        <Card
          key={index}
          className="group rounded-[24px] border border-slate-200/70 bg-white/88 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.24)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-30px_rgba(15,23,42,0.28)]"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${item.bg}`}
            >
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{item.label}</p>
              <p className={`text-2xl font-black ${item.color}`}>{item.value.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};


