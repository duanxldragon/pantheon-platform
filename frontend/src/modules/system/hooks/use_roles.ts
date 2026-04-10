/**
 * 角色管理 Hook
 * @description 封装角色数据的获取逻辑
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '../api';
import type { Role } from '../types';

interface UseRolesOptions {
  enabled?: boolean;
}

export function useRoles(options: UseRolesOptions = {}) {
  const { enabled = true } = options;
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(enabled);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) {
      requestIdRef.current += 1;
      setRoles([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const data = await api.getRoles();
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setRoles(data);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      console.error('Failed to load roles:', error);
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
      setRoles([]);
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
    roles,
    loading,
    reload,
  };
}
