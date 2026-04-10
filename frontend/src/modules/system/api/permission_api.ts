import { Permission, PermissionFormData } from '../types';
import { http } from '../../../shared/utils/axios_client';

// axios拦截器会自动处理snake_case ↔ camelCase转换
// 但需要保留一些业务逻辑映射

function mapPermissionType(type: 'menu' | 'button' | 'api'): Permission['type'] {
  if (type === 'menu') {
    return 'menu';
  }
  return 'operation';
}

function toBackendType(type: Permission['type']): 'menu' | 'button' | 'api' {
  if (type === 'menu') {
    return 'menu';
  }
  return 'api';
}

export const permissionApi = {
  listPermissions: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    module?: string;
    status?: string;
  }): Promise<{ items: Permission[]; total: number }> => {
    const resp = await http.getPage<Permission>('/v1/system/permissions', {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 50,
      search: params?.search || '',
      type: params?.type || '',
      module: params?.module || '',
      status: params?.status || '',
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  getPermissions: async (): Promise<Permission[]> => {
    const resp = await permissionApi.listPermissions({ page: 1, pageSize: 500 });
    return resp.items;
  },

  getPermissionById: async (id: string): Promise<Permission> => {
    const resp = await http.get<Permission>(`/v1/system/permissions/${id}`);
    return resp.data;
  },

  createPermission: async (data: Partial<PermissionFormData>): Promise<Permission> => {
    const resp = await http.post<Permission>('/v1/system/permissions', {
      ...data,
      type: toBackendType(data.type),
    });
    return resp.data;
  },

  updatePermission: async (id: string, data: Partial<PermissionFormData>): Promise<Permission> => {
    const resp = await http.put<Permission>(`/v1/system/permissions/${id}`, {
      ...data,
      type: toBackendType(data.type),
    });
    return resp.data;
  },

  deletePermission: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/permissions/${id}`);
  },

  batchDeletePermissions: async (ids: string[]): Promise<void> => {
    await http.post('/v1/system/permissions/batch-delete', { permissionIds: ids });
  },

  batchUpdatePermissionStatus: async (
    ids: string[],
    status: 'active' | 'inactive'
  ): Promise<void> => {
    await http.patch('/v1/system/permissions/status', { permissionIds: ids, status });
  },
};


