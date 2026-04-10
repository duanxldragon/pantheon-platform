import { SystemSetting } from '../types';
import { http } from '../../../shared/utils/axios_client';

// axios拦截器会自动处理snake_case ↔ camelCase转换
// 不再需要手动映射字段名

export const settingApi = {
  getSettings: async (category?: string): Promise<SystemSetting[]> => {
    const url = category ? `/v1/system/settings?category=${category}` : '/v1/system/settings';
    const resp = await http.get<SystemSetting[]>(url);
    return resp.data || [];
  },

  getSettingByKey: async (key: string): Promise<SystemSetting> => {
    const resp = await http.get<SystemSetting>(`/v1/system/settings/${key}`);
    return resp.data;
  },

  updateSetting: async (key: string, value: string): Promise<SystemSetting> => {
    const resp = await http.put<SystemSetting>(`/v1/system/settings/${key}`, { value });
    return resp.data;
  },

  batchUpdateSettings: async (updates: Record<string, string>): Promise<void> => {
    await http.post('/v1/system/settings/batch', { updates });
  },

  deleteSetting: async (key: string): Promise<void> => {
    await http.delete(`/v1/system/settings/${key}`);
  },
};





