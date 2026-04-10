import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Building2, ChevronDown, Database, Loader2, RefreshCw } from 'lucide-react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuthStore } from '../modules/auth/store/auth_store';
import type { TenantSetupStatus } from '../modules/tenant/types';
import { systemNotification } from '../shared/utils/notification';
import { useLanguageStore } from '../stores/language_store';

interface TenantSwitcherProps {
  className?: string;
}

const copy = {
  zh: {
    currentTenant: '当前租户',
    viewStatus: '查看租户状态',
    noTenant: '未绑定租户',
    refresh: '刷新',
    loading: '正在加载租户状态...',
    code: '租户编码',
    databaseType: '数据库类型',
    createdAt: '创建时间',
    tenantStatus: '租户状态',
    databaseStatus: '数据库状态',
    configured: '已配置',
    notConfigured: '未配置',
    firstLogin: '首次登录',
    ready: '已就绪',
    active: '正常',
    pending: '初始化中',
    suspended: '已停用',
    expired: '已过期',
    unknown: '未知',
    setupHintTitle: '租户初始化尚未完成',
    setupHintDescription: '当前租户数据库尚未初始化，登录后会自动进入租户初始化向导。',
    readyHintTitle: '租户环境已就绪',
    readyHintDescription: '当前账号绑定单一租户，当前部署模式暂不支持跨租户切换。',
    refreshFailed: '刷新租户状态失败',
  },
  en: {
    currentTenant: 'Current Tenant',
    viewStatus: 'View Tenant Status',
    noTenant: 'No Tenant',
    refresh: 'Refresh',
    loading: 'Loading tenant status...',
    code: 'Tenant Code',
    databaseType: 'Database Type',
    createdAt: 'Created At',
    tenantStatus: 'Tenant Status',
    databaseStatus: 'Database Status',
    configured: 'Configured',
    notConfigured: 'Not Configured',
    firstLogin: 'First Login',
    ready: 'Ready',
    active: 'Active',
    pending: 'Pending',
    suspended: 'Suspended',
    expired: 'Expired',
    unknown: 'Unknown',
    setupHintTitle: 'Tenant setup is incomplete',
    setupHintDescription: 'The tenant database is not initialized yet. The setup wizard will open after login.',
    readyHintTitle: 'Tenant environment is ready',
    readyHintDescription: 'This account is bound to a single tenant. Cross-tenant switching is not enabled.',
    refreshFailed: 'Failed to refresh tenant status',
  },
} as const;

function formatDate(value?: string, language?: 'zh' | 'en') {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(language === 'en' ? 'en-US' : 'zh-CN');
}

function getStatusVariant(status?: string) {
  switch (status) {
    case 'active':
      return 'default' as const;
    case 'pending':
      return 'secondary' as const;
    case 'suspended':
    case 'expired':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

export function TenantSwitcher({ className }: TenantSwitcherProps) {
  const language = useLanguageStore((state) => state.language);
  const text = copy[language];
  const {
    user,
    tenantInfo,
    isAuthenticated,
    tenantSetupRequired,
    isFirstLogin,
    refreshTenantContext,
  } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<TenantSetupStatus | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!user?.tenantCode) {
      return;
    }

    setIsLoading(true);
    try {
      const nextStatus = await refreshTenantContext();
      setStatus(nextStatus);
    } catch (error) {
      console.error('Failed to refresh tenant status:', error);
      systemNotification.error(text.refreshFailed);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTenantContext, text.refreshFailed, user?.tenantCode]);

  useEffect(() => {
    if (!isOpen || !user?.tenantCode) {
      return;
    }

    void refreshStatus();
  }, [isOpen, refreshStatus, user?.tenantCode]);

  if (!isAuthenticated || !user?.tenantCode) {
    return null;
  }

  const tenantName = tenantInfo?.name || status?.tenantName || user.tenantCode || text.noTenant;
  const tenantCode = tenantInfo?.code || status?.tenantCode || user.tenantCode;
  const tenantStatus = tenantInfo?.status || status?.status;
  const databaseReady = tenantInfo?.databaseConfigured ?? status?.databaseConfigured ?? false;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={`gap-2 ${className || ''}`}>
            <Building2 className="h-4 w-4" />
            <span className="max-w-32 truncate">{tenantName}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onClick={() => setIsOpen(true)}>
            <Building2 className="mr-2 h-4 w-4" />
            {text.viewStatus}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {text.currentTenant}: {tenantName}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {text.currentTenant}
          </DialogTitle>
          <DialogDescription>{tenantCode}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <div className="text-sm text-muted-foreground">{text.currentTenant}</div>
              <div className="text-base font-medium">{tenantName}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refreshStatus()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {text.refresh}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center rounded-lg border py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {text.loading}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border px-4 py-3">
                <div className="text-sm text-muted-foreground">{text.code}</div>
                <div className="mt-1 font-medium">{tenantCode || '-'}</div>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="text-sm text-muted-foreground">{text.databaseType}</div>
                <div className="mt-1 flex items-center gap-2 font-medium">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  {tenantInfo?.databaseType || '-'}
                </div>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="text-sm text-muted-foreground">{text.tenantStatus}</div>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(tenantStatus)}>
                    {tenantStatus === 'active' && text.active}
                    {tenantStatus === 'pending' && text.pending}
                    {tenantStatus === 'suspended' && text.suspended}
                    {tenantStatus === 'expired' && text.expired}
                    {!tenantStatus && text.unknown}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="text-sm text-muted-foreground">{text.databaseStatus}</div>
                <div className="mt-1">
                  <Badge variant={databaseReady ? 'default' : 'secondary'}>
                    {databaseReady ? text.configured : text.notConfigured}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="text-sm text-muted-foreground">{text.createdAt}</div>
                <div className="mt-1 font-medium">{formatDate(tenantInfo?.createdAt, language)}</div>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="text-sm text-muted-foreground">{text.firstLogin}</div>
                <div className="mt-1">
                  <Badge variant={isFirstLogin ? 'secondary' : 'default'}>
                    {isFirstLogin ? text.firstLogin : text.ready}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div
            className={`rounded-lg border px-4 py-3 ${
              tenantSetupRequired ? 'border-amber-200 bg-amber-50' : 'bg-muted/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className={`mt-0.5 h-4 w-4 ${
                  tenantSetupRequired ? 'text-amber-600' : 'text-muted-foreground'
                }`}
              />
              <div>
                <div className="font-medium">
                  {tenantSetupRequired ? text.setupHintTitle : text.readyHintTitle}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {tenantSetupRequired ? text.setupHintDescription : text.readyHintDescription}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}




