import { http } from '../../../api/client';
import type { PageResult } from '../../../shared/utils/apiClient';
import type { LoginLog, OperationLog } from '../types';

interface BackendOperationLog {
  id: string;
  username: string;
  module: string;
  resource?: string;
  resource_id?: string;
  resource_name?: string;
  action: string;
  summary?: string;
  detail?: string;
  path: string;
  method: string;
  ip: string;
  location?: string;
  status: number;
  request?: string;
  response?: string;
  error_message?: string;
  execution_time?: number;
  created_at: string;
}

interface BackendLoginLog {
  id: string;
  username: string;
  ip: string;
  location?: string;
  browser?: string;
  os?: string;
  status: string;
  message?: string;
  login_at: string;
  logout_at?: string | null;
}

function mapOperationLog(log: BackendOperationLog): OperationLog {
  return {
    id: log.id,
    username: log.username,
    realName: log.username,
    module: log.module,
    resource: log.resource,
    resourceId: log.resource_id,
    resourceName: log.resource_name,
    operation: log.action,
    summary: log.summary,
    detail: log.detail,
    method: log.method,
    requestUrl: log.path,
    requestParams: log.request,
    responseBody: log.response,
    ip: log.ip,
    location: log.location || '',
    browser: '',
    os: '',
    status: log.status >= 200 && log.status < 400 ? 'success' : 'failure',
    errorMsg: log.error_message,
    duration: log.execution_time || 0,
    createdAt: log.created_at,
  };
}

function mapLoginLog(log: BackendLoginLog): LoginLog {
  return {
    id: log.id,
    username: log.username,
    ip: log.ip,
    location: log.location || '',
    browser: log.browser || '',
    os: log.os || '',
    status: log.status === 'success' ? 'success' : 'failure',
    message: log.message || '',
    loginAt: log.login_at,
    logoutAt: log.logout_at || undefined,
  };
}

export const logApi = {
  getOperationLogs: async (params?: {
    page?: number;
    pageSize?: number;
    username?: string;
    module?: string;
    action?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PageResult<OperationLog>> => {
    const query: Record<string, string | number> = {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 20,
    };
    if (params?.username) query.username = params.username;
    if (params?.module) query.module = params.module;
    if (params?.action) query.action = params.action;
    if (params?.status) query.status = params.status;
    if (params?.startDate) query.start_date = params.startDate;
    if (params?.endDate) query.end_date = params.endDate;

    const resp = await http.getPage<BackendOperationLog>('/v1/system/logs/operation', query);
    return {
      items: (resp.data?.items || []).map(mapOperationLog),
      pagination: resp.data?.pagination,
    };
  },

  clearOperationLogs: async (): Promise<void> => {
    await http.delete('/v1/system/logs/operation');
  },

  clearLoginLogs: async (): Promise<void> => {
    await http.delete('/v1/system/logs/login');
  },

  getLoginLogs: async (params?: {
    page?: number;
    pageSize?: number;
    username?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PageResult<LoginLog>> => {
    const query: Record<string, string | number> = {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 20,
    };
    if (params?.username) query.username = params.username;
    if (params?.status) query.status = params.status;
    if (params?.startDate) query.start_date = params.startDate;
    if (params?.endDate) query.end_date = params.endDate;

    const resp = await http.getPage<BackendLoginLog>('/v1/system/logs/login', query);
    return {
      items: (resp.data?.items || []).map(mapLoginLog),
      pagination: resp.data?.pagination,
    };
  },
};
