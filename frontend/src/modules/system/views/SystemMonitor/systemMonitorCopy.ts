import type { Language } from '../../../../stores/languageStore';

export interface SystemMonitorCopy {
  entity: {
    overview: {
      zh: string;
      en: string;
    };
    snapshot: {
      zh: string;
      en: string;
    };
  };
  page: {
    title: string;
    description: string;
    refresh: string;
    exportSnapshot: string;
  };
  summary: {
    uptime: string;
    goroutines: string;
    goVersion: string;
    numCPU: string;
  };
  panels: {
    coreResourcesTitle: string;
    master: string;
    memoryAlloc: string;
    heapAlloc: string;
    memorySys: string;
    serviceHealthTitle: string;
    allServicesRunning: string;
    warning: string;
    healthy: string;
    error: string;
    noData: string;
    redisAndUsers: string;
    onlineUsers: string;
    diskAndNetwork: string;
    diskUsage: string;
    networkTraffic: string;
    sent: string;
    received: string;
  };
}

const zhCopy: SystemMonitorCopy = {
  entity: {
    overview: { zh: '监控概览', en: 'Monitor overview' },
    snapshot: { zh: '监控快照', en: 'Monitor snapshot' },
  },
  page: {
    title: '系统监控',
    description: '查看运行状态、服务健康、资源占用及网络流量快照。',
    refresh: '刷新',
    exportSnapshot: '导出监控快照',
  },
  summary: {
    uptime: '运行时长',
    goroutines: '协程数量',
    goVersion: 'Go 版本',
    numCPU: 'CPU 核数',
  },
  panels: {
    coreResourcesTitle: '核心资源',
    master: '主库',
    memoryAlloc: '已分配内存',
    heapAlloc: '堆内存',
    memorySys: '系统内存',
    serviceHealthTitle: '服务健康',
    allServicesRunning: '全部服务正常',
    warning: '告警',
    healthy: '健康',
    error: '异常',
    noData: '暂无数据',
    redisAndUsers: 'Redis 与在线用户',
    onlineUsers: '在线用户',
    diskAndNetwork: '存储与网络',
    diskUsage: '磁盘占用',
    networkTraffic: '网络流量',
    sent: '发送',
    received: '接收',
  },
};

const enCopy: SystemMonitorCopy = {
  entity: {
    overview: { zh: '监控概览', en: 'Monitor overview' },
    snapshot: { zh: '监控快照', en: 'Monitor snapshot' },
  },
  page: {
    title: 'System Monitor',
    description: 'Review runtime health, service checks, resource usage, and network traffic.',
    refresh: 'Refresh',
    exportSnapshot: 'Export Snapshot',
  },
  summary: {
    uptime: 'Uptime',
    goroutines: 'Goroutines',
    goVersion: 'Go Version',
    numCPU: 'CPU Cores',
  },
  panels: {
    coreResourcesTitle: 'Core Resources',
    master: 'Master',
    memoryAlloc: 'Allocated Memory',
    heapAlloc: 'Heap Alloc',
    memorySys: 'System Memory',
    serviceHealthTitle: 'Service Health',
    allServicesRunning: 'All Services Running',
    warning: 'Warning',
    healthy: 'Healthy',
    error: 'Error',
    noData: 'No Data',
    redisAndUsers: 'Redis & Online Users',
    onlineUsers: 'Online Users',
    diskAndNetwork: 'Disk & Network',
    diskUsage: 'Disk Usage',
    networkTraffic: 'Network Traffic',
    sent: 'Sent',
    received: 'Received',
  },
};

export function getSystemMonitorCopy(language: Language): SystemMonitorCopy {
  return language === 'zh' ? zhCopy : enCopy;
}
