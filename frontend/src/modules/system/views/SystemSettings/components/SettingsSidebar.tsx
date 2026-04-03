import React from 'react';
import {
  Server,
  Shield,
  Mail,
  Bell,
  Database,
  ChevronRight,
} from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  items: Array<{ id: string; title: string }>;
}

const iconConfig: Record<string, { icon: typeof Server; color: string; bg: string }> = {
  basic: { icon: Server, color: 'text-blue-500', bg: 'bg-blue-50' },
  security: { icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50' },
  email: { icon: Mail, color: 'text-amber-500', bg: 'bg-amber-50' },
  notification: { icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50' },
  storage: { icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50' },
};

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
  title,
  items,
}) => {
  return (
    <div className="flex w-72 flex-col gap-2 border-r border-slate-200/80 pr-6">
      <div className="mb-3 rounded-2xl border border-slate-200/70 bg-slate-50/85 px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{title}</h3>
      </div>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        const config = iconConfig[item.id] ?? iconConfig.basic;
        const Icon = config.icon;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`group flex w-full items-center gap-3 rounded-2xl border p-3 transition-all duration-300 ${
              isActive
                ? 'translate-x-1 border-slate-200 bg-white shadow-[0_16px_36px_-24px_rgba(15,23,42,0.22)]'
                : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50/90'
            }`}
          >
            <div
              className={`rounded-xl p-2 transition-colors ${
                isActive
                  ? `${config.bg} ${config.color} shadow-sm`
                  : 'bg-slate-100 text-slate-400 group-hover:bg-white'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span
              className={`flex-1 text-left text-sm font-bold transition-colors ${
                isActive ? 'text-slate-900' : 'group-hover:text-slate-700'
              }`}
            >
              {item.title}
            </span>
            {isActive ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
          </button>
        );
      })}
    </div>
  );
};
