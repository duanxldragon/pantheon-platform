import { Position, PositionFormData } from '../types';
import { http } from '../../../shared/utils/axios_client';

// axios拦截器会自动处理snake_case ↔ camelCase转换
// 不再需要手动映射字段名

export const positionApi = {
  listPositions: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    departmentId?: string;
    level?: string;
  }): Promise<{ items: Position[]; total: number }> => {
    const resp = await http.getPage<Position>('/v1/system/positions', {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      search: params?.search || '',
      status: params?.status || '',
      departmentId: params?.departmentId || '',
      level: params?.level || '',
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  getPositions: async (): Promise<Position[]> => {
    const resp = await positionApi.listPositions({ page: 1, pageSize: 100 });
    return resp.items;
  },

  getPositionById: async (id: string): Promise<Position> => {
    const resp = await http.get<Position>(`/v1/system/positions/${id}`);
    return resp.data;
  },

  createPosition: async (data: Partial<PositionFormData>): Promise<Position> => {
    const resp = await http.post<Position>('/v1/system/positions', data);
    return resp.data;
  },

  updatePosition: async (id: string, data: Partial<PositionFormData>): Promise<Position> => {
    const resp = await http.put<Position>(`/v1/system/positions/${id}`, data);
    return resp.data;
  },

  deletePosition: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/positions/${id}`);
  },

  batchDeletePositions: async (ids: string[]): Promise<void> => {
    await http.post('/v1/system/positions/batch-delete', { positionIds: ids });
  },

  batchUpdatePositionStatus: async (ids: string[], status: 'active' | 'inactive'): Promise<void> => {
    await http.patch('/v1/system/positions/status', { positionIds: ids, status });
  },
};


