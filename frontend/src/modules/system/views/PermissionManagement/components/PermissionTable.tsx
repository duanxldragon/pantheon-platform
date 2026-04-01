import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Switch } from '../../../../../components/ui/switch';
import { Shield, Edit, Trash2, Lock, Folder, Activity, Database, Layout, Clock } from 'lucide-react';
import { EnhancedDataTable, type Column } from '../../../../../shared/components/ui/EnhancedDataTable';
import { ActionButtons } from '../../../../../shared/components/ui/ActionButtons';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useAuthStore } from '../../../../auth/store/authStore';
import { systemPermissions } from '../../../constants/permissions';
import type { Permission } from '../../../types';
import { getPermissionModuleLabel } from '../moduleLocalization';

interface PermissionTableProps {
  data: Permission[];
  selectedItems: Permission[];
  onSelectionChange: (items: Permission[]) => void;
  onAction: (action: string, permission: Permission) => void;
  onStatusChange: (permission: Permission, enabled: boolean) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export const PermissionTable: React.FC<PermissionTableProps> = ({
  data,
  selectedItems,
  onSelectionChange,
  onAction,
  onStatusChange,
  pagination,
}) => {
  const { t, language } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'menu':
        return {
          label: t.systemManagement.permissionManagement.menu,
          color: 'bg-blue-50 text-blue-600 border-blue-100',
          icon: Layout,
        };
      case 'operation':
        return {
          label: t.systemManagement.permissionManagement.operation,
          color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          icon: Activity,
        };
      case 'data':
        return {
          label: t.systemManagement.permissionManagement.data,
          color: 'bg-purple-50 text-purple-600 border-purple-100',
          icon: Database,
        };
      default:
        return { label: type, color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Shield };
    }
  };

  const columns: Column<Permission>[] = [
    {
      key: 'code',
      label: t.systemManagement.permissionManagement.code,
      width: '240px',
      render: (permission) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.85)] transition-transform duration-200 group-hover:scale-105">
            <Lock className="h-3.5 w-3.5 text-emerald-300" />
          </div>
          <code
            className="inline-flex min-h-9 items-center rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-1 font-mono text-[11px] font-semibold text-slate-700 transition-colors select-all cursor-pointer hover:border-slate-300 hover:bg-white"
            title={t.systemManagement.permissionManagement.clickToCopy}
          >
            {permission.code}
          </code>
        </div>
      ),
    },
    {
      key: 'name',
      label: t.systemManagement.permissionManagement.name,
      width: '180px',
      render: (permission) => <span className="font-bold text-slate-900">{permission.name}</span>,
    },
    {
      key: 'type',
      label: t.systemManagement.permissionManagement.type,
      width: '100px',
      render: (permission) => {
        const info = getTypeInfo(permission.type);
        return (
          <Badge
            variant="outline"
            className={`gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${info.color}`}
          >
            <info.icon className="w-2.5 h-2.5" />
            {info.label}
          </Badge>
        );
      },
    },
    {
      key: 'module',
      label: t.systemManagement.permissionManagement.module,
      width: '140px',
      render: (permission) => (
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-1.5 text-sm font-medium text-slate-600">
          <Folder className="h-3.5 w-3.5 text-amber-500" />
          <span className="truncate">{getPermissionModuleLabel(permission.module, language)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t.user.status,
      width: '112px',
      align: 'center',
      render: (permission) => (
        <Switch
          checked={permission.status === 'active'}
          onCheckedChange={(checked) => onStatusChange(permission, checked)}
          className="data-[state=checked]:bg-green-500 scale-90"
          disabled={!hasPermission(systemPermissions.permission.update)}
        />
      ),
    },
    {
      key: 'description',
      label: t.systemManagement.permissionManagement.description,
      width: '220px',
      render: (permission) => (
        <span className="line-clamp-2 text-xs leading-6 text-slate-500">{permission.description || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      label: t.common.createdAt,
      width: '160px',
      render: (permission) => (
        <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-1.5 font-mono text-[11px] text-slate-500">
          <Clock className="h-3 w-3 opacity-60" />
          {permission.createdAt}
        </div>
      ),
    },
    {
      key: 'actions',
      label: t.common.actions,
      width: '168px',
      align: 'right',
      render: (permission) => (
        <ActionButtons
          actions={[
            {
              icon: <Edit className="w-4 h-4 text-amber-500" />,
              label: t.common.edit,
              onClick: () => onAction('edit', permission),
              permission: systemPermissions.permission.update,
            },
            {
              icon: <Trash2 className="w-4 h-4 text-rose-500" />,
              label: t.common.delete,
              onClick: () => onAction('delete', permission),
              permission: systemPermissions.permission.delete,
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      rowKey={(p) => p.id}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      pagination={pagination}
      className="border-none shadow-none"
    />
  );
};
