import {
  AlertTriangle,
  Building2,
  Calendar,
  Database,
  Edit,
  MoreHorizontal,
  Power,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
import { Progress } from '../../../../../components/ui/progress';
import { ActionButtons } from '../../../../../shared/components/ui/action_buttons';
import { Column, EnhancedDataTable } from '../../../../../shared/components/ui/enhanced_data_table';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { Tenant } from '../hooks/use_tenant_logic';

interface TenantTableProps {
  data: Tenant[];
  onAction: (action: string, tenant: Tenant) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

function getDbIcon(type: string) {
  const icons: Record<string, string> = {
    mysql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    postgres: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    sqlite: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg',
    mssql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg',
  };
  return icons[type] || '';
}

export function TenantTable({ data, onAction, pagination }: TenantTableProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';

  const copy = zh
    ? {
        statuses: {
          active: '运行中',
          suspended: '已停用',
          pending: '待初始化',
        },
        columns: {
          tenantName: '租户名称',
          database: '数据库',
          userQuota: '用户配额',
          expiry: '服务有效期',
          status: '状态',
          actions: '操作',
        },
        actions: {
          edit: '编辑',
          overview: '概览',
          databaseSetup: '数据库初始化',
          renewLicense: '授权续期',
          activate: '恢复启用',
          suspend: '停用租户',
          delete: '删除租户',
        },
      }
    : {
        statuses: {
          active: 'Active',
          suspended: 'Suspended',
          pending: 'Pending',
        },
        columns: {
          tenantName: 'Tenant Name',
          database: 'Database',
          userQuota: 'User Quota',
          expiry: 'Expiry',
          status: 'Status',
          actions: 'Actions',
        },
        actions: {
          edit: 'Edit',
          overview: 'Overview',
          databaseSetup: 'Database Setup',
          renewLicense: 'Renew License',
          activate: 'Activate',
          suspend: 'Suspend',
          delete: 'Delete Tenant',
        },
      };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" className="gap-1.5">
            <Power className="h-3 w-3" />
            {copy.statuses.active}
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="warning" className="gap-1.5">
            <ShieldAlert className="h-3 w-3" />
            {copy.statuses.suspended}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="mono" className="gap-1.5">
            <RefreshCcw className="h-3 w-3" />
            {copy.statuses.pending}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUsageState = (usage: number) => {
    if (usage >= 90) {
      return zh
        ? { label: '高压', hint: '接近上限', variant: 'warning' as const, textClass: 'text-rose-600' }
        : { label: 'High', hint: 'Near limit', variant: 'warning' as const, textClass: 'text-rose-600' };
    }
    if (usage >= 60) {
      return zh
        ? { label: '关注', hint: '逐步逼近', variant: 'info' as const, textClass: 'text-amber-600' }
        : { label: 'Watch', hint: 'Approaching', variant: 'info' as const, textClass: 'text-amber-600' };
    }
    return zh
      ? { label: '稳定', hint: '容量充足', variant: 'success' as const, textClass: 'text-emerald-600' }
      : { label: 'Stable', hint: 'Healthy headroom', variant: 'success' as const, textClass: 'text-emerald-600' };
  };

  const getExpiryState = (expireTime: string) => {
    const expireDate = new Date(expireTime);
    if (Number.isNaN(expireDate.getTime())) {
      return null;
    }
    const diffDays = Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      return zh
        ? { label: '临近到期', hint: `${Math.max(diffDays, 0)} 天内`, variant: 'warning' as const }
        : { label: 'Near Expiry', hint: `Within ${Math.max(diffDays, 0)} days`, variant: 'warning' as const };
    }
    return zh
      ? { label: '有效中', hint: `剩余 ${diffDays} 天`, variant: 'success' as const }
      : { label: 'Active', hint: `${diffDays} days left`, variant: 'success' as const };
  };

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      label: copy.columns.tenantName,
      width: '280px',
      render: (tenant) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-200">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight font-bold text-slate-900">{tenant.name}</span>
            <span className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {tenant.code}
            </span>
            <span className="mt-1 text-[11px] text-slate-500">
              {tenant.contactPerson || (zh ? '未设置联系人' : 'No contact')}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'database',
      label: copy.columns.database,
      width: '200px',
      render: (tenant) => {
        const iconUrl = getDbIcon(tenant.dbType);
        const dbState = tenant.status === 'pending'
          ? (zh ? '待初始化' : 'Pending Setup')
          : (zh ? '已接入' : 'Connected');
        return (
          <div className="w-fit min-w-[190px] rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-start gap-2.5">
              {iconUrl ? (
                <img src={iconUrl} alt={tenant.dbType} className="h-4 w-4 object-contain" />
              ) : (
                <Database className="h-4 w-4 text-slate-400" />
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold leading-none text-slate-700">
                    {tenant.dbType.toUpperCase()}
                  </span>
                  <Badge variant={tenant.status === 'pending' ? 'warning' : 'info'}>{dbState}</Badge>
                </div>
                <span className="mt-1 text-[9px] font-mono text-slate-400">{tenant.dbName}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'users',
      label: copy.columns.userQuota,
      width: '180px',
      render: (tenant) => {
        const usage = tenant.userLimit > 0 ? (tenant.userCount / tenant.userLimit) * 100 : 0;
        const usageState = getUsageState(usage);
        return (
          <div className="space-y-2 pr-4">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="uppercase tracking-tighter text-slate-400">
                {tenant.userCount}/{tenant.userLimit}
              </span>
              <span className={usageState.textClass}>{Math.round(usage)}%</span>
            </div>
            <Progress value={usage} className={`h-1.5 ${usage > 90 ? '[&>div]:bg-rose-500' : ''}`} />
            <div className="flex items-center justify-between">
              <Badge variant={usageState.variant}>{usageState.label}</Badge>
              <span className="text-[10px] text-slate-500">{usageState.hint}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'expire',
      label: copy.columns.expiry,
      width: '160px',
      render: (tenant) => {
        const expiryState = getExpiryState(tenant.expireTime);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {tenant.expireTime}
            </div>
            {expiryState ? (
              <div className="flex items-center gap-2">
                <Badge variant={expiryState.variant}>{expiryState.label}</Badge>
                <span className="text-[10px] text-slate-500">{expiryState.hint}</span>
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: copy.columns.status,
      width: '160px',
      align: 'center',
      render: (tenant) => {
        const needsAttention = tenant.status !== 'active' || (tenant.userLimit > 0 && tenant.userCount / tenant.userLimit >= 0.9);
        return (
          <div className="flex flex-col items-center gap-2">
            {getStatusBadge(tenant.status)}
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              {needsAttention ? <AlertTriangle className="h-3 w-3 text-amber-500" /> : null}
              <span>
                {needsAttention
                  ? zh ? '需要关注' : 'Needs attention'
                  : zh ? '运行稳定' : 'Stable'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: copy.columns.actions,
      width: '150px',
      align: 'right',
      render: (tenant) => (
        <div className="flex items-center justify-end gap-1">
          <ActionButtons
            actions={[
              {
                icon: <Edit className="h-4 w-4" />,
                label: copy.actions.edit,
                onClick: () => onAction('edit', tenant),
                variant: 'mono',
              },
              {
                icon: <Search className="h-4 w-4" />,
                label: copy.actions.overview,
                onClick: () => onAction('view', tenant),
                variant: 'mono',
              },
            ]}
            surface="ghost"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="mono" size="icon-sm" className="rounded-xl">
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <DropdownMenuItem onClick={() => onAction('database', tenant)}>
                <Database className="mr-2 h-4 w-4 text-indigo-500" />
                {copy.actions.databaseSetup}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('license', tenant)}>
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                {copy.actions.renewLicense}
              </DropdownMenuItem>
              {tenant.status === 'suspended' ? (
                <DropdownMenuItem onClick={() => onAction('activate', tenant)}>
                  <Power className="mr-2 h-4 w-4 text-emerald-500" />
                  {copy.actions.activate}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-rose-600" onClick={() => onAction('suspend', tenant)}>
                  <Power className="mr-2 h-4 w-4" />
                  {copy.actions.suspend}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-600" onClick={() => onAction('delete', tenant)}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                {copy.actions.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      rowKey={(tenant) => tenant.id}
      pagination={pagination}
      className="border-none shadow-none"
    />
  );
}








