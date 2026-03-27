import { Position, PositionFormData } from '../types';
import { http } from '../../../api/client';

interface BackendPosition {
  id: string;
  name: string;
  code: string;
  category?: string;
  description?: string;
  department_id?: string;
  department_name?: string;
  level?: number;
  sort?: number;
  status?: string;
  responsibilities?: string;
  requirements?: string;
  user_count?: number;
  created_at?: string;
}

function mapPosition(p: BackendPosition): Position {
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    departmentId: p.department_id || null,
    departmentName: p.department_name,
    category: p.category || '',
    level: p.level || 1,
    userCount: p.user_count || 0,
    status: (p.status || 'active') as Position['status'],
    sort: p.sort || 0,
    responsibilities: p.responsibilities,
    requirements: p.requirements,
    description: p.description,
    createdAt: p.created_at || '',
    createdBy: '',
  };
}

export const positionApi = {
  getPositions: async (): Promise<Position[]> => {
    const resp = await http.getPage<BackendPosition>('/v1/system/positions', { page: 1, page_size: 1000 });
    return (resp.data?.items || []).map(mapPosition);
  },

  createPosition: async (data: Partial<PositionFormData>): Promise<Position> => {
    const resp = await http.post<BackendPosition>('/v1/system/positions', {
      name: data.name,
      code: data.code,
      category: data.category,
      description: data.description,
      department_id: data.departmentId,
      level: data.level,
      sort: data.sort,
      status: data.status,
      responsibilities: data.responsibilities,
      requirements: data.requirements,
    });
    return mapPosition(resp.data);
  },

  updatePosition: async (id: string, data: Partial<PositionFormData>): Promise<Position> => {
    const resp = await http.put<BackendPosition>(`/v1/system/positions/${id}`, {
      name: data.name,
      code: data.code,
      category: data.category,
      description: data.description,
      department_id: data.departmentId,
      level: data.level,
      sort: data.sort,
      status: data.status,
      responsibilities: data.responsibilities,
      requirements: data.requirements,
    });
    return mapPosition(resp.data);
  },

  deletePosition: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/positions/${id}`);
  },
};
