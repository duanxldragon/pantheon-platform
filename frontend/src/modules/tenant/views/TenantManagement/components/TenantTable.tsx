import {
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
import { ActionButtons } from '../../../../../shared/components/ui/ActionButtons';
import { Column, EnhancedDataTable } from '../../../../../shared/components/ui/EnhancedDataTable';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Tenant } from '../hooks/useTenantLogic';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="gap-1.5 border-emerald-100 bg-emerald-50 font-bold text-emerald-600">
            <Power className="h-3 w-3" />
            {zh ? '运行中' : 'Active'}
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="gap-1.5 border-rose-100 bg-rose-50 font-bold text-rose-600">
            <ShieldAlert className="h-3 w-3" />
            {zh ? '已停用' : 'Suspended'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="gap-1.5 border-amber-100 bg-amber-50 font-bold text-amber-600">
            <RefreshCcw className="h-3 w-3" />
            {zh ? '待初始化' : 'Pending'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      label: zh ? '租户名称' : 'Tenant Name',
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
          </div>
        </div>
      ),
    },
    {
      key: 'database',
      label: zh ? '数据库' : 'Database',
      width: '200px',
      render: (tenant) => {
        const iconUrl = getDbIcon(tenant.dbType);
        return (
          <div className="w-fit rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
            <div className="flex items-center gap-2.5">
              {iconUrl ? (
                <img src={iconUrl} alt={tenant.dbType} className="h-4 w-4 object-contain" />
              ) : (
                <Database className="h-4 w-4 text-slate-400" />
              )}
              <div className="flex flex-col">
                <span className="text-[11px] font-bold leading-none text-slate-700">
                  {tenant.dbType.toUpperCase()}
                </span>
                <span className="mt-1 text-[9px] font-mono text-slate-400">{tenant.dbName}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'users',
      label: zh ? '用户配额' : 'User Quota',
      width: '180px',
      render: (tenant) => {
        const usage = tenant.userLimit > 0 ? (tenant.userCount / tenant.userLimit) * 100 : 0;
        return (
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="uppercase tracking-tighter text-slate-400">
                {tenant.userCount}/{tenant.userLimit}
              </span>
              <span className={usage > 90 ? 'text-rose-500' : 'text-slate-600'}>{Math.round(usage)}%</span>
            </div>
            <Progress value={usage} className={`h-1.5 ${usage > 90 ? '[&>div]:bg-rose-500' : ''}`} />
          </div>
        );
      },
    },
    {
      key: 'expire',
      label: zh ? '服务有效期' : 'Expiry',
      width: '160px',
      render: (tenant) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {tenant.expireTime}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: zh ? '状态' : 'Status',
      width: '120px',
      align: 'center',
      render: (tenant) => getStatusBadge(tenant.status),
    },
    {
      key: 'actions',
      label: zh ? '操作' : 'Actions',
      width: '150px',
      align: 'right',
      render: (tenant) => (
        <div className="flex items-center justify-end gap-1">
          <ActionButtons
            actions={[
              {
                icon: <Edit className="h-4 w-4 text-amber-500" />,
                label: zh ? '编辑' : 'Edit',
                onClick: () => onAction('edit', tenant),
              },
              {
                icon: <Search className="h-4 w-4 text-blue-500" />,
                label: zh ? '概览' : 'Overview',
                onClick: () => onAction('view', tenant),
              },
            ]}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onAction('database', tenant)}>
                <Database className="mr-2 h-4 w-4 text-indigo-500" />
                {zh ? '数据库初始化' : 'Database Setup'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('license', tenant)}>
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                {zh ? '授权续期' : 'Renew License'}
              </DropdownMenuItem>
              {tenant.status === 'suspended' ? (
                <DropdownMenuItem onClick={() => onAction('activate', tenant)}>
                  <Power className="mr-2 h-4 w-4 text-emerald-500" />
                  {zh ? '恢复启用' : 'Activate'}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-rose-600" onClick={() => onAction('suspend', tenant)}>
                  <Power className="mr-2 h-4 w-4" />
                  {zh ? '停用租户' : 'Suspend'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-600" onClick={() => onAction('delete', tenant)}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                {zh ? '删除租户' : 'Delete Tenant'}
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
