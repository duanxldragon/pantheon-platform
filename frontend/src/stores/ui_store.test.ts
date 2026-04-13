import { beforeEach, describe, expect, it } from 'vitest';

import { useLanguageStore } from './language_store';
import { useUIStore } from './ui_store';

function resetUIStore() {
  useLanguageStore.setState((state) => ({
    ...state,
    language: 'zh',
  }));

  useUIStore.setState({
    tabs: [{ id: 'system-dashboard', label: '系统概览', closable: false, path: [] }],
    activeTab: 'system-dashboard',
    sidebarCollapsed: false,
  });

  globalThis.localStorage.clear();
}

describe('useUIStore', () => {
  beforeEach(() => {
    resetUIStore();
  });

  it('adds a new tab and makes it active', () => {
    useUIStore.getState().addTab({
      id: 'system-users',
      label: '用户管理',
      closable: true,
      path: ['系统管理', '用户管理'],
    });

    const state = useUIStore.getState();
    expect(state.tabs.map((tab) => tab.id)).toEqual(['system-dashboard', 'system-users']);
    expect(state.activeTab).toBe('system-users');
  });

  it('switches to an existing tab instead of duplicating it', () => {
    useUIStore.getState().addTab({
      id: 'system-users',
      label: '用户管理',
      closable: true,
      path: ['系统管理', '用户管理'],
    });
    useUIStore.getState().addTab({
      id: 'system-users',
      label: '用户管理',
      closable: true,
      path: ['系统管理', '用户管理'],
    });

    const state = useUIStore.getState();
    expect(state.tabs.map((tab) => tab.id)).toEqual(['system-dashboard', 'system-users']);
    expect(state.activeTab).toBe('system-users');
  });

  it('falls back to the default tab when replaceTabs receives an empty list', () => {
    useUIStore.getState().replaceTabs([]);

    const state = useUIStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]).toMatchObject({
      id: 'system-dashboard',
      closable: false,
      path: [],
    });
    expect(state.tabs[0].label).toBeTruthy();
    expect(state.activeTab).toBe('system-dashboard');
  });

  it('moves active focus to the last remaining tab when removing the current tab', () => {
    useUIStore.getState().replaceTabs([
      { id: 'system-dashboard', label: '系统概览', closable: false, path: [] },
      { id: 'system-users', label: '用户管理', closable: true, path: ['系统管理', '用户管理'] },
      { id: 'system-menus', label: '菜单管理', closable: true, path: ['系统管理', '菜单管理'] },
    ], 'system-menus');

    useUIStore.getState().removeTab('system-menus');

    const state = useUIStore.getState();
    expect(state.tabs.map((tab) => tab.id)).toEqual(['system-dashboard', 'system-users']);
    expect(state.activeTab).toBe('system-users');
  });
});
