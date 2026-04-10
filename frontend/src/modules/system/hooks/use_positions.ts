/**
 * 岗位管理 Hook
 * @description 封装岗位数据的获取逻辑
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '../api';
import type { Position } from '../types';

interface UsePositionsOptions {
  enabled?: boolean;
}

export function usePositions(options: UsePositionsOptions = {}) {
  const { enabled = true } = options;
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(enabled);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) {
      requestIdRef.current += 1;
      setPositions([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const data = await api.getPositions();
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setPositions(data);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      console.error('Failed to load positions:', error);
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
      setPositions([]);
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
    positions,
    loading,
    reload,
  };
}
