import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Switch } from '../../../../../components/ui/switch';
import { 
  Briefcase, 
  Users, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Building,
  Layers,
  FileText
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
import { Position } from '../../../types';

interface PositionTableProps {
  data: Position[];
  selectedItems: Position[];
  onSelectionChange: (items: Position[]) => void;
  onAction: (action: string, position: Position) => void;
  onStatusChange: (position: Position, enabled: boolean) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export const PositionTable: React.FC<PositionTableProps> = ({
  data,
  selectedItems,
  onSelectionChange,
  onAction,
  onStatusChange,
  pagination
}) => {
  const { t } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const getLevelColor = (level: number) => {
    if (level === 1) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (level === 2) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const columns: Column<Position>[] = [
    {
      key: 'name',
      label: t.menu.systemPositions,
      width: '240px',
      render: (pos) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-gradient-to-br transition-all shadow-sm ${
            pos.level === 1 ? 'from-rose-500 to-rose-600' : 'from-indigo-500 to-indigo-600'
          }`}>
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 leading-tight">
              {pos.name}
            </span>
            <span className="text-[10px] text-gray-400 font-mono mt-0.5">
              {pos.code}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: t.user.department,
      width: '180px',
      render: (pos) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Building className="w-3.5 h-3.5 text-gray-400" />
          {pos.departmentName || '-'}
        </div>
      ),
    },
    {
      key: 'level',
      label: t.common.info,
      width: '120px',
      render: (pos) => (
        <Badge variant="outline" className={`font-medium px-2 py-0.5 rounded-full ${getLevelColor(pos.level)}`}>
          <Layers className="w-3 h-3 mr-1 opacity-70" />
          L{pos.level}
        </Badge>
      ),
    },
    {
      key: 'userCount',
      label: t.menu.systemUsers,
      width: '100px',
      align: 'center',
      render: (pos) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-bold text-gray-700">{pos.userCount || 0}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t.user.status,
      width: '90px',
      align: 'center',
      render: (pos) => (
        <Switch
          checked={pos.status === 'active'}
          onCheckedChange={(checked) => onStatusChange(pos, checked)}
          className="data-[state=checked]:bg-green-500 scale-90"
          disabled={!hasPermission(systemPermissions.position.update)}
        />
      ),
    },
    {
      key: 'description',
      label: t.modules.deploy.description,
      width: '200px',
      render: (pos) => (
        <div className="flex items-start gap-1.5 max-w-[180px]">
          <FileText className="w-3 h-3 mt-1 text-gray-300 flex-shrink-0" />
          <span className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic">
            {pos.description || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: t.common.actions,
      width: '150px',
      align: 'right',
      render: (pos) => {
        const canUpdatePosition = hasPermission(systemPermissions.position.update);
        const canDeletePosition = hasPermission(systemPermissions.position.delete);
        const hasMoreActions = canUpdatePosition || canDeletePosition;

        return (
          <div className="flex items-center justify-end gap-1">
            <ActionButtons 
              actions={[
                {
                  icon: <Eye className="w-4 h-4 text-blue-500" />,
                  label: t.common.view,
                  onClick: () => onAction('detail', pos),
                  permission: systemPermissions.position.query,
                },
                {
                  icon: <Edit className="w-4 h-4 text-amber-500" />,
                  label: t.common.edit,
                  onClick: () => onAction('edit', pos),
                  permission: systemPermissions.position.update,
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
                  {canUpdatePosition ? (
                    <DropdownMenuItem onClick={() => onAction('edit', pos)}>
                      <Edit className="w-4 h-4 mr-2 text-amber-500" />
                      {t.common.edit}
                    </DropdownMenuItem>
                  ) : null}
                  {canDeletePosition ? (
                    <DropdownMenuItem className="text-red-600" onClick={() => onAction('delete', pos)}>
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
      rowKey={(pos) => pos.id}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      pagination={pagination}
      className="border-none shadow-none"
    />
  );
};

