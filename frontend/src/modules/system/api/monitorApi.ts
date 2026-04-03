import { http } from '../../../api/client';

export interface MonitorServiceStatus {
  name: string;
  ok: boolean;
  latency_ms: number;
  error?: string;
  pool?: DBPoolStatus;
}

export interface DBPoolStatus {
  max_open_conns: number;
  open_conns: number;
  in_use: number;
  idle: number;
  wait_count: number;
  wait_duration_ms: number;
}

export interface MonitorMemoryStats {
  alloc: number;
  total_alloc: number;
  sys: number;
  heap_alloc: number;
  heap_sys: number;
  num_gc: number;
}

export interface MonitorDiskStatus {
  path: string;
  total: number;
  free: number;
  used: number;
  used_percent: number;
}

export interface MonitorNetworkStatus {
  bytes_sent: number;
  bytes_recv: number;
  sent_rate_bps: number;
  recv_rate_bps: number;
}

export interface MonitorOverview {
  timestamp: string;
  uptime_sec: number;
  go_version: string;
  num_cpu: number;
  goroutines: number;
  memory: MonitorMemoryStats;
  disk?: MonitorDiskStatus[];
  network?: MonitorNetworkStatus;
  services: MonitorServiceStatus[];
  redis?: MonitorRedisStatus;
  online?: MonitorOnlineStatus;
  tenant_id?: string;
  has_tenant_db: boolean;
}

export interface MonitorRedisStatus {
  ok: boolean;
  latency_ms: number;
  error?: string;
}

export interface MonitorOnlineStatus {
  count: number;
}

export const monitorApi = {
  getOverview: async (): Promise<MonitorOverview> => {
    const resp = await http.get<MonitorOverview>('/v1/system/monitor/overview');
    return resp.data;
  },

  getOnlineUsers: async (): Promise<MonitorOnlineStatus> => {
    const resp = await http.get<MonitorOnlineStatus>('/v1/system/monitor/online-users');
    return resp.data;
  },
};
