import { Role } from '../types';
import { http } from '../../../api/client';

interface BackendRole {
  id: string;
  name: string;
  code: string;
  description?: string;
  type?: 'system' | 'custom';
  status?: string;
  user_count?: number;
  tenant_id?: string;
  created_at?: string;
  menu_ids?: string[];
  permissions?: { id: string; name: string; code: string }[];
}

function mapRole(r: BackendRole): Role {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    description: r.description || '',
    menuIds: r.menu_ids || [],
    permissionIds: (r.permissions || []).map(p => p.id),
    permissions: [],
    type: r.type || 'custom',
    createdBy: '',
    status: (r.status || 'active') as Role['status'],
    userCount: r.user_count || 0,
    createdAt: r.created_at || '',
  };
}
export const roleApi = {
  getRoles: async (): Promise<Role[]> => {
    const resp = await http.getPage<BackendRole>('/v1/system/roles', { page: 1, page_size: 100 });
    return (resp.data?.items || []).map(mapRole);
  },

  getRoleById: async (id: string): Promise<Role> => {
    const resp = await http.get<BackendRole>(`/v1/system/roles/${id}`);
    return mapRole(resp.data);
  },

  createRole: async (data: Partial<Role>): Promise<Role> => {
    const resp = await http.post<BackendRole>('/v1/system/roles', {
      name: data.name,
      code: data.code,
      description: data.description,
      type: data.type || 'custom',
      status: data.status,
    });
    return mapRole(resp.data);
  },

  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    const resp = await http.put<BackendRole>(`/v1/system/roles/${id}`, {
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status,
    });
    return mapRole(resp.data);
  },

  deleteRole: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/roles/${id}`);
  },

  batchDeleteRoles: async (ids: string[]): Promise<void> => {
    await http.post('/v1/system/roles/batch-delete', { role_ids: ids });
  },

  batchUpdateRoleStatus: async (ids: string[], status: 'active' | 'inactive'): Promise<void> => {
    await http.patch('/v1/system/roles/status', { role_ids: ids, status });
  },

  assignMenus: async (id: string, menuIds: Array<string | number>): Promise<void> => {
    await http.post(`/v1/system/roles/${id}/menus`, { menu_ids: menuIds.map(String) });
  },

  assignPermissions: async (id: string, permissionIds: Array<string | number>): Promise<void> => {
    await http.post(`/v1/system/roles/${id}/permissions`, { permission_ids: permissionIds.map(String) });
  },
};
