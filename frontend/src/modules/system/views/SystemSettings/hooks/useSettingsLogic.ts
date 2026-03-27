import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useLanguageStore } from '../../../../../stores/languageStore';
import { settingApi } from '../../../api/settingApi';

function buildSchemaDefaults(schema: Record<string, any>) {
  const defaults: Record<string, any> = {};
  Object.values(schema).forEach((section: any) => {
    section.settings?.forEach((setting: any) => {
      defaults[setting.key] = setting.value;
    });
  });
  return defaults;
}

export function useSettingsLogic(schema: Record<string, any>, enabled = true) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';

  const [activeTab, setActiveTab] = useState('basic');
  const [baseValues, setBaseValues] = useState<Record<string, any>>({});
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const typeMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    Object.values(schema).forEach((section: any) => {
      section.settings?.forEach((setting: any) => {
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
    (key: string, value: any) => {
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
      loading: zh ? '正在同步系统配置...' : 'Syncing system settings...',
      success: zh ? '系统配置已更新' : 'System settings updated',
      error: zh ? '配置同步失败，请重试' : 'Failed to sync settings',
    });
  }, [editingValues, zh]);

  const handleReset = useCallback(() => {
    setEditingValues({});
    toast.info(zh ? '已还原所有未保存的修改' : 'Reverted all unsaved changes');
  }, [zh]);

  const sectionsWithValues = useMemo(() => {
    const result: Record<string, any> = {};
    Object.entries(schema).forEach(([tabKey, section]: [string, any]) => {
      result[tabKey] = {
        ...section,
        settings: (section.settings ?? []).map((setting: any) => ({
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
