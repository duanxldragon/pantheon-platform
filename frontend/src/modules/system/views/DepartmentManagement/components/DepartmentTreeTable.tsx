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
  Eye 
} from 'lucide-react';
import { 
  EnhancedDataTable, 
  Column 
} from '../../../../../shared/components/ui/EnhancedDataTable';
import { ActionButtons } from '../../../../../shared/components/ui/ActionButtons';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useAuthStore } from '../../../../auth/store/authStore';
import { systemPermissions } from '../../../constants/permissions';
import { DepartmentNode } from '../hooks/useDepartmentTree';

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
  onSelectionChange
}) => {
  const { t } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const columns: Column<DepartmentNode>[] = [
    {
      key: 'name',
      label: t.user.department,
      width: '350px',
      render: (node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedKeys.has(node.id);

        return (
          <div 
            className="flex items-center gap-2"
            style={{ paddingLeft: `${node.level * 24}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-[32px]">
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(node.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              ) : (
                <div className="w-6" /> // Placeholder
              )}
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-gray-900 truncate">
                {node.name}
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-wider">
                {node.code}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'leader',
      label: t.user.realName,
      width: '150px',
      render: (node) => (
        node.leader ? (
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-50/50 rounded-full w-fit border border-blue-100/50">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-medium text-blue-700">{node.leader}</span>
          </div>
        ) : (
          <span className="text-gray-300 text-xs">-</span>
        )
      ),
    },
    {
      key: 'contact',
      label: t.common.info,
      width: '200px',
      render: (node) => (
        <div className="flex flex-col gap-0.5">
          {node.phone && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Phone className="w-3 h-3 opacity-60" />
              {node.phone}
            </div>
          )}
          {node.email && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Mail className="w-3 h-3 opacity-60" />
              {node.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'members',
      label: t.modules.k8s.nodeCount,
      width: '100px',
      align: 'center',
      render: (node) => (
        <Badge variant="outline" className="gap-1 border-gray-100 bg-gray-50 text-gray-600 font-normal">
          <Users className="w-3 h-3 opacity-60" />
          {node.userCount || 0}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: t.user.status,
      width: '100px',
      align: 'center',
      render: (node) => (
        <Switch
          checked={node.status === 'active'}
          onCheckedChange={(checked) => onStatusChange(node, checked)}
          className="data-[state=checked]:bg-green-500 scale-90"
          disabled={!hasPermission(systemPermissions.department.update)}
        />
      ),
    },
    {
      key: 'actions',
      label: t.common.actions,
      width: '180px',
      align: 'right',
      render: (node) => (
        <ActionButtons 
          actions={[
            {
              icon: <Plus className="w-4 h-4 text-green-500" />,
              label: t.actions.add,
              onClick: () => onAction('add-sub', node),
              permission: systemPermissions.department.create,
              className: "hover:bg-green-50"
            },
            {
              icon: <Eye className="w-4 h-4 text-blue-500" />,
              label: t.actions.detail,
              onClick: () => onAction('members', node),
              permission: systemPermissions.department.query,
            },
            {
              icon: <Edit className="w-4 h-4 text-amber-500" />,
              label: t.actions.edit,
              onClick: () => onAction('edit', node),
              permission: systemPermissions.department.update,
            },
            {
              icon: <Trash2 className="w-4 h-4 text-red-500" />,
              label: t.actions.delete,
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

