import { Copy, Eye, EyeOff, KeyRound, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { ConfirmDialog } from '../../../../../shared/components/ui/confirm_dialog';
import { useLanguageStore } from '../../../../../stores/language_store';
import { useThemeStore } from '../../../../../stores/theme_store';
import { useProfilePreferenceSettings } from '../../hooks/use_profile_preference_settings';
import { useApiKeys } from '../../../hooks';
import type { ManagedApiKey } from '../../../hooks/use_api_keys';

function maskKey(value: string): string {
  if (!value) {
    return '••••••••••••';
  }
  return value.replace(/[A-Za-z0-9]/g, '•');
}

export function ApiKeyManagement() {
  const { theme } = useThemeStore();
  const { language } = useLanguageStore();
  const { compactMode } = useProfilePreferenceSettings();
  const zh = language === 'zh';
  const [removeTarget, setRemoveTarget] = useState<ManagedApiKey | null>(null);
  const copy = {
    securityNotice: zh ? '安全提示' : 'Security Notice',
    securityDesc: zh
      ? 'API 密钥仅在创建时展示完整内容，请立即复制并妥善保存；如怀疑泄露，请及时删除并重新生成。'
      : 'A full API key is only shown once when created. Copy and store it securely.',
    expiryHint: zh ? '默认有效期 90 天，可在后续接口能力中继续收紧。' : 'New keys expire after 90 days by default.',
    allowlistHint: zh ? '可选，使用英文逗号分隔 IP 或 CIDR。留空表示不限制来源。' : 'Optional. Use commas to separate IPs or CIDRs. Leave empty to allow any source.',
    keyName: zh ? '密钥名称' : 'Key Name',
    keyNamePlaceholder: zh ? '例如：生产环境只读密钥' : 'For example: production read-only key',
    permissions: zh ? '权限范围' : 'Permissions',
    permissionsPlaceholder: zh ? '例如：read 或 /api/v1/system/users:get' : 'For example: read or /api/v1/system/users:get',
    permissionsHint: zh
      ? '支持 read / write，或使用 /api/v1/system/users:get 这类精确接口范围。'
      : 'Supports read / write, or explicit scopes like /api/v1/system/users:get.',
    allowedIps: zh ? '允许来源 IP' : 'Allowed IPs',
    allowedIpsPlaceholder: zh ? '例如：10.0.0.10,192.168.1.0/24' : 'For example: 10.0.0.10,192.168.1.0/24',
    rateLimit: zh ? '每分钟限流' : 'Requests / min',
    createKey: zh ? '创建密钥' : 'Create Key',
    cancel: zh ? '取消' : 'Cancel',
    createNewKey: zh ? '创建新密钥' : 'Create New Key',
    refresh: zh ? '刷新' : 'Refresh',
    createdAt: zh ? '创建时间' : 'Created',
    expiresAt: zh ? '过期时间' : 'Expires',
    lastUsed: zh ? '最近使用' : 'Last used',
    anyIp: zh ? '不限来源' : 'Any IP',
    noKeys: zh ? '暂无 API 密钥' : 'No API keys yet',
    removeTitle: zh ? '确认删除 API 密钥' : 'Confirm API Key Deletion',
    removeDescription: (name: string) =>
      zh
        ? `删除密钥“${name}”后将立即失效，依赖它的调用会被中断。请确认已完成替换。`
        : `Deleting "${name}" invalidates it immediately. Make sure dependent integrations have been replaced first.`,
    removeConfirm: zh ? '确认删除' : 'Delete Key',
    removeCancel: zh ? '取消' : 'Cancel',
  };

  const {
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
  } = useApiKeys();

  return (
    <div className={compactMode ? 'space-y-3' : 'space-y-4'}>
      <Card className="border-orange-200 bg-orange-50 p-4">
        <p className="text-sm font-medium text-orange-900">{copy.securityNotice}</p>
        <p className="mt-1 text-xs text-orange-700">{copy.securityDesc}</p>
        <p className="mt-1 text-xs text-orange-700">{copy.expiryHint}</p>
      </Card>

      {creating ? (
        <Card
          className={compactMode ? 'p-3' : 'p-4'}
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
        >
          <div className="space-y-3">
            <div>
              <Label style={{ color: theme.colors.text }}>{copy.keyName}</Label>
              <Input
                value={newKeyName}
                onChange={(event) => setNewKeyName(event.target.value)}
                placeholder={copy.keyNamePlaceholder}
                className="mt-2"
              />
              <p className="mt-2 text-xs" style={{ color: theme.colors.textSecondary }}>
                {copy.expiryHint}
              </p>
            </div>
            <div>
              <Label style={{ color: theme.colors.text }}>{copy.permissions}</Label>
              <Input
                value={newPermissions}
                onChange={(event) => setNewPermissions(event.target.value)}
                placeholder={copy.permissionsPlaceholder}
                className="mt-2"
              />
              <p className="mt-2 text-xs" style={{ color: theme.colors.textSecondary }}>
                {copy.permissionsHint}
              </p>
            </div>
            <div>
              <Label style={{ color: theme.colors.text }}>{copy.allowedIps}</Label>
              <Textarea
                value={newAllowedIps}
                onChange={(event) => setNewAllowedIps(event.target.value)}
                placeholder={copy.allowedIpsPlaceholder}
                className="mt-2 resize-none"
                rows={3}
              />
              <p className="mt-2 text-xs" style={{ color: theme.colors.textSecondary }}>
                {copy.allowlistHint}
              </p>
            </div>
            <div>
              <Label style={{ color: theme.colors.text }}>{copy.rateLimit}</Label>
              <Input
                type="number"
                min={1}
                value={newRateLimit}
                onChange={(event) => setNewRateLimit(event.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createKey} disabled={loading}>
                {copy.createKey}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setNewKeyName('');
                  setNewPermissions('read');
                  setNewAllowedIps('');
                  setNewRateLimit('60');
                  setCreating(false);
                }}
                disabled={loading}
              >
                {copy.cancel}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {copy.createNewKey}
          </Button>
          <Button variant="outline" onClick={loadApiKeys} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {copy.refresh}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {apiKeys.map((item) => {
          const visible = visibleKeys[item.id] ?? false;
          const permissions = item.permissions
            ? item.permissions.split(',').map((permission) => permission.trim())
            : [];
          const currentValue = item.keyValue || item.keyPreview;

          return (
            <Card
              key={item.id}
              className={compactMode ? 'p-3' : 'p-4'}
              style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2" style={{ backgroundColor: theme.colors.hover }}>
                    <KeyRound className="h-5 w-5" style={{ color: theme.colors.primary }} />
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: theme.colors.text }}>
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: theme.colors.textSecondary }}>
                      {copy.createdAt}: {item.createdAt}
                      {item.expiresAt ? ` · ${copy.expiresAt}: ${item.expiresAt}` : ''}
                      {` · ${copy.rateLimit}: ${item.rateLimit}`}
                      {item.lastUsed ? ` · ${copy.lastUsed}: ${item.lastUsed}` : ''}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: theme.colors.textSecondary }}>
                      {copy.allowedIps}: {item.allowedIps?.length ? item.allowedIps.join(', ') : copy.anyIp}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {permissions.map((permission) => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              <div
                className="flex items-center gap-2 rounded-lg p-3 font-mono text-sm"
                style={{ backgroundColor: theme.colors.hover }}
              >
                <span className="flex-1 break-all" style={{ color: theme.colors.text }}>
                  {visible ? currentValue : maskKey(currentValue)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => toggleVisible(item.id)}>
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => copyKey(item)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoveTarget(item)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}

        {apiKeys.length === 0 ? (
          <Card
            className="p-6 text-center text-sm"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.textSecondary,
            }}
          >
            {copy.noKeys}
          </Card>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
          }
        }}
        onConfirm={() => {
          if (!removeTarget) {
            return;
          }
          void removeKey(removeTarget.id).finally(() => setRemoveTarget(null));
        }}
        title={copy.removeTitle}
        description={removeTarget ? copy.removeDescription(removeTarget.name) : ' '}
        confirmText={copy.removeConfirm}
        cancelText={copy.removeCancel}
        variant="danger"
      />
    </div>
  );
}
