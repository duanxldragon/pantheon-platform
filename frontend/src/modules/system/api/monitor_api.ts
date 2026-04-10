import { http } from '../../../shared/utils/axios_client';

// ============================================
// 类型定义
// ============================================

export interface MonitorServiceStatus {
  name: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
  pool?: MonitorDBPoolStatus;
}

export interface MonitorDBPoolStatus {
  maxOpenConns: number;
  openConns: number;
  inUse: number;
  idle: number;
  waitCount: number;
  waitDurationMs: number;
}

export interface MonitorMemoryStats {
  alloc: number;
  totalAlloc: number;
  sys: number;
  heapAlloc: number;
  heapSys: number;
  numGc: number;
}

export interface MonitorDiskStatus {
  path: string;
  total: number;
  free: number;
  used: number;
  usedPercent: number;
}

export interface MonitorNetworkStatus {
  bytesSent: number;
  bytesRecv: number;
  sentRateBps: number;
  recvRateBps: number;
}

export interface MonitorRedisStatus {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface MonitorOnlineStatus {
  count: number;
}

export interface MonitorOverview {
  timestamp: string;
  uptimeSec: number;
  goVersion: string;
  numCpu: number;
  goroutines: number;
  memory: MonitorMemoryStats;
  disk?: MonitorDiskStatus[];
  network?: MonitorNetworkStatus;
  services: MonitorServiceStatus[];
  redis?: MonitorRedisStatus;
  online?: MonitorOnlineStatus;
  tenantId?: string;
  hasTenantDb: boolean;
}

// ============================================
// Monitor API
// ============================================

/**
 * System Monitor API
 * 系统监控相关接口
 */
export const monitorApi = {
  /**
   * 获取系统概览
   * 包括运行时、数据库、Redis、在线用户等信息
   */
  getOverview: async (): Promise<MonitorOverview> => {
    const resp = await http.get<MonitorOverview>('/v1/system/monitor/overview');
    return resp.data;
  },

  /**
   * 获取在线用户数量
   */
  getOnlineUsers: async (): Promise<MonitorOnlineStatus> => {
    const resp = await http.get<MonitorOnlineStatus>('/v1/system/monitor/online-users');
    return resp.data;
  },

  /**
   * 刷新监控数据（定时轮询使用）
   */
  refresh: async (): Promise<MonitorOverview> => {
    return monitorApi.getOverview();
  },
};


