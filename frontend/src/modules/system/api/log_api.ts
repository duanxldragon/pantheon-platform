import { http } from '../../../shared/utils/axios_client';
import type { OperationLog, LoginLog } from '../types';

// ============================================
// Log API
// ============================================

/**
 * System Log API
 * 系统日志相关接口
 */
export const logApi = {
  // ============================================
  // 操作日志 (Operation Logs)
  // ============================================

  /**
   * 获取操作日志列表
   */
  getOperationLogs: async (params?: {
    page?: number;
    pageSize?: number;
    username?: string;
    module?: string;
    action?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: OperationLog[]; total: number }> => {
    const resp = await http.getPage<OperationLog>('/v1/system/logs/operation', {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      username: params?.username || '',
      module: params?.module || '',
      action: params?.action || '',
      status: params?.status || '',
      startDate: params?.startDate || '',
      endDate: params?.endDate || '',
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  /**
   * 获取操作日志详情
   * @param id 日志ID
   */
  getOperationLogDetail: async (id: string): Promise<OperationLog> => {
    const resp = await http.get<OperationLog>(`/v1/system/logs/operation/${id}`);
    return resp.data;
  },

  /**
   * 清空操作日志
   */
  clearOperationLogs: async (): Promise<void> => {
    await http.delete('/v1/system/logs/operation');
  },

  /**
   * 导出操作日志
   * @param params 查询参数
   * @param format 导出格式 (csv, excel)
   */
  exportOperationLogs: async (
    params?: {
      username?: string;
      module?: string;
      action?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
    format: 'csv' | 'excel' = 'excel'
  ): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.username) queryParams.set('username', params.username);
    if (params?.module) queryParams.set('module', params.module);
    if (params?.action) queryParams.set('action', params.action);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.startDate) queryParams.set('start_date', params.startDate);
    if (params?.endDate) queryParams.set('end_date', params.endDate);
    queryParams.set('format', format);

    const url = `/v1/system/logs/operation/export?${queryParams.toString()}`;
    await http.download(url, `operation-logs-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`);
  },

  // ============================================
  // 登录日志 (Login Logs)
  // ============================================

  /**
   * 获取登录日志列表
   */
  getLoginLogs: async (params?: {
    page?: number;
    pageSize?: number;
    username?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: LoginLog[]; total: number }> => {
    const resp = await http.getPage<LoginLog>('/v1/system/logs/login', {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      username: params?.username || '',
      status: params?.status || '',
      startDate: params?.startDate || '',
      endDate: params?.endDate || '',
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  /**
   * 获取登录日志详情
   * @param id 日志ID
   */
  getLoginLogDetail: async (id: string): Promise<LoginLog> => {
    const resp = await http.get<LoginLog>(`/v1/system/logs/login/${id}`);
    return resp.data;
  },

  /**
   * 清空登录日志
   */
  clearLoginLogs: async (): Promise<void> => {
    await http.delete('/v1/system/logs/login');
  },

  /**
   * 导出登录日志
   * @param params 查询参数
   * @param format 导出格式 (csv, excel)
   */
  exportLoginLogs: async (
    params?: {
      username?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
    format: 'csv' | 'excel' = 'excel'
  ): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.username) queryParams.set('username', params.username);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.startDate) queryParams.set('start_date', params.startDate);
    if (params?.endDate) queryParams.set('end_date', params.endDate);
    queryParams.set('format', format);

    const url = `/v1/system/logs/login/export?${queryParams.toString()}`;
    await http.download(url, `login-logs-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`);
  },
};






