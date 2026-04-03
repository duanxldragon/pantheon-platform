/**
 * 菜单管理 Hook
 * @description 封装菜单数据的获取逻辑
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '../api';
import type { Menu } from '../types';

interface UseMenusOptions {
  enabled?: boolean;
}

export function useMenus(options: UseMenusOptions = {}) {
  const { enabled = true } = options;
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(enabled);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) {
      requestIdRef.current += 1;
      setMenus([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const data = await api.getMenus();
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setMenus(data);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      console.error('Failed to load menus:', error);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      requestIdRef.current += 1;
      setMenus([]);
      setLoading(false);
      return;
    }
    void reload();
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [enabled, reload]);

  return {
    menus,
    loading,
    reload,
  };
}
