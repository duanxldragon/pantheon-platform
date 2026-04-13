import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useLanguageStore } from './language_store';

export interface Tab {
  id: string;
  label: string;
  closable: boolean;
  path?: string[]; // 面包屑路径
}

interface UIState {
  // 标签页管理
  tabs: Tab[];
  activeTab: string;

  // 侧边栏
  sidebarCollapsed: boolean;

  // 操作
  addTab: (tab: Tab) => void;
  removeTab: (id: string) => void;
  replaceTabs: (tabs: Tab[], activeTab?: string) => void;
  setActiveTab: (id: string) => void;
  updateTabLabel: (id: string, label: string) => void;
  updateTabPath: (id: string, path: string[]) => void;
  clearTabs: () => void;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

// 存储版本号，用于清除旧的持久化数据
const STORAGE_VERSION = 4; // 更新版本号以重置存储
const DEFAULT_TAB_ID = 'system-dashboard';
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getUIStorage() {
  if (typeof localStorage === 'undefined') {
    return noopStorage;
  }
  return localStorage;
}

function createDefaultTab(): Tab {
  return {
    id: DEFAULT_TAB_ID,
    label: getDefaultTabLabel(),
    closable: false,
    path: [],
  };
}

// 获取默认标签页标签的辅助函数
function getDefaultTabLabel(): string {
  const { t } = useLanguageStore.getState();
  return t?.menu?.systemOverview || t?.menu?.dashboard || '系统概览';
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      tabs: [createDefaultTab()],
      activeTab: DEFAULT_TAB_ID,
      sidebarCollapsed: false,

      addTab: (tab: Tab) => {
        const { tabs } = get();
        const exists = tabs.find((t) => t.id === tab.id);
        
        if (!exists) {
          set({ tabs: [...tabs, tab], activeTab: tab.id });
        } else {
          set({ activeTab: tab.id });
        }
      },

      removeTab: (id: string) => {
        const { tabs, activeTab } = get();
        const newTabs = tabs.filter((t) => t.id !== id);
        
        let newActiveTab = activeTab;
        if (activeTab === id && newTabs.length > 0) {
          newActiveTab = newTabs[newTabs.length - 1].id;
        }
        
        set({ tabs: newTabs, activeTab: newActiveTab });
      },

      replaceTabs: (tabs, activeTab) => {
        const nextTabs = tabs.length > 0
          ? tabs
          : [createDefaultTab()];
        const nextActiveTab = activeTab && nextTabs.some((tab) => tab.id === activeTab)
          ? activeTab
          : nextTabs[0].id;

        set({
          tabs: nextTabs,
          activeTab: nextActiveTab,
        });
      },

      setActiveTab: (id: string) => {
        set({ activeTab: id });
      },

      updateTabLabel: (id: string, label: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, label } : tab
          ),
        }));
      },

      updateTabPath: (id: string, path: string[]) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, path } : tab
          ),
        }));
      },

      clearTabs: () => {
        set({
          tabs: [createDefaultTab()],
          activeTab: DEFAULT_TAB_ID,
        });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => getUIStorage()),
      version: STORAGE_VERSION,
      migrate: (persistedState: unknown, version: number) => {
        // 如果版本不匹配，重置为默认状态
        if (version !== STORAGE_VERSION) {
          return {
            tabs: [createDefaultTab()],
            activeTab: DEFAULT_TAB_ID,
            sidebarCollapsed: false,
          };
        }
        return persistedState as UIState;
      },
    }
  )
);

