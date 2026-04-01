import React from 'react';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { 
  Server, 
  Shield, 
  Mail, 
  Bell, 
  Database,
  ChevronRight
} from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguageStore();

  const menuItems = [
    { id: 'basic', title: t.settings.basic.title, icon: Server, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'security', title: t.settings.security.title, icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'email', title: t.settings.email.title, icon: Mail, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'notification', title: t.settings.notification.title, icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'storage', title: t.settings.storage.title, icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="flex w-72 flex-col gap-2 border-r border-slate-200/80 pr-6">
      <div className="mb-3 rounded-2xl border border-slate-200/70 bg-slate-50/85 px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t.menu.systemSettings}</h3>
      </div>
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
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
            <div className={`p-2 rounded-xl transition-colors ${
              isActive ? `${item.bg} ${item.color} shadow-sm` : 'bg-slate-100 text-slate-400 group-hover:bg-white'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`flex-1 text-left text-sm font-bold transition-colors ${
              isActive ? 'text-slate-900' : 'group-hover:text-slate-700'
            }`}>
              {item.title}
            </span>
            {isActive && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </button>
        );
      })}
    </div>
  );
};

