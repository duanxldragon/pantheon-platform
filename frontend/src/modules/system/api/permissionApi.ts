import { Permission } from '../types';
import { http } from '../../../api/client';

interface BackendPermission {
  id: string;
  code: string;
  name: string;
  type: 'menu' | 'button' | 'api';
  resource?: string;
  action?: string;
  status?: 'active' | 'inactive';
  description?: string;
  created_at: string;
}

function mapPermissionType(type: BackendPermission['type']): Permission['type'] {
  if (type === 'menu') {
    return 'menu';
  }
  if (type === 'button') {
    return 'operation';
  }
  return 'operation';
}

function mapPermission(permission: BackendPermission): Permission {
  const moduleName = permission.resource?.split(':')[0] || 'system';
  return {
    id: permission.id,
    code: permission.code,
    name: permission.name,
    type: mapPermissionType(permission.type),
    module: moduleName,
    status: (permission.status || 'active') as Permission['status'],
    description: permission.description,
    createdAt: permission.created_at,
  };
}

export const permissionApi = {
  getPermissions: async (): Promise<Permission[]> => {
    const resp = await http.getPage<BackendPermission>('/v1/system/permissions', { page: 1, page_size: 500 });
    return (resp.data?.items || []).map(mapPermission);
  },

  getPermissionById: async (id: string): Promise<Permission | null> => {
    try {
      const resp = await http.get<BackendPermission>(`/v1/system/permissions/${id}`);
      return mapPermission(resp.data);
    } catch {
      return null;
    }
  },

  createPermission: async (data: Partial<Permission>): Promise<Permission> => {
    const resp = await http.post<BackendPermission>('/v1/system/permissions', {
      name: data.name,
      code: data.code,
      type: data.type === 'menu' ? 'menu' : 'button',
      resource: data.module,
      action: data.code,
      status: data.status || 'active',
      description: data.description,
    });
    return mapPermission(resp.data);
  },

  updatePermission: async (id: string, data: Partial<Permission>): Promise<Permission | null> => {
    try {
      const resp = await http.put<BackendPermission>(`/v1/system/permissions/${id}`, {
        name: data.name,
        code: data.code,
        type: data.type === 'menu' ? 'menu' : 'button',
        resource: data.module,
        action: data.code,
        status: data.status,
        description: data.description,
      });
      return mapPermission(resp.data);
    } catch {
      return null;
    }
  },

  deletePermission: async (id: string): Promise<boolean> => {
    await http.delete(`/v1/system/permissions/${id}`);
    return true;
  },

  batchDeletePermissions: async (ids: string[]): Promise<boolean> => {
    await Promise.all(ids.map((id) => http.delete(`/v1/system/permissions/${id}`)));
    return true;
  },
};
