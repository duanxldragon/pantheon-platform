import { useEffect, useMemo, useState } from 'react';

import { Search, ShieldCheck, ShieldX } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { api } from '../../../api';
import type { User } from '../../../types';

interface UserPermissionPanelProps {
  user: User;
}

export function UserPermissionPanel({ user }: UserPermissionPanelProps) {
  const { t, language } = useLanguageStore();
  const i18n = t.systemManagement.users.permissionsPanel;
  const zh = language === 'zh';
  const loadPermissionsFailedMessage = zh ? '加载用户权限失败，请重试' : 'Failed to load user permissions';
  const permissionCodeCopiedMessage = zh ? '权限标识已复制' : 'Permission code copied';

  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyValue, setVerifyValue] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPermissions = async () => {
      setLoading(true);
      try {
        const permissionList = await api.getUserPermissions(String(user.id));
        if (!cancelled) {
          setPermissions(permissionList);
        }
      } catch {
        toast.error(loadPermissionsFailedMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPermissions();

    return () => {
      cancelled = true;
    };
  }, [user.id, zh]);

  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) {
      return permissions;
    }

    const keyword = searchQuery.trim().toLowerCase();
    return permissions.filter((permission) => permission.toLowerCase().includes(keyword));
  }, [permissions, searchQuery]);

  const handleVerify = () => {
    const value = verifyValue.trim();
    if (!value) {
      setVerifyResult(null);
      return;
    }
    setVerifyResult(permissions.includes(value));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900">{i18n.title}</div>
          <div className="text-xs text-gray-500">{i18n.description}</div>
        </div>
        <Badge variant="outline">
          {i18n.total}: {permissions.length}
        </Badge>
      </div>

      <Card className="space-y-3 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={i18n.searchPlaceholder}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[320px] pr-3">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">{t.common.loading}</div>
          ) : filteredPermissions.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">{t.common.noData}</div>
          ) : (
            <div className="space-y-2">
              {filteredPermissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center justify-between gap-3 rounded-md border bg-white p-2"
                >
                  <code className="break-all text-xs text-slate-800">{permission}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(permission);
                      toast.success(permissionCodeCopiedMessage);
                    }}
                  >
                    {t.common.copy}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      <Card className="space-y-2 p-4">
        <div className="font-medium text-gray-900">{i18n.verifyTitle}</div>
        <div className="text-xs text-gray-500">{i18n.verifyHint}</div>
        <div className="flex items-center gap-2">
          <Input
            value={verifyValue}
            onChange={(event) => setVerifyValue(event.target.value)}
            placeholder={i18n.verifyPlaceholder}
          />
          <Button onClick={handleVerify}>{i18n.verifyButton}</Button>
        </div>

        {verifyResult !== null && (
          <div
            className={`flex items-center gap-2 text-sm ${
              verifyResult ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {verifyResult ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
            {verifyResult ? i18n.verifyHas : i18n.verifyNot}
          </div>
        )}
      </Card>
    </div>
  );
}
