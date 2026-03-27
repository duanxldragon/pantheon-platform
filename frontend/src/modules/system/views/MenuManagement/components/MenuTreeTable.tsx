import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Switch } from '../../../../../components/ui/switch';
import * as LucideIcons from 'lucide-react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  Folder, 
  FileCode, 
  MousePointer2,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { 
  EnhancedDataTable, 
  Column 
} from '../../../../../shared/components/ui/EnhancedDataTable';
import { ActionButtons } from '../../../../../shared/components/ui/ActionButtons';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../../../../components/ui/dropdown-menu';
import { Button } from '../../../../../components/ui/button';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useAuthStore } from '../../../../auth/store/authStore';
import { systemPermissions } from '../../../constants/permissions';
import { MenuNode } from '../hooks/useMenuTree';

interface MenuTreeTableProps {
  data: MenuNode[];
  expandedKeys: Set<string>;
  onToggleExpand: (id: string) => void;
  onAction: (action: string, menu: MenuNode) => void;
  onStatusChange: (menu: MenuNode, enabled: boolean) => void;
  selectedItems: MenuNode[];
  onSelectionChange: (items: MenuNode[]) => void;
}

// Dynamic icon renderer (Lucide icon name -> component)
const DynamicIcon = ({ name, className }: { name?: string, className?: string }) => {
  if (!name) return null;
  // @ts-ignore
  const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle;
  return <IconComponent className={className} />;
};

export const MenuTreeTable: React.FC<MenuTreeTableProps> = ({
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

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'directory':
        return { label: t.systemManagement.menuManagement.typeDirectory, color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Folder };
      case 'menu':
        return { label: t.systemManagement.menuManagement.typeMenu, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: FileCode };
      case 'button':
        return { label: t.systemManagement.menuManagement.typeButton, color: 'bg-amber-50 text-amber-600 border-amber-100', icon: MousePointer2 };
      default:
        return { label: type, color: 'bg-gray-50 text-gray-600 border-gray-100', icon: FileCode };
    }
  };

  const columns: Column<MenuNode>[] = [
    {
      key: 'name',
      label: t.menu.systemMenus,
      width: '380px',
      render: (node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedKeys.has(node.id);
        const { icon: TypeIcon } = getTypeInfo(node.type);

        return (
          <div 
            className="flex items-center gap-2 group"
            style={{ paddingLeft: `${node.level * 24}px` }}
          >
            {/* expand / collapse */}
            <div className="flex items-center justify-center w-6">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(node.id);
                  }}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* icon preview */}
            <div className={`p-2 rounded-lg transition-colors ${
              node.type === 'directory' ? 'bg-blue-50 text-blue-500' : 
              node.type === 'menu' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
            }`}>
              {node.icon ? (
                <DynamicIcon name={node.icon} className="w-4 h-4" />
              ) : (
                <TypeIcon className="w-4 h-4" />
              )}
            </div>

            {/* name */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 truncate">
                  {node.name}
                </span>
                {node.type === 'link' && <ExternalLink className="w-3 h-3 text-gray-400" />}
              </div>
              <span className="text-[10px] text-gray-400 font-mono leading-none">
                {node.id.split('-')[0]}...
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: t.systemManagement.menuManagement.columns.type,
      width: '100px',
      render: (node) => {
        const { label, color } = getTypeInfo(node.type);
        return (
          <Badge variant="outline" className={`font-medium px-2 py-0 ${color}`}>
            {label}
          </Badge>
        );
      }
    },
    {
      key: 'route',
      label: t.systemManagement.menuManagement.columns.routePermission,
      width: '280px',
      render: (node) => (
        <div className="flex flex-col gap-1">
          {node.path && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded w-fit border border-gray-100/50">
              <span className="opacity-50">URL:</span> {node.path}
            </div>
          )}
          {node.permission && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded w-fit border border-primary/10">
              <span className="opacity-50 text-gray-400">Perm:</span> {node.permission}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: t.user.status,
      width: '90px',
      align: 'center',
      render: (node) => (
        <Switch
          checked={node.status === 'active'}
          onCheckedChange={(checked) => onStatusChange(node, checked)}
          className="data-[state=checked]:bg-green-500 scale-75"
          disabled={!hasPermission(systemPermissions.menu.update)}
        />
      ),
    },
    {
      key: 'sort',
      label: t.systemManagement.menuManagement.columns.sort,
      width: '80px',
      align: 'center',
      render: (node) => (
        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 rounded border border-gray-100">
          {node.sort || 0}
        </span>
      )
    },
    {
      key: 'actions',
      label: t.common.actions,
      width: '180px',
      align: 'right',
      render: (node) => {
        const canUpdateMenu = hasPermission(systemPermissions.menu.update);
        const canDeleteMenu = hasPermission(systemPermissions.menu.delete);
        const hasMoreActions = canUpdateMenu || canDeleteMenu;

        return (
          <div className="flex items-center justify-end gap-1">
            <ActionButtons 
              actions={[
                {
                  icon: <Plus className="w-4 h-4 text-emerald-500" />,
                  label: t.systemManagement.menuManagement.actions.addChild,
                  onClick: () => onAction('add-sub', node),
                  permission: systemPermissions.menu.create,
                },
                {
                  icon: <Edit className="w-4 h-4 text-amber-500" />,
                  label: t.common.edit,
                  onClick: () => onAction('edit', node),
                  permission: systemPermissions.menu.update,
                },
              ]} 
            />
            {hasMoreActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-full">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {canUpdateMenu ? (
                    <DropdownMenuItem onClick={() => onAction('edit', node)}>
                      <Edit className="w-4 h-4 mr-2 text-amber-500" />
                      {t.common.edit}
                    </DropdownMenuItem>
                  ) : null}
                  {canDeleteMenu ? (
                    <DropdownMenuItem className="text-red-600" onClick={() => onAction('delete', node)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.common.delete}
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
      rowKey={(node) => node.id}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      className="border-none shadow-none"
    />
  );
};

