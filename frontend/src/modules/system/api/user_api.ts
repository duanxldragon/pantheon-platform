import { ID, User } from '../types';
import { http } from '../../../shared/utils/axios_client';

export const userApi = {
  listUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    departmentId?: string;
    roleId?: string;
  }): Promise<{ items: User[]; total: number }> => {
    const resp = await http.getPage<User>('/v1/system/users', {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      search: params?.search || '',
      status: params?.status || '',
      departmentId: params?.departmentId || '',
      roleId: params?.roleId || '',
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  getUsers: async (): Promise<User[]> => {
    const resp = await userApi.listUsers({ page: 1, pageSize: 100 });
    return resp.items;
  },

  createUser: async (data: Partial<User> & { password?: string }): Promise<User> => {
    const password = (data as { password?: string }).password;
    if (!password) {
      throw new Error('Password is required');
    }
    const resp = await http.post<User>('/v1/system/users', {
      ...data,
      password,
    });
    return resp.data;
  },

  updateUser: async (
    id: string,
    data: Partial<User> & { departmentId?: ID | null; positionId?: ID | null }
  ): Promise<User> => {
    const resp = await http.put<User>(`/v1/system/users/${id}`, data);
    return resp.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/users/${id}`);
  },

  batchUpdateStatus: async (ids: string[], status: string): Promise<void> => {
    await http.patch('/v1/system/users/status', { userIds: ids, status });
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await http.patch(`/v1/system/users/${id}/password`, { newPassword });
  },

  getUserPermissions: async (id: string): Promise<string[]> => {
    const resp = await http.get<string[]>(`/v1/system/users/${id}/permissions`);
    return resp.data || [];
  },

  getUserGroups: async () => {
    return [];
  },
};


