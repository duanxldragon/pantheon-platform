import { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookKey,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  LayoutDashboard,
  LucideIcon,
  Menu as MenuIcon,
  Monitor,
  Send,
  Server,
  Settings,
  Shield,
  User,
  Users,
  Wrench,
} from 'lucide-react';

import { useAuthStore } from '../modules/auth/store/authStore';
import type { Menu as SystemMenu } from '../modules/system/types';
import { getMenuLabel, inferMenuViewId, getViewConfig, getViewConfigByComponent, inferMenuComponent } from '../shared/constants/viewsConfig';
import { useLanguageStore } from '../stores/languageStore';
import { useSystemStore } from '../stores/systemStore';
import { useThemeStore } from '../stores/themeStore';
import { useUIStore } from '../stores/uiStore';

interface SidebarNewProps {
  onNavigate: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  permissions?: string | readonly string[];
  children?: NavItem[];
  group?: 'system';
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Server,
  Users,
  Building2,
  Building: Building2,
  Shield,
  Key: BookKey,
  KeyRound: BookKey,
  Menu: MenuIcon,
  MenuIcon,
  FileText,
  LogIn: FileText,
  Wrench,
  SlidersHorizontal: Wrench,
  Database,
  BookOpen: Database,
  Monitor,
  Briefcase,
  Settings,
  Activity,
};

function resolveIcon(name?: string): LucideIcon {
  if (!name) return Server;
  return ICON_MAP[name] || Server;
}

const SYSTEM_GROUP_ID = 'system';
const SYSTEM_OVERVIEW_ID = 'system-dashboard';
const TENANT_MANAGEMENT_ID = 'tenant-management';
const SYSTEM_OVERVIEW_PERMISSION = '/api/v1/system/*:*';

function isSystemRootMenu(menu: SystemMenu, viewId: string): boolean {
  const code = String(menu.code || '').toLowerCase();
  const name = String(menu.name || '').toLowerCase();
  const title = String(menu.title || '');
  const component = inferMenuComponent(menu);

  return menu.parentId == null && (
    viewId === SYSTEM_OVERVIEW_ID ||
    menu.path === '/system' ||
    code === 'system' ||
    name === 'system' ||
    title.includes('系统管理') ||
    component === 'system/SystemDashboard'
  );
}

function ensureSystemChildOrder(children: NavItem[]): NavItem[] {
  const ordered = [...children];
  const moveTo = (id: string, index: number) => {
    const currentIndex = ordered.findIndex((item) => item.id === id);
    if (currentIndex === -1 || currentIndex === index) {
      return;
    }

    const [target] = ordered.splice(currentIndex, 1);
    ordered.splice(Math.min(index, ordered.length), 0, target);
  };

  moveTo(SYSTEM_OVERVIEW_ID, 0);
  moveTo(TENANT_MANAGEMENT_ID, ordered.length > 0 ? 1 : 0);

  return ordered;
}

function normalizeSystemMenus(
  items: NavItem[],
  hasPermission: (permission: string | readonly string[]) => boolean,
  t: any,
): NavItem[] {
  const systemItem = items.find((item) => item.group === 'system' || item.id === SYSTEM_GROUP_ID);
  if (!systemItem) {
    return items;
  }

  const dashboardRoot = items.find((item) => item !== systemItem && item.id === SYSTEM_OVERVIEW_ID);
  const childMap = new Map<string, NavItem>();

  if (dashboardRoot) {
    childMap.set(dashboardRoot.id, dashboardRoot);
  }

  (systemItem.children || []).forEach((child) => {
    if (!childMap.has(child.id)) {
      childMap.set(child.id, child);
    }
  });

  if (!childMap.has(SYSTEM_OVERVIEW_ID) && hasPermission(SYSTEM_OVERVIEW_PERMISSION)) {
    childMap.set(SYSTEM_OVERVIEW_ID, {
      id: SYSTEM_OVERVIEW_ID,
      label: t.menu.systemOverview,
      icon: LayoutDashboard,
      permissions: SYSTEM_OVERVIEW_PERMISSION,
    });
  }

  const normalizedSystemItem: NavItem = {
    ...systemItem,
    id: SYSTEM_GROUP_ID,
    label: t.menu.system,
    children: ensureSystemChildOrder(Array.from(childMap.values())),
  };

  return items
    .filter((item) => item !== dashboardRoot)
    .map((item) => (item === systemItem ? normalizedSystemItem : item));
}

