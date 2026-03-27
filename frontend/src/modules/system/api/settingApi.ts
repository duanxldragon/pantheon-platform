import { SystemSetting } from '../types';
import { http } from '../../../api/client';
import { ApiError } from '../../../shared/utils/apiClient';

interface BackendSetting {
  id?: string;
  category?: string;
  key: string;
  value: string;
  label?: string;
  type?: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  description?: string;
  editable?: boolean;
  updated_at?: string;
  updated_by?: string;
}

function mapSetting(setting: BackendSetting): SystemSetting {
  return {
    id: setting.id || setting.key,
    category: setting.category || 'system',
    key: setting.key,
    value: setting.value,
    label: setting.label || setting.key,
    type: setting.type || 'text',
    description: setting.description || '',
    editable: setting.editable ?? true,
    updatedAt: setting.updated_at || '',
    updatedBy: setting.updated_by || '',
  };
}

export const settingApi = {
  getSettings: async (): Promise<SystemSetting[]> => {
    try {
      const resp = await http.get<BackendSetting[]>('/v1/system/settings');
      return (resp.data || []).map(mapSetting);
    } catch (error) {
      if (error instanceof ApiError && error.code === 404) {
        return [];
      }
      return [];
    }
  },

  updateSetting: async (key: string, value: string): Promise<void> => {
    await http.put(`/v1/system/settings/${key}`, { value });
  },

  batchUpdateSettings: async (updates: Record<string, string>): Promise<void> => {
    await http.post('/v1/system/settings/batch', { updates });
  },
};
