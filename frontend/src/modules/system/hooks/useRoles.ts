/**
 * 角色管理 Hook
 * @description 封装角色数据的获取逻辑
 */

import { useEffect, useState } from 'react';

import { api } from '../api';
import type { Role } from '../types';

interface UseRolesOptions {
  enabled?: boolean;
}

export function useRoles(options: UseRolesOptions = {}) {
  const { enabled = true } = options;
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(enabled);

  const reload = async () => {
    if (!enabled) {
      setRoles([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setRoles([]);
      setLoading(false);
      return;
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    roles,
    loading,
    reload,
  };
}
