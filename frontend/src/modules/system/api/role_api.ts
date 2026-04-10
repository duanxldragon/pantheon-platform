import { Role } from '../types';
import { http } from '../../../shared/utils/axios_client';

export const roleApi = {
  getRoles: async (): Promise<Role[]> => {
    const resp = await http.getPage<Role>('/v1/system/roles', { page: 1, pageSize: 100 });
    return resp.data?.items || [];
  },

  getRoleById: async (id: string): Promise<Role> => {
    const resp = await http.get<Role>(`/v1/system/roles/${id}`);
    return resp.data;
  },

  createRole: async (data: Partial<Role>): Promise<Role> => {
    const resp = await http.post<Role>('/v1/system/roles', data);
    return resp.data;
  },

  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    const resp = await http.put<Role>(`/v1/system/roles/${id}`, data);
    return resp.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/roles/${id}`);
  },

  batchDeleteRoles: async (ids: string[]): Promise<void> => {
    await http.post('/v1/system/roles/batch-delete', { roleIds: ids });
  },

  batchUpdateRoleStatus: async (ids: string[], status: 'active' | 'inactive'): Promise<void> => {
    await http.patch('/v1/system/roles/status', { roleIds: ids, status });
  },

  assignMenus: async (id: string, menuIds: Array<string | number>): Promise<void> => {
    await http.post(`/v1/system/roles/${id}/menus`, { menuIds: menuIds.map(String) });
  },

  assignPermissions: async (id: string, permissionIds: Array<string | number>): Promise<void> => {
    await http.post(`/v1/system/roles/${id}/permissions`, { permissionIds: permissionIds.map(String) });
  },
};


