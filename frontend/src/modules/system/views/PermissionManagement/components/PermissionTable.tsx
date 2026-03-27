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
  const { t } = useLanguageStore();
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
          <div className="p-2 bg-slate-900 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <code
            className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 select-all cursor-pointer hover:bg-white transition-colors"
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
          <Badge variant="outline" className={`font-medium gap-1 px-2 py-0 ${info.color}`}>
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
        <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
          <Folder className="w-3.5 h-3.5 text-amber-400" />
          {permission.module}
        </div>
      ),
    },
    {
      key: 'status',
      label: t.user.status,
      width: '90px',
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
        <span className="text-xs text-slate-400 italic line-clamp-1">{permission.description || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      label: t.common.createdAt,
      width: '160px',
      render: (permission) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Clock className="w-3 h-3 opacity-50" />
          {permission.createdAt}
        </div>
      ),
    },
    {
      key: 'actions',
      label: t.common.actions,
      width: '120px',
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
