import { useCallback, useEffect, useState } from 'react';

import { operationNotification, systemNotification } from '../../../shared/utils/notification';
import { useLanguageStore } from '../../../stores/language_store';
import { authApi, type ApiKeyItem, type ApiKeyResponse } from '../api/auth_api';

export type ManagedApiKey = ApiKeyItem & {
  keyValue?: string;
};

const defaultApiKeyLifetimeMs = 90 * 24 * 60 * 60 * 1000;
const defaultApiKeyRateLimit = 60;
const defaultApiKeyPermissions = 'read';

function mapCreatedApiKey(data: ApiKeyResponse): ManagedApiKey {
  return {
    id: data.id,
    name: data.name,
    keyPreview: data.key,
    keyValue: data.key,
    permissions: data.permissions,
    allowedIps: data.allowedIps,
    rateLimit: data.rateLimit,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    lastUsed: data.lastUsed,
  };
}

export function useApiKeys() {
  const { language } = useLanguageStore();
  const zh = language === 'zh';

  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newPermissions, setNewPermissions] = useState(defaultApiKeyPermissions);
  const [newAllowedIps, setNewAllowedIps] = useState('');
  const [newRateLimit, setNewRateLimit] = useState(String(defaultApiKeyRateLimit));
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<ManagedApiKey[]>([]);

  const loadApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await authApi.listApiKeys();
      setApiKeys(resp.data.items || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      systemNotification.error(zh ? '加载 API 密钥失败' : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [zh]);

  useEffect(() => {
    void loadApiKeys();
  }, [loadApiKeys]);

  const toggleVisible = (id: string) => {
    setVisibleKeys((current) => ({ ...current, [id]: !current[id] }));
  };

  const copyKey = async (item: ManagedApiKey) => {
    const value = item.keyValue || item.keyPreview;
    try {
      await navigator.clipboard.writeText(value);
      systemNotification.success(zh ? 'API 密钥已复制' : 'API key copied');
    } catch (error) {
      console.error('Error copying API key:', error);
      operationNotification.operationFailed(zh ? '复制 API 密钥' : 'Copy API key');
    }
  };

  const removeKey = async (id: string) => {
    try {
      await authApi.deleteApiKey(id);
      setApiKeys((current) => current.filter((item) => item.id !== id));
      systemNotification.success(zh ? 'API 密钥已删除' : 'API key deleted');
    } catch (error) {
      console.error('Error deleting API key:', error);
      systemNotification.error(zh ? '删除 API 密钥失败' : 'Failed to delete API key');
    }
  };

  const createKey = async () => {
    const trimmedName = newKeyName.trim();
    if (!trimmedName) {
      systemNotification.error(zh ? '请输入密钥名称' : 'Please enter a key name');
      return;
    }
    const trimmedPermissions = newPermissions.trim();
    if (!trimmedPermissions) {
      systemNotification.error(zh ? '请输入权限范围' : 'Please enter API key permissions');
      return;
    }

    const parsedRateLimit = Number.parseInt(newRateLimit, 10);
    if (!Number.isFinite(parsedRateLimit) || parsedRateLimit <= 0) {
      systemNotification.error(zh ? '请输入有效的每分钟限流值' : 'Please enter a valid per-minute rate limit');
      return;
    }

    try {
      setLoading(true);
      const resp = await authApi.createApiKey({
        name: trimmedName,
        permissions: trimmedPermissions,
        allowedIps: newAllowedIps
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        rateLimit: parsedRateLimit,
        expiresAt: new Date(Date.now() + defaultApiKeyLifetimeMs).toISOString(),
      });

      const created = mapCreatedApiKey(resp.data);
      setApiKeys((current) => [created, ...current]);
      setVisibleKeys((current) => ({ ...current, [created.id]: true }));
      setCreating(false);
      setNewKeyName('');
      setNewPermissions(defaultApiKeyPermissions);
      setNewAllowedIps('');
      setNewRateLimit(String(defaultApiKeyRateLimit));
      systemNotification.success(
        zh ? 'API 密钥创建成功' : 'API key created',
        zh ? '完整密钥仅展示一次，请立即复制并妥善保存' : 'The full key is shown only once, please save it now',
      );
    } catch (error) {
      console.error('Error creating API key:', error);
      systemNotification.error(zh ? '创建 API 密钥失败' : 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  return {
    creating,
    setCreating,
    loading,
    newKeyName,
    setNewKeyName,
    newPermissions,
    setNewPermissions,
    newAllowedIps,
    setNewAllowedIps,
    newRateLimit,
    setNewRateLimit,
    visibleKeys,
    apiKeys,
    loadApiKeys,
    toggleVisible,
    copyKey,
    removeKey,
    createKey,
  };
}
