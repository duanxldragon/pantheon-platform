import type { Language } from '../../../../stores/language_store';

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
    viewDetail: string;
    viewSnapshot: string;
    viewDiskDetail: string;
    backToSnapshot: string;
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
    tenantScope: string;
    memoryAlloc: string;
    memoryTotalAlloc: string;
    heapAlloc: string;
    heapSys: string;
    memorySys: string;
    gcCount: string;
    serviceHealthTitle: string;
    allServicesRunning: string;
    warning: string;
    healthy: string;
    error: string;
    noData: string;
    redisAndUsers: string;
    onlineUsers: string;
    onlineUsersHint: string;
    redisLatency: string;
    redisSummary: string;
    diskAndNetwork: string;
    diskTitle: string;
    diskPath: string;
    diskFree: string;
    diskUsed: string;
    diskCapacity: string;
    diskUsage: string;
    networkTraffic: string;
    networkReceivedRate: string;
    networkSentRate: string;
    networkReceivedTotal: string;
    networkSentTotal: string;
    sent: string;
    received: string;
    serviceLatency: string;
    servicePoolTitle: string;
    servicePoolDescription: string;
    serviceErrorTitle: string;
    serviceNoPool: string;
    serviceStatus: string;
    serviceWaitCount: string;
    serviceWaitDuration: string;
    serviceOpenConns: string;
    serviceMaxOpenConns: string;
    serviceInUse: string;
    serviceIdle: string;
    snapshotTitle: string;
    snapshotDescription: string;
    snapshotGeneratedAt: string;
    snapshotServices: string;
    snapshotDisks: string;
    snapshotRedis: string;
    snapshotTenantDb: string;
    snapshotRaw: string;
    diskDetailTitle: string;
    diskDetailDescription: string;
    diskUsagePercent: string;
    quickNavigate: string;
    viewServiceDetail: string;
    viewDiskList: string;
    noUnhealthyService: string;
    overviewHubTitle: string;
    overviewHubDescription: string;
    focusService: string;
    focusDisk: string;
    focusSnapshot: string;
    riskSummaryTitle: string;
    riskSummaryDescription: string;
    allHealthyHint: string;
    snapshotReady: string;
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
    viewDetail: '查看详情',
    viewSnapshot: '查看快照',
    viewDiskDetail: '查看磁盘详情',
    backToSnapshot: '返回快照',
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
    tenantScope: '租户上下文',
    memoryAlloc: '已分配内存',
    memoryTotalAlloc: '累计分配',
    heapAlloc: '堆内存',
    heapSys: '堆系统内存',
    memorySys: '系统内存',
    gcCount: 'GC 次数',
    serviceHealthTitle: '服务健康',
    allServicesRunning: '全部服务正常',
    warning: '告警',
    healthy: '健康',
    error: '异常',
    noData: '暂无数据',
    redisAndUsers: 'Redis 与在线用户',
    onlineUsers: '在线用户',
    onlineUsersHint: '当前采样时刻的在线会话数量。',
    redisLatency: 'Redis 延迟',
    redisSummary: 'Redis 连接状态与在线用户负载。',
    diskAndNetwork: '存储与网络',
    diskTitle: '磁盘详情',
    diskPath: '挂载路径',
    diskFree: '剩余空间',
    diskUsed: '已用空间',
    diskCapacity: '总容量',
    diskUsage: '磁盘占用',
    networkTraffic: '网络流量',
    networkReceivedRate: '接收速率',
    networkSentRate: '发送速率',
    networkReceivedTotal: '累计接收',
    networkSentTotal: '累计发送',
    sent: '发送',
    received: '接收',
    serviceLatency: '服务延迟',
    servicePoolTitle: '连接池状态',
    servicePoolDescription: '用于观察数据库连接占用、等待次数与空闲情况。',
    serviceErrorTitle: '异常说明',
    serviceNoPool: '当前服务未提供连接池详情。',
    serviceStatus: '服务状态',
    serviceWaitCount: '等待次数',
    serviceWaitDuration: '等待耗时',
    serviceOpenConns: '已打开连接',
    serviceMaxOpenConns: '最大连接数',
    serviceInUse: '使用中',
    serviceIdle: '空闲连接',
    snapshotTitle: '监控快照',
    snapshotDescription: '查看当前采样的全局摘要与原始快照内容。',
    snapshotGeneratedAt: '采样时间',
    snapshotServices: '服务数量',
    snapshotDisks: '磁盘数量',
    snapshotRedis: 'Redis 状态',
    snapshotTenantDb: '租户库',
    snapshotRaw: '原始快照',
    diskDetailTitle: '磁盘详情',
    diskDetailDescription: '查看挂载路径、容量、已用空间与占用比例。',
    diskUsagePercent: '占用比例',
    quickNavigate: '联动入口',
    viewServiceDetail: '查看服务详情',
    viewDiskList: '查看磁盘详情',
    noUnhealthyService: '当前没有异常服务',
    overviewHubTitle: '联动概览',
    overviewHubDescription: '聚焦当前最值得优先查看的服务、磁盘与快照入口。',
    focusService: '优先服务',
    focusDisk: '最高占用磁盘',
    focusSnapshot: '快照总览',
    riskSummaryTitle: '风险等级摘要',
    riskSummaryDescription: '先判断当前监控快照属于高风险、关注中还是稳定状态。',
    allHealthyHint: '当前服务整体健康，可按需查看任一服务详情。',
    snapshotReady: '快照已就绪',
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
    viewDetail: 'View Detail',
    viewSnapshot: 'View Snapshot',
    viewDiskDetail: 'View Disk Detail',
    backToSnapshot: 'Back to Snapshot',
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
    tenantScope: 'Tenant Scope',
    memoryAlloc: 'Allocated Memory',
    memoryTotalAlloc: 'Total Allocated',
    heapAlloc: 'Heap Alloc',
    heapSys: 'Heap System',
    memorySys: 'System Memory',
    gcCount: 'GC Count',
    serviceHealthTitle: 'Service Health',
    allServicesRunning: 'All Services Running',
    warning: 'Warning',
    healthy: 'Healthy',
    error: 'Error',
    noData: 'No Data',
    redisAndUsers: 'Redis & Online Users',
    onlineUsers: 'Online Users',
    onlineUsersHint: 'Active sessions in the current snapshot.',
    redisLatency: 'Redis Latency',
    redisSummary: 'Redis connectivity state and online user load.',
    diskAndNetwork: 'Disk & Network',
    diskTitle: 'Disk Details',
    diskPath: 'Mount Path',
    diskFree: 'Free Space',
    diskUsed: 'Used Space',
    diskCapacity: 'Capacity',
    diskUsage: 'Disk Usage',
    networkTraffic: 'Network Traffic',
    networkReceivedRate: 'Receive Rate',
    networkSentRate: 'Send Rate',
    networkReceivedTotal: 'Total Received',
    networkSentTotal: 'Total Sent',
    sent: 'Sent',
    received: 'Received',
    serviceLatency: 'Service Latency',
    servicePoolTitle: 'Pool Status',
    servicePoolDescription: 'Used to review DB connection usage, waits, and idle capacity.',
    serviceErrorTitle: 'Error Notes',
    serviceNoPool: 'This service does not expose pool details.',
    serviceStatus: 'Service Status',
    serviceWaitCount: 'Wait Count',
    serviceWaitDuration: 'Wait Duration',
    serviceOpenConns: 'Open Connections',
    serviceMaxOpenConns: 'Max Open',
    serviceInUse: 'In Use',
    serviceIdle: 'Idle',
    snapshotTitle: 'Monitor Snapshot',
    snapshotDescription: 'Review current sample summary and the raw snapshot payload.',
    snapshotGeneratedAt: 'Generated At',
    snapshotServices: 'Services',
    snapshotDisks: 'Disks',
    snapshotRedis: 'Redis State',
    snapshotTenantDb: 'Tenant DB',
    snapshotRaw: 'Raw Snapshot',
    diskDetailTitle: 'Disk Detail',
    diskDetailDescription: 'Review mount path, capacity, used space, and usage rate.',
    diskUsagePercent: 'Usage Rate',
    quickNavigate: 'Quick Links',
    viewServiceDetail: 'View Service Detail',
    viewDiskList: 'View Disk Detail',
    noUnhealthyService: 'No unhealthy service currently',
    overviewHubTitle: 'Overview Hub',
    overviewHubDescription: 'Focus on the highest-priority service, disk, and snapshot entry points.',
    focusService: 'Priority Service',
    focusDisk: 'Highest Usage Disk',
    focusSnapshot: 'Snapshot Overview',
    riskSummaryTitle: 'Risk Summary',
    riskSummaryDescription: 'Determine whether the current snapshot is high risk, needs review, or remains stable.',
    allHealthyHint: 'All services are healthy right now; open any service detail as needed.',
    snapshotReady: 'Snapshot Ready',
  },
};

export function getSystemMonitorCopy(language: Language): SystemMonitorCopy {
  return language === 'zh' ? zhCopy : enCopy;
}

