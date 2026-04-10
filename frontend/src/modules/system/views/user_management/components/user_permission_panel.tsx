import { useEffect, useMemo, useState } from 'react';

import { Copy, Search, ShieldCheck, ShieldX } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { useLanguageStore } from '../../../../../stores/language_store';
import { api } from '../../../api';
import type { User } from '../../../types';
import { getUserManagementCopy } from '../user_management_copy';

interface UserPermissionPanelProps {
  user: User;
}

export function UserPermissionPanel({ user }: UserPermissionPanelProps) {
  const { language } = useLanguageStore();
  const copy = getUserManagementCopy(language).permissionsPanel;
  const fieldClassName =
    'h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

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
        toast.error(copy.loadPermissionsFailed);
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
  }, [copy.loadPermissionsFailed, user.id, user.roleIds, user.status]);

  useEffect(() => {
    setVerifyResult(null);
  }, [permissions, user.id]);

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
          <div className="text-base font-semibold text-slate-900">{copy.title}</div>
          <div className="text-xs leading-5 text-slate-500">{copy.description}</div>
        </div>
        <Badge variant="info">
          {copy.total}: {permissions.length}
        </Badge>
      </div>

      <Card className="space-y-3 rounded-[24px] border-slate-200/70 bg-white/88 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className={`${fieldClassName} pl-10`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="mono">{user.username}</Badge>
          {searchQuery.trim() ? (
            <Badge variant="warning">
              {language === 'zh' ? `命中 ${filteredPermissions.length} 项` : `${filteredPermissions.length} matches`}
            </Badge>
          ) : (
            <Badge variant="success">
              {language === 'zh' ? '权限全集' : 'Full scope'}
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[320px] pr-3">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">{copy.loading}</div>
          ) : filteredPermissions.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">{copy.noData}</div>
          ) : (
            <div className="space-y-2">
              {filteredPermissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200/70 bg-white/92 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                >
                  <code className="break-all rounded-2xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 text-xs text-slate-800">
                    {permission}
                  </code>
                  <Button
                    variant="mono"
                    size="icon-sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(permission);
                      toast.success(copy.permissionCodeCopied);
                    }}
                    aria-label={copy.copyButton}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      <Card className="space-y-3 rounded-[24px] border-slate-200/70 bg-white/88 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] backdrop-blur-sm">
        <div className="font-medium text-slate-900">{copy.verifyTitle}</div>
        <div className="text-xs text-slate-500">{copy.verifyHint}</div>
        <div className="flex items-center gap-2">
          <Input
            value={verifyValue}
            onChange={(event) => setVerifyValue(event.target.value)}
            placeholder={copy.verifyPlaceholder}
            className={fieldClassName}
          />
          <Button
            size="pill"
            onClick={handleVerify}
            className="shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {copy.verifyButton}
          </Button>
        </div>

        {verifyResult !== null ? (
          <div
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${
              verifyResult
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {verifyResult ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
            {verifyResult ? copy.verifyHas : copy.verifyNot}
          </div>
        ) : null}
      </Card>
    </div>
  );
}




