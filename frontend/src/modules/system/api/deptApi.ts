import { Department } from '../types';
import { http } from '../../../api/client';

interface BackendDepartment {
  id: string;
  name: string;
  code: string;
  parent_id?: string;
  parent_name?: string;
  leader_name?: string;
  leader_id?: string;
  phone?: string;
  email?: string;
  sort?: number;
  status?: string;
  description?: string;
  user_count?: number;
  children?: BackendDepartment[];
  created_at?: string;
}

function mapDepartment(d: BackendDepartment): Department {
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    parentId: d.parent_id || null,
    parentName: d.parent_name,
    level: 0,
    leaderId: d.leader_id,
    leader: d.leader_name || '',
    phone: d.phone || '',
    email: d.email || '',
    userCount: d.user_count || 0,
    status: (d.status || 'active') as Department['status'],
    sort: d.sort || 0,
    description: d.description,
    children: d.children?.map(mapDepartment) || [],
    createdAt: d.created_at || '',
  };
}

export const deptApi = {
  getDepartments: async (): Promise<Department[]> => {
    const resp = await http.get<BackendDepartment[]>('/v1/system/depts/tree');
    return (resp.data || []).map(mapDepartment);
  },

  createDepartment: async (data: Partial<Department>): Promise<Department> => {
    const resp = await http.post<BackendDepartment>('/v1/system/depts', {
      name: data.name,
      code: data.code,
      parent_id: data.parentId,
      leader_id: data.leaderId,
      phone: data.phone,
      email: data.email,
      sort: data.sort,
      status: data.status,
      description: data.description,
    });
    return mapDepartment(resp.data);
  },

  updateDepartment: async (id: string, data: Partial<Department>): Promise<Department> => {
    const resp = await http.put<BackendDepartment>(`/v1/system/depts/${id}`, {
      name: data.name,
      code: data.code,
      parent_id: data.parentId,
      leader_id: data.leaderId,
      phone: data.phone,
      email: data.email,
      sort: data.sort,
      status: data.status,
      description: data.description,
    });
    return mapDepartment(resp.data);
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/depts/${id}`);
  },

  batchDeleteDepartments: async (ids: string[]): Promise<void> => {
    await http.post('/v1/system/depts/batch-delete', { department_ids: ids });
  },

  batchUpdateDepartmentStatus: async (ids: string[], status: 'active' | 'inactive'): Promise<void> => {
    await http.patch('/v1/system/depts/status', { department_ids: ids, status });
  },
};
