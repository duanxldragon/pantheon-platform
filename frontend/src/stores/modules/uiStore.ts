import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Tab {
  id: string;
  label: string;
  closable: boolean;
  path?: string[];
  icon?: React.ReactNode;
}

interface UIState {
  // 标签页管理
  tabs: Tab[];
  activeTab: string | null;
  
  // 侧边栏状态
  sidebarCollapsed: boolean;
  
  // 全屏状态
  isFullscreen: boolean;
  
  // 动作
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabLabel: (tabId: string, label: string) => void;
  updateTabPath: (tabId: string, path: string[]) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (keepTabId: string) => void;
  
  // 侧边栏控制
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // 全屏控制
  toggleFullscreen: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  
  // 批量操作
  closeTabsToRight: (tabId: string) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      tabs: [],
      activeTab: null,
      sidebarCollapsed: false,
      isFullscreen: false,
      
      // 标签页管理
      addTab: (tab) => {
        const state = get();
        const existingTab = state.tabs.find(t => t.id === tab.id);
        
        if (existingTab) {
          // 如果标签已存在，激活它
          set({ activeTab: tab.id });
        } else {
          // 添加新标签
          set({
            tabs: [...state.tabs, tab],
            activeTab: tab.id,
          });
        }
      },
      
      removeTab: (tabId) => {
        const state = get();
        const newTabs = state.tabs.filter(t => t.id !== tabId);
        let newActiveTab = state.activeTab;
        
        // 如果删除的是当前激活的标签，需要切换到其他标签
        if (state.activeTab === tabId && newTabs.length > 0) {
          // 找到被删除标签的索引
          const deletedIndex = state.tabs.findIndex(t => t.id === tabId);
          
          // 优先选择右边的标签，如果没有则选择左边的
          if (deletedIndex < newTabs.length) {
            newActiveTab = newTabs[deletedIndex].id;
          } else {
            newActiveTab = newTabs[newTabs.length - 1].id;
          }
        } else if (newTabs.length === 0) {
          newActiveTab = null;
        }
        
        set({
          tabs: newTabs,
          activeTab: newActiveTab,
        });
      },
      
      setActiveTab: (tabId) => {
        set({ activeTab: tabId });
      },
      
      updateTabLabel: (tabId, label) => {
        set((state) => ({
          tabs: state.tabs.map(tab =>
            tab.id === tabId ? { ...tab, label } : tab
          ),
        }));
      },
      
      updateTabPath: (tabId, path) => {
        set((state) => ({
          tabs: state.tabs.map(tab =>
            tab.id === tabId ? { ...tab, path } : tab
          ),
        }));
      },
      
      closeAllTabs: () => {
        set({
          tabs: [],
          activeTab: null,
        });
      },
      
      closeOtherTabs: (keepTabId) => {
        set((state) => ({
          tabs: state.tabs.filter(tab => tab.id === keepTabId),
          activeTab: keepTabId,
        }));
      },
      
      closeTabsToRight: (tabId) => {
        const state = get();
        const tabIndex = state.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;
        
        const tabsToKeep = state.tabs.slice(0, tabIndex + 1);
        const isActiveTabClosed = state.activeTab && 
          !tabsToKeep.some(t => t.id === state.activeTab);
        
        set({
          tabs: tabsToKeep,
          activeTab: isActiveTabClosed ? tabId : state.activeTab,
        });
      },
      
      // 侧边栏控制
      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        }));
      },
      
      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },
      
      // 全屏控制
      toggleFullscreen: () => {
        const state = get();
        const newFullscreen = !state.isFullscreen;
        
        if (newFullscreen) {
          // 进入全屏
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          }
        } else {
          // 退出全屏
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
        
        set({ isFullscreen: newFullscreen });
      },
      
      setFullscreen: (fullscreen) => {
        set({ isFullscreen: fullscreen });
      },
    }),
    {
      name: 'ui-store',
    }
  )
);

// 监听全屏变化
if (typeof document !== 'undefined') {
  const handleFullscreenChange = () => {
    const isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    
    if (useUIStore.getState().isFullscreen !== isFullscreen) {
      useUIStore.getState().setFullscreen(isFullscreen);
    }
  };
  
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}