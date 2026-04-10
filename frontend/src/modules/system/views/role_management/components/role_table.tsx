import React from 'react';

import { Edit, Eye, Lock, MoreHorizontal, Settings, Shield, Trash2, Users } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
import { Switch } from '../../../../../components/ui/switch';
import { ActionButtons } from '../../../../../shared/components/ui/action_buttons';
import { Column, EnhancedDataTable } from '../../../../../shared/components/ui/enhanced_data_table';
import { useLanguageStore } from '../../../../../stores/language_store';
import { useAuthStore } from '../../../../auth/store/auth_store';
import { systemPermissions } from '../../../constants/permissions';
import { Role } from '../../../types';
import { getRoleManagementCopy } from '../role_management_copy';

interface RoleTableProps {
  data: Role[];
  selectedItems: Role[];
  onSelectionChange: (items: Role[]) => void;
  onAction: (action: string, role: Role) => void;
  onStatusChange: (role: Role, enabled: boolean) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export const RoleTable: React.FC<RoleTableProps> = ({
  data,
  selectedItems,
  onSelectionChange,
  onAction,
  onStatusChange,
  pagination,
}) => {
  const { language } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const copy = getRoleManagementCopy(language).table;

  const columns: Column<Role>[] = [
    {
      key: 'name',
      label: copy.name,
      width: '240px',
      render: (role) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-br shadow-[0_18px_35px_-24px_rgba(15,23,42,0.5)] transition-all ${
              role.type === 'system' ? 'from-amber-400 to-amber-600' : 'from-blue-500 to-blue-600'
            }`}
          >
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="leading-tight font-bold text-slate-900">{role.name}</span>
              {role.type === 'system' ? <Lock className="h-3 w-3 text-amber-500" /> : null}
            </div>
            <span className="mt-0.5 font-mono text-[10px] text-slate-400">{role.code}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: copy.info,
      width: '120px',
      render: (role) =>
        role.type === 'system' ? (
          <Badge
            variant="secondary"
            className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700"
          >
            {copy.builtIn}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="rounded-full border border-blue-100 bg-blue-50/70 px-2.5 py-1 font-semibold text-blue-600"
          >
            {copy.custom}
          </Badge>
        ),
    },
    {
      key: 'stats',
      label: copy.stats,
      width: '180px',
      render: (role) => {
        const canQueryRole = hasPermission(systemPermissions.role.query);
        return (
          <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-1.5">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Settings className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-bold text-blue-600">{role.menuIds?.length || 0}</span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div
              className={`flex items-center gap-1 text-xs transition-colors ${
                canQueryRole ? 'cursor-pointer text-slate-500 hover:text-primary' : 'cursor-not-allowed text-slate-300'
              }`}
              onClick={() => {
                if (!canQueryRole) {
                  return;
                }
                onAction('members', role);
              }}
            >
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold text-slate-700">{role.userCount || 0}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: copy.status,
      width: '112px',
      align: 'center',
      render: (role) => {
        const canUpdateRole = hasPermission(systemPermissions.role.update);
        return (
          <Switch
            checked={role.status === 'active'}
            onCheckedChange={(checked) => onStatusChange(role, checked)}
            className="scale-90 data-[state=checked]:bg-green-500"
            disabled={!canUpdateRole || (role.type === 'system' && role.code === 'super_admin')}
          />
        );
      },
    },
    {
      key: 'description',
      label: copy.description,
      width: '220px',
      render: (role) => (
        <span className="line-clamp-2 max-w-[200px] text-xs leading-6 text-slate-500">
          {role.description || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: copy.actions,
      width: '220px',
      align: 'right',
      render: (role) => {
        const canQueryRole = hasPermission(systemPermissions.role.query);
        const canDeleteRole = hasPermission(systemPermissions.role.delete);
        const hasMoreActions = canQueryRole || canDeleteRole;

        return (
          <div className="flex items-center justify-end gap-2">
            <ActionButtons
              actions={[
                {
                  icon: <Settings className="h-4 w-4 text-primary" />,
                  label: copy.configurePermissions,
                  onClick: () => onAction('permission', role),
                  permission: systemPermissions.role.assignPermission,
                },
                {
                  icon: <Edit className="h-4 w-4 text-amber-500" />,
                  label: copy.edit,
                  onClick: () => onAction('edit', role),
                  permission: systemPermissions.role.update,
                },
              ]}
            />
            {hasMoreActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-2xl border border-slate-200/70 bg-white/90 text-slate-400 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-700"
                  >
                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 rounded-2xl border-slate-200/80 bg-white/98 shadow-xl shadow-slate-200/70"
                >
                  {canQueryRole ? (
                    <DropdownMenuItem onClick={() => onAction('detail', role)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-500" />
                      {copy.viewDetails}
                    </DropdownMenuItem>
                  ) : null}
                  {canQueryRole ? (
                    <DropdownMenuItem onClick={() => onAction('members', role)}>
                      <Users className="mr-2 h-4 w-4 text-emerald-500" />
                      {copy.members}
                    </DropdownMenuItem>
                  ) : null}
                  {canQueryRole && canDeleteRole ? <DropdownMenuSeparator /> : null}
                  {canDeleteRole ? (
                    <DropdownMenuItem
                      className="text-rose-600 focus:text-rose-700"
                      onClick={() => onAction('delete', role)}
                      disabled={role.type === 'system'}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {copy.delete}
                      {role.type === 'system' ? <Lock className="ml-auto h-3 w-3 opacity-50" /> : null}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      rowKey={(role) => role.id}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      pagination={pagination}
      className="border-none shadow-none"
    />
  );
};








