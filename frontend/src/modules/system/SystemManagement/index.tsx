import { useState } from 'react';
import { Briefcase, Building2, Clock, Database, FileText, Lock, Menu, Settings, Shield, Users } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useLanguageStore } from '../../../stores/languageStore';
import { useThemeStore } from '../../../stores/themeStore';
import {
  DataDictionary,
  DepartmentManagement,
  MenuManagement,
  PermissionManagement,
  PositionManagement,
  RoleManagement,
  SystemSettings,
  UnifiedLogManagement,
  UserManagement,
} from '../views';

export function SystemManagement() {
  const [activeTab, setActiveTab] = useState('users');
  const { t } = useLanguageStore();
  const { theme } = useThemeStore();

  const tabs = [
    { id: 'users', label: t.menu.systemUsers, icon: Users, component: UserManagement },
    { id: 'departments', label: t.menu.systemDepartments, icon: Building2, component: DepartmentManagement },
    { id: 'positions', label: t.menu.systemPositions, icon: Briefcase, component: PositionManagement },
    { id: 'roles', label: t.menu.systemRoles, icon: Shield, component: RoleManagement },
    { id: 'menus', label: t.menu.systemMenus, icon: Menu, component: MenuManagement },
    { id: 'permissions', label: t.menu.systemPermissions, icon: Lock, component: PermissionManagement },
    { id: 'dictionary', label: t.menu.systemDictionary, icon: Database, component: DataDictionary },
    { id: 'logs', label: t.menu.systemLogs, icon: FileText, component: UnifiedLogManagement },
    { id: 'loginLogs', label: t.systemManagement.loginLogs, icon: Clock, component: UnifiedLogManagement },
    { id: 'settings', label: t.menu.systemSettings, icon: Settings, component: SystemSettings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: theme.colors.text }}>{t.systemManagement.title}</h2>
          <p style={{ color: theme.colors.textSecondary }} className="mt-1">
            {t.systemManagement.description}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-auto border border-gray-200 bg-white p-1 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="gap-2 px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
