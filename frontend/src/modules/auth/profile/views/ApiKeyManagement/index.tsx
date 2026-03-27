import { Copy, Eye, EyeOff, KeyRound, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useThemeStore } from '../../../../../stores/themeStore';
import { useProfilePreferenceSettings } from '../../hooks/useProfilePreferenceSettings';
import { useApiKeys } from '../../../hooks';

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

  const {
    creating,
    setCreating,
    loading,
    newKeyName,
    setNewKeyName,
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
        <p className="text-sm font-medium text-orange-900">{zh ? '安全提示' : 'Security Notice'}</p>
        <p className="mt-1 text-xs text-orange-700">
          {zh
            ? 'API 密钥仅在创建时展示完整内容，请立即复制并妥善保存；如怀疑泄露，请及时删除并重新生成。'
            : 'A full API key is only shown once when created. Copy and store it securely.'}
        </p>
      </Card>

      {creating ? (
        <Card
          className={compactMode ? 'p-3' : 'p-4'}
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
        >
          <div className="space-y-3">
            <div>
              <Label style={{ color: theme.colors.text }}>{zh ? '密钥名称' : 'Key Name'}</Label>
              <Input
                value={newKeyName}
                onChange={(event) => setNewKeyName(event.target.value)}
                placeholder={zh ? '例如：生产环境只读密钥' : 'For example: production read-only key'}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createKey} disabled={loading}>
                {zh ? '创建密钥' : 'Create Key'}
              </Button>
              <Button variant="outline" onClick={() => setCreating(false)} disabled={loading}>
                {zh ? '取消' : 'Cancel'}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {zh ? '创建新密钥' : 'Create New Key'}
          </Button>
          <Button variant="outline" onClick={loadApiKeys} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {zh ? '刷新' : 'Refresh'}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {apiKeys.map((item) => {
          const visible = visibleKeys[item.id] ?? false;
          const permissions = item.permissions
            ? item.permissions.split(',').map((permission) => permission.trim())
            : [];
          const currentValue = item.keyValue || item.key_preview;

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
                      {zh ? '创建时间' : 'Created'}: {item.created_at}
                      {item.last_used ? ` · ${zh ? '最近使用' : 'Last used'}: ${item.last_used}` : ''}
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
                  onClick={() => removeKey(item.id)}
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
            {zh ? '暂无 API 密钥' : 'No API keys yet'}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
