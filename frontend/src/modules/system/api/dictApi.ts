import { http } from '../../../api/client';
import type { PageResult } from '../../../shared/utils/apiClient';

export interface DictTypeDTO {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface DictDataDTO {
  id: string;
  type_id: string;
  label: string;
  value: string;
  description?: string;
  sort: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export const dictApi = {
  listTypes: async (params?: { page?: number; pageSize?: number; search?: string }): Promise<PageResult<DictTypeDTO>> => {
    const resp = await http.getPage<DictTypeDTO>('/v1/system/dict/types', {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 200,
      search: params?.search ?? '',
    });
    return resp.data;
  },

  createType: async (data: { name: string; code: string; description?: string; status?: 'active' | 'inactive' }): Promise<DictTypeDTO> => {
    const resp = await http.post<DictTypeDTO>('/v1/system/dict/types', {
      name: data.name,
      code: data.code,
      description: data.description || '',
      status: data.status || 'active',
    });
    return resp.data;
  },

  updateType: async (
    id: string,
    data: { name: string; code: string; description?: string; status?: 'active' | 'inactive' }
  ): Promise<DictTypeDTO> => {
    const resp = await http.put<DictTypeDTO>(`/v1/system/dict/types/${id}`, {
      name: data.name,
      code: data.code,
      description: data.description || '',
      status: data.status || 'active',
    });
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
  }): Promise<PageResult<DictDataDTO>> => {
    const resp = await http.getPage<DictDataDTO>('/v1/system/dict/data', {
      type_id: params.typeId,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 50,
      search: params.search ?? '',
    });
    return resp.data;
  },

  createData: async (data: {
    typeId: string;
    label: string;
    value: string;
    description?: string;
    sort?: number;
    status?: 'active' | 'inactive';
  }): Promise<DictDataDTO> => {
    const resp = await http.post<DictDataDTO>('/v1/system/dict/data', {
      type_id: data.typeId,
      label: data.label,
      value: data.value,
      description: data.description || '',
      sort: data.sort ?? 0,
      status: data.status || 'active',
    });
    return resp.data;
  },

  updateData: async (
    id: string,
    data: {
      typeId: string;
      label: string;
      value: string;
      description?: string;
      sort?: number;
      status?: 'active' | 'inactive';
    }
  ): Promise<DictDataDTO> => {
    const resp = await http.put<DictDataDTO>(`/v1/system/dict/data/${id}`, {
      type_id: data.typeId,
      label: data.label,
      value: data.value,
      description: data.description || '',
      sort: data.sort ?? 0,
      status: data.status || 'active',
    });
    return resp.data;
  },

  deleteData: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/dict/data/${id}`);
  },
};

