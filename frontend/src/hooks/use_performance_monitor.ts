/**
 * 性能监控Hook
 * 用于监控组件渲染性能
 */
import { useEffect } from 'react';

interface BrowserMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface LargestContentfulPaintEntry extends PerformanceEntry {}

interface PerformanceMonitorOptions {
  logThreshold?: number; // 超过此毫秒数则记录日志
  warnThreshold?: number; // 超过此毫秒数则发出警告
  componentName?: string; // 组件名称
}

export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const {
    logThreshold = 50,
    warnThreshold = 100,
    componentName = 'Component',
  } = options;

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > warnThreshold) {
        console.warn(
          `[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms (⚠️ Warning)`
        );
      } else if (renderTime > logThreshold) {
        console.log(
          `[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms`
        );
      }
    };
  });
}

/**
 * 内存使用监控Hook
 */
export function useMemoryMonitor() {
  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory: BrowserMemoryInfo }).memory;
      console.log('[Memory] Initial usage:', {
        usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      });
    }
  }, []);
}

/**
 * 网络请求监控Hook
 */
export function useNetworkMonitor() {
  useEffect(() => {
    const updateOnlineStatus = () => {
      console.log('[Network]', navigator.onLine ? 'Online' : 'Offline');
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);
}

/**
 * Web Vitals监控
 */
export function useWebVitals() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // 监控LCP (Largest Contentful Paint)
        const observerLCP = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as LargestContentfulPaintEntry | undefined;
          if (lastEntry) {
            console.log('[Web Vitals] LCP:', lastEntry.startTime.toFixed(2), 'ms');
          }
        });
        observerLCP.observe({ entryTypes: ['largest-contentful-paint'] });

        // 监控FID (First Input Delay)
        const observerFID = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const firstInputEntry = entry as FirstInputEntry;
            console.log('[Web Vitals] FID:', firstInputEntry.processingStart - firstInputEntry.startTime, 'ms');
          });
        });
        observerFID.observe({ entryTypes: ['first-input'] });

        // 监控CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const observerCLS = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const layoutShiftEntry = entry as LayoutShiftEntry;
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value;
              console.log('[Web Vitals] CLS:', clsValue.toFixed(4));
            }
          });
        });
        observerCLS.observe({ entryTypes: ['layout-shift'] });

        return () => {
          observerLCP.disconnect();
          observerFID.disconnect();
          observerCLS.disconnect();
        };
      } catch (error) {
        console.warn('[Web Vitals] Monitoring not supported:', error);
      }
    }
  }, []);
}
