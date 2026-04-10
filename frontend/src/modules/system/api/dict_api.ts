import { http } from '../../../shared/utils/axios_client';

// axios拦截器会自动处理snake_case ↔ camelCase转换
// 不再需要手动映射字段名

export interface DictType {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface DictData {
  id: string;
  typeId: string;
  label: string;
  value: string;
  description?: string;
  sort: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export const dictApi = {
  listTypes: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<{ items: DictType[]; total: number }> => {
    const resp = await http.getPage<DictType>('/v1/system/dict/types', {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 200,
      search: params?.search || '',
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  createType: async (data: {
    name: string;
    code: string;
    description?: string;
    status?: 'active' | 'inactive';
  }): Promise<DictType> => {
    const resp = await http.post<DictType>('/v1/system/dict/types', data);
    return resp.data;
  },

  updateType: async (
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      status?: 'active' | 'inactive';
    }
  ): Promise<DictType> => {
    const resp = await http.put<DictType>(`/v1/system/dict/types/${id}`, data);
    return resp.data;
  },

  deleteType: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/dict/types/${id}`);
  },

  listData: async (params: {
    typeId: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<{ items: DictData[]; total: number }> => {
    const resp = await http.getPage<DictData>('/v1/system/dict/data', {
      typeId: params.typeId,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 50,
      search: params.search || '',
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  createData: async (data: {
    typeId: string;
    label: string;
    value: string;
    description?: string;
    sort?: number;
    status?: 'active' | 'inactive';
  }): Promise<DictData> => {
    const resp = await http.post<DictData>('/v1/system/dict/data', data);
    return resp.data;
  },

  updateData: async (
    id: string,
    data: {
      label?: string;
      value?: string;
      description?: string;
      sort?: number;
      status?: 'active' | 'inactive';
    }
  ): Promise<DictData> => {
    const resp = await http.put<DictData>(`/v1/system/dict/data/${id}`, data);
    return resp.data;
  },

  deleteData: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/dict/data/${id}`);
  },
};






