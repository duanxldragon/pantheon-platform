/**
 * 防抖值Hook
 * 用于延迟更新值，常用于搜索输入等场景
 */
import { useEffect, useState, useRef } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // 设置定时器
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数：组件卸载或值变化时清除定时器
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 节流值Hook
 * 用于限制更新频率，常用于滚动、resize等事件
 */
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecuted.current;

      if (timeSinceLastExecution >= delay) {
        setThrottledValue(value);
        lastExecuted.current = now;
      } else {
        // 如果还没到节流时间，设置一个新的定时器
        const remainingDelay = delay - timeSinceLastExecution;
        const delayedHandler = setTimeout(() => {
          setThrottledValue(value);
          lastExecuted.current = Date.now();
        }, remainingDelay);

        return () => clearTimeout(delayedHandler);
      }
    }, delay - (Date.now() - lastExecuted.current));

    return () => clearTimeout(handler);
  }, [value, delay]);

  return throttledValue;
}
