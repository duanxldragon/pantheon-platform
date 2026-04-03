/**
 * 用户管理 Hook
 * @description 封装用户数据的获取逻辑
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '../api';
import type { User } from '../types';

interface UseUsersOptions {
  enabled?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { enabled = true } = options;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(enabled);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) {
      requestIdRef.current += 1;
      setUsers([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const data = await api.getUsers();
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setUsers(data);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      console.error('Failed to load users:', error);
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
      setUsers([]);
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
    users,
    loading,
    reload,
  };
}
