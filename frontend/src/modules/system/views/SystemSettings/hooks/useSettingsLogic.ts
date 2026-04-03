import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { settingApi } from '../../../api/settingApi';
import type { SystemSetting } from '../../../types';

export type SettingValue = string | number | boolean;
export type SettingType = SystemSetting['type'];

export interface SettingsField {
  key: string;
  label: string;
  description: string;
  value: SettingValue;
  type: SettingType;
  options?: string[];
  editable: boolean;
  required?: boolean;
}

export interface SettingsSection {
  title: string;
  description: string;
  settings: SettingsField[];
}

export type SettingsSchema = Record<string, SettingsSection>;
type SettingsValueMap = Record<string, SettingValue>;

function buildSchemaDefaults(schema: SettingsSchema): SettingsValueMap {
  const defaults: SettingsValueMap = {};
  Object.values(schema).forEach((section) => {
    section.settings.forEach((setting) => {
      defaults[setting.key] = setting.value;
    });
  });
  return defaults;
}

interface SettingsLogicMessages {
  loading: string;
  success: string;
  error: string;
  reset: string;
}

export function useSettingsLogic(
  schema: SettingsSchema,
  messages: SettingsLogicMessages,
  enabled = true,
) {
  const [activeTab, setActiveTab] = useState('basic');
  const [baseValues, setBaseValues] = useState<SettingsValueMap>({});
  const [editingValues, setEditingValues] = useState<Partial<SettingsValueMap>>({});
  const [loading, setLoading] = useState(true);

  const typeMap = useMemo<Record<string, SettingType>>(() => {
    const map: Record<string, SettingType> = {};
    Object.values(schema).forEach((section) => {
      section.settings.forEach((setting) => {
        map[setting.key] = setting.type ?? 'text';
      });
    });
    return map;
  }, [schema]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const defaults = buildSchemaDefaults(schema);

      if (!enabled) {
        setBaseValues(defaults);
        setEditingValues({});
        setLoading(false);
        return;
      }

      try {
        const merged = { ...defaults };
        const apiSettings = await settingApi.getSettings();

        apiSettings.forEach((setting) => {
          const type = typeMap[setting.key] ?? 'text';
          if (type === 'boolean') {
            merged[setting.key] = setting.value === 'true' || setting.value === '1';
            return;
          }
          if (type === 'number') {
            const num = Number(setting.value);
            merged[setting.key] = Number.isNaN(num) ? 0 : num;
            return;
          }
          merged[setting.key] = setting.value;
        });

        setBaseValues(merged);
      } catch {
        setBaseValues(defaults);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [enabled, schema, typeMap]);

  const isDirty = useMemo(() => Object.keys(editingValues).length > 0, [editingValues]);

  const handleChange = useCallback(
    (key: string, value: SettingValue) => {
      const base = Object.prototype.hasOwnProperty.call(baseValues, key) ? baseValues[key] : undefined;
      if (value === base) {
        setEditingValues((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        return;
      }
      setEditingValues((prev) => ({ ...prev, [key]: value }));
    },
    [baseValues],
  );

  const handleSave = useCallback(async () => {
    const entries = Object.entries(editingValues);
    if (!entries.length) {
      return;
    }

    const doSave = async () => {
      await Promise.all(entries.map(([key, value]) => settingApi.updateSetting(key, String(value))));
      setBaseValues((prev) => ({ ...prev, ...editingValues }));
      setEditingValues({});
    };

    toast.promise(doSave(), {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  }, [editingValues, messages.error, messages.loading, messages.success]);

  const handleReset = useCallback(() => {
    setEditingValues({});
    toast.info(messages.reset);
  }, [messages.reset]);

  const sectionsWithValues = useMemo(() => {
    const result: SettingsSchema = {};
    Object.entries(schema).forEach(([tabKey, section]) => {
      result[tabKey] = {
        ...section,
        settings: section.settings.map((setting) => ({
          ...setting,
          value: Object.prototype.hasOwnProperty.call(baseValues, setting.key)
            ? baseValues[setting.key]
            : setting.value,
        })),
      };
    });
    return result;
  }, [schema, baseValues]);

  return {
    activeTab,
    setActiveTab,
    editingValues,
    isDirty,
    loading,
    sectionsWithValues,
    handleChange,
    handleSave,
    handleReset,
  };
}
