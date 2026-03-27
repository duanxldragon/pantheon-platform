/**
 * 菜单管理 Hook
 * @description 封装菜单数据的获取逻辑
 */

import { useEffect, useState } from 'react';

import { api } from '../api';
import type { Menu } from '../types';

interface UseMenusOptions {
  enabled?: boolean;
}

export function useMenus(options: UseMenusOptions = {}) {
  const { enabled = true } = options;
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(enabled);

  const reload = async () => {
    if (!enabled) {
      setMenus([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getMenus();
      setMenus(data);
    } catch (error) {
      console.error('Failed to load menus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setMenus([]);
      setLoading(false);
      return;
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    menus,
    loading,
    reload,
  };
}
