import { ID, User } from '../types';
import { http } from '../../../api/client';

interface BackendUser {
  id: string;
  username: string;
  real_name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: string;
  department_id?: string;
  department_name?: string;
  position_id?: string;
  position_name?: string;
  role_ids?: string[];
  role_names?: string[];
  tenant_id?: string;
  created_at: string;
  last_login_at?: string;
  last_login_ip?: string;
}

function mapUser(u: BackendUser): User {
  return {
    id: u.id,
    username: u.username,
    realName: u.real_name,
    email: u.email,
    phone: u.phone,
    avatar: u.avatar,
    status: u.status as User['status'],
    departmentId: u.department_id || '',
    departmentName: u.department_name || '',
    positionId: u.position_id,
    positionName: u.position_name,
    roleIds: u.role_ids || [],
    roleNames: u.role_names || [],
    userGroupIds: [],
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
    lastLoginIp: u.last_login_ip,
  };
}

export const userApi = {
  listUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    departmentId?: string;
    roleId?: string;
  }): Promise<{ items: User[]; total: number }> => {
    const resp = await http.getPage<BackendUser>('/v1/system/users', {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 20,
      search: params?.search || '',
      status: params?.status || '',
      department_id: params?.departmentId || '',
      role_id: params?.roleId || '',
    });
    return {
      items: (resp.data?.items || []).map(mapUser),
      total: resp.data?.pagination?.total || 0,
    };
  },

  getUsers: async (): Promise<User[]> => {
    const resp = await userApi.listUsers({ page: 1, pageSize: 100 });
    return resp.items;
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const password = (data as { password?: string }).password;
    if (!password) {
      throw new Error('Password is required');
    }
    const resp = await http.post<BackendUser>('/v1/system/users', {
      username: data.username,
      real_name: data.realName,
      email: data.email,
      phone: data.phone,
      password,
      department_id: data.departmentId,
      position_id: data.positionId,
      role_ids: data.roleIds || [],
      status: data.status,
    });
    return mapUser(resp.data);
  },

  updateUser: async (
    id: string,
    data: Partial<User> & { departmentId?: ID | null; positionId?: ID | null }
  ): Promise<User> => {
    const payload: Record<string, unknown> = {
      real_name: data.realName,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      status: data.status,
      role_ids: data.roleIds,
    };

    if (Object.prototype.hasOwnProperty.call(data, 'departmentId')) {
      payload.department_id = data.departmentId ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(data, 'positionId')) {
      payload.position_id = data.positionId ?? null;
    }

    const resp = await http.put<BackendUser>(`/v1/system/users/${id}`, payload);
    return mapUser(resp.data);
  },

  deleteUser: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/users/${id}`);
  },

  batchUpdateStatus: async (ids: string[], status: string): Promise<void> => {
    await http.patch('/v1/system/users/status', { user_ids: ids, status });
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await http.patch(`/v1/system/users/${id}/password`, { new_password: newPassword });
  },

  getUserPermissions: async (id: string): Promise<string[]> => {
    const resp = await http.get<string[]>(`/v1/system/users/${id}/permissions`);
    return resp.data || [];
  },

  getUserGroups: async () => {
    return [];
  },
};
