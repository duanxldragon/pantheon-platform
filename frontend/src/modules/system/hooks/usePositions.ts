/**
 * 岗位管理 Hook
 * @description 封装岗位数据的获取逻辑
 */

import { useEffect, useState } from 'react';

import { api } from '../api';
import type { Position } from '../types';

interface UsePositionsOptions {
  enabled?: boolean;
}

export function usePositions(options: UsePositionsOptions = {}) {
  const { enabled = true } = options;
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(enabled);

  const reload = async () => {
    if (!enabled) {
      setPositions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getPositions();
      setPositions(data);
    } catch (error) {
      console.error('Failed to load positions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setPositions([]);
      setLoading(false);
      return;
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    positions,
    loading,
    reload,
  };
}