function buildTree(
  menus: SystemMenu[],
  hasPermission: (permission: string | readonly string[]) => boolean,
  language: string,
  t: any,
): NavItem[] {
  const visibleMenus = menus
    .filter((menu) => menu.status === 'active' && menu.visible !== false && menu.type !== 'button')
    .sort((left, right) => left.sort - right.sort);

  const byParent = new Map<string, SystemMenu[]>();
  visibleMenus.forEach((menu) => {
    const parentKey = menu.parentId == null ? 'root' : String(menu.parentId);
    const bucket = byParent.get(parentKey) || [];
    bucket.push(menu);
    byParent.set(parentKey, bucket);
  });

  const convert = (menu: SystemMenu): NavItem | null => {
    const rawViewId = inferMenuViewId(menu) || String(menu.id);
    const systemRoot = isSystemRootMenu(menu, rawViewId);
    const viewConfig = getViewConfigByComponent(inferMenuComponent(menu), rawViewId) || getViewConfig(rawViewId);
    const permissions = viewConfig?.permissions || (menu.permissions?.length ? menu.permissions : undefined);
    if (permissions && !hasPermission(permissions)) {
      return null;
    }

    const children = (byParent.get(String(menu.id)) || [])
      .map(convert)
      .filter((item): item is NavItem => Boolean(item));

    return {
      id: systemRoot && children.length > 0 ? SYSTEM_GROUP_ID : rawViewId,
      label: getMenuLabel(menu, language, t),
      icon: resolveIcon(menu.icon),
      permissions,
      children: children.length ? children : undefined,
      group: systemRoot && children.length > 0 ? 'system' : undefined,
    };
  };

  return normalizeSystemMenus(
    (byParent.get('root') || [])
    .map(convert)
    .filter((item): item is NavItem => Boolean(item)),
    hasPermission,
    t,
  );
}

export function SidebarNew({ onNavigate }: SidebarNewProps) {
  const { theme } = useThemeStore();
  const { language, t } = useLanguageStore();
  const { user, hasPermission } = useAuthStore();
  const { activeTab } = useUIStore();
  const menus = useSystemStore((state) => state.menus);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const menuItems = useMemo<NavItem[]>(() => {
    const dynamicMenus = buildTree(menus, hasPermission, language, t);
    if (dynamicMenus.length > 0) {
      return dynamicMenus;
    }

    return [
      {
        id: SYSTEM_GROUP_ID,
        label: t.menu.system,
        icon: Settings,
        group: 'system',
        children: [
          { id: SYSTEM_OVERVIEW_ID, label: t.menu.systemOverview, icon: LayoutDashboard, permissions: SYSTEM_OVERVIEW_PERMISSION },
          { id: 'system-users', label: t.menu.systemUsers, icon: Users, permissions: '/api/v1/system/users:*' },
          { id: TENANT_MANAGEMENT_ID, label: t.menu.tenantManagement, icon: Building2, permissions: ['/api/v1/tenants/*:*', '/api/v1/tenant/*:*'] },
          { id: 'system-departments', label: t.menu.systemDepartments, icon: Building2, permissions: '/api/v1/system/depts:*' },
          { id: 'system-positions', label: t.menu.systemPositions, icon: Briefcase, permissions: '/api/v1/system/positions:*' },
          { id: 'system-roles', label: t.menu.systemRoles, icon: Shield, permissions: '/api/v1/system/roles:*' },
          { id: 'system-menus', label: t.menu.systemMenus, icon: MenuIcon, permissions: '/api/v1/system/menus:*' },
          { id: 'system-permissions', label: t.menu.systemPermissions, icon: BookKey, permissions: '/api/v1/system/permissions:*' },
          { id: 'system-dictionary', label: t.menu.systemDictionary, icon: Database, permissions: '/api/v1/system/dict/*:*' },
          { id: 'system-logs', label: t.menu.systemLogs, icon: FileText, permissions: '/api/v1/system/logs/*:*' },
          { id: 'system-settings', label: t.menu.systemSettings, icon: Wrench, permissions: '/api/v1/system/settings:*' },
          { id: 'system-monitor', label: t.menu.systemMonitor, icon: Monitor, permissions: '/api/v1/system/monitor/*:*' },
        ].filter((item) => !item.permissions || hasPermission(item.permissions)),
      },
      { id: 'deploy-center', label: t.menu.deploy, icon: Send, permissions: ['deploy:view'] },
      { id: 'operations-center', label: t.menu.operations, icon: Activity, permissions: ['ops:view'] },
      { id: 'notification-center', label: t.notification.title, icon: Bell },
    ];
  }, [language, menus, hasPermission, t]);

  const toggleExpand = (id: string) => {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNavigate = (item: NavItem) => {
    if (item.children?.length) {
      toggleExpand(item.id);
      return;
    }
    onNavigate(item.id);
  };

  const childActive = (item: NavItem): boolean =>
    Boolean(item.children?.some((child) => child.id === activeTab || childActive(child)));

  const renderMenuItem = (item: NavItem, level = 0) => {
    const Icon = item.icon;
    const expanded = expandedItems.has(item.id);
    const active = item.id === activeTab;
    const parentActive = childActive(item);

    return (
      <li key={item.id}>
        <button
          type="button"
          onClick={() => handleNavigate(item)}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200"
          style={{
            marginLeft: `${level * 10}px`,
            color: '#fff',
            background: active ? 'rgba(255,255,255,0.24)' : parentActive || expanded ? 'rgba(255,255,255,0.12)' : 'transparent',
            boxShadow: active ? '0 8px 20px rgba(15,23,42,0.16)' : 'none',
          }}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
          {item.children?.length ? (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : null}
        </button>

        {item.children?.length && expanded && (
          <ul className="mt-1 space-y-1">
            {item.children.map((child) => renderMenuItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      className="w-64 border-r flex flex-col shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
        borderColor: 'rgba(255, 255, 255, 0.18)',
      }}
    >
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Server className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">{t.system.title}</h1>
            <p className="text-xs text-white/70">{t.system.subtitle}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">{menuItems.map((item) => renderMenuItem(item))}</ul>
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.realName || t.system.admin}</p>
            <p className="truncate text-xs text-white/70">{user?.email || t.system.adminEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
