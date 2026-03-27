/**
 * 用户管理 Hook
 * @description 封装用户数据的获取逻辑
 */

import { useEffect, useState } from 'react';

import { api } from '../api';
import type { User } from '../types';

interface UseUsersOptions {
  enabled?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { enabled = true } = options;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(enabled);

  const reload = async () => {
    if (!enabled) {
      setUsers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setUsers([]);
      setLoading(false);
      return;
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    users,
    loading,
    reload,
  };
}
