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
    <div className="w-72 flex flex-col gap-2 pr-6 border-r border-slate-100">
      <div className="px-4 py-2 mb-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.menu.systemSettings}</h3>
      </div>
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all duration-300 group ${
              isActive 
                ? 'bg-white shadow-md shadow-slate-200/50 translate-x-1' 
                : 'hover:bg-slate-50 text-slate-500'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${
              isActive ? `${item.bg} ${item.color}` : 'bg-slate-100 text-slate-400 group-hover:bg-white'
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

