import { Department } from '../types';
import { http } from '../../../shared/utils/axios_client';

// axios拦截器会自动处理snake_case ↔ camelCase转换
// 不再需要手动映射字段名

export const deptApi = {
  getDepartments: async (): Promise<Department[]> => {
    const resp = await http.get<Department[]>('/v1/system/depts/tree');
    return resp.data || [];
  },

  createDepartment: async (data: Partial<Department>): Promise<Department> => {
    const resp = await http.post<Department>('/v1/system/depts', data);
    return resp.data;
  },

  updateDepartment: async (id: string, data: Partial<Department>): Promise<Department> => {
    const resp = await http.put<Department>(`/v1/system/depts/${id}`, data);
    return resp.data;
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/depts/${id}`);
  },

  batchDeleteDepartments: async (ids: string[]): Promise<void> => {
    await http.post('/v1/system/depts/batch-delete', { departmentIds: ids });
  },

  batchUpdateDepartmentStatus: async (ids: string[], status: 'active' | 'inactive'): Promise<void> => {
    await http.patch('/v1/system/depts/status', { departmentIds: ids, status });
  },
};


