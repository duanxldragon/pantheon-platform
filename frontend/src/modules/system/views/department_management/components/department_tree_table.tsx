import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Switch } from '../../../../../components/ui/switch';
import {
  Building2,
  ChevronRight,
  ChevronDown,
  User,
  Phone,
  Mail,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  EnhancedDataTable,
  Column,
} from '../../../../../shared/components/ui/enhanced_data_table';
import { ActionButtons } from '../../../../../shared/components/ui/action_buttons';
import { useLanguageStore } from '../../../../../stores/language_store';
import { useAuthStore } from '../../../../auth/store/auth_store';
import { systemPermissions } from '../../../constants/permissions';
import { DepartmentNode } from '../hooks/use_department_tree';
import { getDepartmentManagementCopy } from '../department_management_copy';

interface DepartmentTreeTableProps {
  data: DepartmentNode[];
  expandedKeys: Set<string>;
  onToggleExpand: (id: string) => void;
  onAction: (action: string, dept: DepartmentNode) => void;
  onStatusChange: (dept: DepartmentNode, enabled: boolean) => void;
  selectedItems: DepartmentNode[];
  onSelectionChange: (items: DepartmentNode[]) => void;
}

export const DepartmentTreeTable: React.FC<DepartmentTreeTableProps> = ({
  data,
  expandedKeys,
  onToggleExpand,
  onAction,
  onStatusChange,
  selectedItems,
  onSelectionChange,
}) => {
  const { language } = useLanguageStore();
  const pageCopy = getDepartmentManagementCopy(language);
  const copy = pageCopy.table;
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const columns: Column<DepartmentNode>[] = [
    {
      key: 'name',
      label: copy.name,
      width: '350px',
      render: (node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedKeys.has(node.id);

        return (
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${node.level * 24}px` }}
          >
            <div className="flex min-w-[32px] items-center gap-1.5">
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(node.id);
                  }}
                  className="rounded-xl border border-transparent p-1.5 text-slate-400 transition-all hover:border-slate-200/80 hover:bg-white hover:text-slate-700 hover:shadow-sm"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 shadow-sm shadow-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate font-semibold text-slate-900">{node.name}</span>
              <span className="font-mono text-[10px] tracking-wider text-slate-400">
                {node.code}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'leader',
      label: copy.leader,
      width: '150px',
      render: (node) =>
        node.leader ? (
          <div className="flex w-fit items-center gap-2 rounded-full border border-blue-100/80 bg-blue-50/80 px-2.5 py-1 shadow-sm shadow-blue-100/40">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-medium text-blue-700">{node.leader}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">{copy.noLeader}</span>
        ),
    },
    {
      key: 'contact',
      label: copy.contact,
      width: '200px',
      render: (node) => (
        <div className="flex flex-col gap-0.5">
          {node.phone && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="h-3 w-3 opacity-60" />
              {node.phone}
            </div>
          )}
          {node.email && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Mail className="h-3 w-3 opacity-60" />
              {node.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'members',
      label: copy.members,
      width: '100px',
      align: 'center',
      render: (node) => (
        <Badge variant="outline" className="gap-1 rounded-full border border-slate-200/80 bg-slate-50/90 px-2.5 py-1 font-normal text-slate-600 shadow-sm shadow-slate-200/40">
          <Users className="h-3 w-3 opacity-60" />
          {node.userCount || 0}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: copy.status,
      width: '112px',
      align: 'center',
      render: (node) => (
        <Switch
          checked={node.status === 'active'}
          onCheckedChange={(checked) => onStatusChange(node, checked)}
          className="scale-90 data-[state=checked]:bg-green-500"
          disabled={!hasPermission(systemPermissions.department.update)}
        />
      ),
    },
    {
      key: 'actions',
      label: copy.actions,
      width: '220px',
      align: 'right',
      render: (node) => (
        <ActionButtons
          actions={[
            {
              icon: <Plus className="h-4 w-4 text-green-500" />,
              label: copy.addSubDepartment,
              onClick: () => onAction('add-sub', node),
              permission: systemPermissions.department.create,
              className: 'hover:bg-green-50',
            },
            {
              icon: <Eye className="h-4 w-4 text-blue-500" />,
              label: copy.memberDetails,
              onClick: () => onAction('members', node),
              permission: systemPermissions.department.query,
            },
            {
              icon: <Edit className="h-4 w-4 text-amber-500" />,
              label: pageCopy.actionLabels.edit,
              onClick: () => onAction('edit', node),
              permission: systemPermissions.department.update,
            },
            {
              icon: <Trash2 className="h-4 w-4 text-red-500" />,
              label: pageCopy.actionLabels.delete,
              onClick: () => onAction('delete', node),
              permission: systemPermissions.department.delete,
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
      rowKey={(node) => node.id}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      className="border-none shadow-none"
    />
  );
};








