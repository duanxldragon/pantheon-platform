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
import { getMenuLabel } from '../../../../../shared/constants/viewsConfig';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useAuthStore } from '../../../../auth/store/authStore';
import { systemPermissions } from '../../../constants/permissions';
import { MenuNode } from '../hooks/useMenuTree';
import { getMenuManagementCopy } from '../menuManagementCopy';

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
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = iconMap[name] || LucideIcons.HelpCircle;
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
  const { t, language } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const copy = getMenuManagementCopy(language).table;

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'directory':
        return { label: copy.typeDirectory, color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Folder };
      case 'menu':
        return { label: copy.typeMenu, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: FileCode };
      case 'button':
        return { label: copy.typeButton, color: 'bg-amber-50 text-amber-600 border-amber-100', icon: MousePointer2 };
      default:
        return { label: type, color: 'bg-slate-50 text-slate-600 border-slate-100', icon: FileCode };
    }
  };

  const columns: Column<MenuNode>[] = [
    {
      key: 'name',
      label: copy.name,
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
                  className="rounded-xl border border-transparent p-1.5 text-slate-400 transition-all hover:border-slate-200/80 hover:bg-white hover:text-slate-700 hover:shadow-sm"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* icon preview */}
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
              node.type === 'directory' ? 'border-blue-100/80 bg-blue-50 text-blue-500' : 
              node.type === 'menu' ? 'border-emerald-100/80 bg-emerald-50 text-emerald-500' : 'border-amber-100/80 bg-amber-50 text-amber-500'
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
                <span className="font-semibold text-slate-900 truncate">
                  {getMenuLabel(node, language, t)}
                </span>
                {node.external && <ExternalLink className="w-3 h-3 text-slate-400" />}
              </div>
                <span className="text-[10px] text-slate-400 font-mono leading-none">
                  {String(node.id).split('-')[0]}...
                </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: copy.type,
      width: '100px',
      render: (node) => {
        const { label, color } = getTypeInfo(node.type);
        return (
          <Badge variant="outline" className={`rounded-full px-2.5 py-1 font-medium shadow-sm ${color}`}>
            {label}
          </Badge>
        );
      }
    },
    {
      key: 'route',
      label: copy.routePermission,
      width: '280px',
      render: (node) => (
        <div className="flex flex-col gap-1">
          {node.path && (
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/90 px-2.5 py-1 text-[11px] font-mono text-slate-600 shadow-sm shadow-slate-200/40">
              <span className="opacity-50">{copy.routePrefix}</span> {node.path}
            </div>
          )}
          {node.permission && (
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-mono text-primary/80 shadow-sm shadow-primary/5">
              <span className="text-slate-400 opacity-60">{copy.permissionPrefix}</span> {node.permission}
            </div>
          )}
        </div>
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
          disabled={!hasPermission(systemPermissions.menu.update)}
        />
      ),
    },
    {
      key: 'sort',
      label: copy.sort,
      width: '80px',
      align: 'center',
      render: (node) => (
        <span className="inline-flex min-w-12 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50/90 px-2.5 py-1 text-xs font-mono text-slate-500 shadow-sm shadow-slate-200/40">
          {node.sort || 0}
        </span>
      )
    },
    {
      key: 'actions',
      label: copy.actions,
      width: '220px',
      align: 'right',
      render: (node) => {
        const canUpdateMenu = hasPermission(systemPermissions.menu.update);
        const canDeleteMenu = hasPermission(systemPermissions.menu.delete);
        const hasMoreActions = canUpdateMenu || canDeleteMenu;

        return (
          <div className="flex items-center justify-end gap-2">
            <ActionButtons 
              actions={[
                {
                  icon: <Plus className="w-4 h-4 text-emerald-500" />,
                  label: copy.addChild,
                  onClick: () => onAction('add-sub', node),
                  permission: systemPermissions.menu.create,
                },
                {
                  icon: <Edit className="w-4 h-4 text-amber-500" />,
                  label: copy.edit,
                  onClick: () => onAction('edit', node),
                  permission: systemPermissions.menu.update,
                },
              ]} 
            />
            {hasMoreActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl border border-slate-200/70 bg-white/90 text-slate-400 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-700"
                  >
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl shadow-slate-200/60">
                  {canUpdateMenu ? (
                    <DropdownMenuItem className="rounded-xl focus:bg-slate-100" onClick={() => onAction('edit', node)}>
                      <Edit className="w-4 h-4 mr-2 text-amber-500" />
                      {copy.edit}
                    </DropdownMenuItem>
                  ) : null}
                  {canDeleteMenu ? (
                    <DropdownMenuItem className="rounded-xl text-rose-600 focus:bg-rose-50 focus:text-rose-700" onClick={() => onAction('delete', node)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {copy.delete}
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
