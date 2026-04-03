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
  FileText,
} from 'lucide-react';
import {
  EnhancedDataTable,
  Column,
} from '../../../../../shared/components/ui/EnhancedDataTable';
import { ActionButtons } from '../../../../../shared/components/ui/ActionButtons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
import { Button } from '../../../../../components/ui/button';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useAuthStore } from '../../../../auth/store/authStore';
import { systemPermissions } from '../../../constants/permissions';
import { Position } from '../../../types';
import { getPositionManagementCopy } from '../positionManagementCopy';

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
  pagination,
}) => {
  const { language } = useLanguageStore();
  const copy = getPositionManagementCopy(language);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const getLevelColor = (level: number) => {
    if (level === 1) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (level === 2) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const columns: Column<Position>[] = [
    {
      key: 'name',
      label: copy.table.name,
      width: '240px',
      render: (pos) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-br shadow-[0_18px_35px_-24px_rgba(15,23,42,0.5)] transition-all ${
              pos.level === 1 ? 'from-rose-500 to-rose-600' : 'from-indigo-500 to-indigo-600'
            }`}
          >
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight text-slate-900">{pos.name}</span>
            <span className="mt-0.5 font-mono text-[10px] text-slate-400">{pos.code}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: copy.table.department,
      width: '180px',
      render: (pos) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Building className="h-3.5 w-3.5 text-slate-400" />
          {pos.departmentName || '-'}
        </div>
      ),
    },
    {
      key: 'level',
      label: copy.table.level,
      width: '120px',
      render: (pos) => (
        <Badge variant="outline" className={`rounded-full px-2 py-0.5 font-medium ${getLevelColor(pos.level)}`}>
          <Layers className="mr-1 h-3 w-3 opacity-70" />
          L{pos.level}
        </Badge>
      ),
    },
    {
      key: 'userCount',
      label: copy.table.users,
      width: '100px',
      align: 'center',
      render: (pos) => (
        <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-1.5">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">{pos.userCount || 0}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: copy.table.status,
      width: '112px',
      align: 'center',
      render: (pos) => (
        <Switch
          checked={pos.status === 'active'}
          onCheckedChange={(checked) => onStatusChange(pos, checked)}
          className="scale-90 data-[state=checked]:bg-green-500"
          disabled={!hasPermission(systemPermissions.position.update)}
        />
      ),
    },
    {
      key: 'description',
      label: copy.table.description,
      width: '200px',
      render: (pos) => (
        <div className="flex max-w-[180px] items-start gap-1.5">
          <FileText className="mt-1 h-3 w-3 flex-shrink-0 text-slate-300" />
          <span className="line-clamp-2 text-xs italic leading-relaxed text-slate-500">
            {pos.description || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: copy.table.actions,
      width: '208px',
      align: 'right',
      render: (pos) => {
        const canUpdatePosition = hasPermission(systemPermissions.position.update);
        const canDeletePosition = hasPermission(systemPermissions.position.delete);
        const hasMoreActions = canUpdatePosition || canDeletePosition;

        return (
          <div className="flex items-center justify-end gap-2">
            <ActionButtons
              actions={[
                {
                  icon: <Eye className="h-4 w-4 text-blue-500" />,
                  label: copy.actionLabels.detail,
                  onClick: () => onAction('detail', pos),
                  permission: systemPermissions.position.query,
                },
                {
                  icon: <Edit className="h-4 w-4 text-amber-500" />,
                  label: copy.actionLabels.edit,
                  onClick: () => onAction('edit', pos),
                  permission: systemPermissions.position.update,
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
                  className="w-40 rounded-2xl border-slate-200/80 bg-white/98 shadow-xl shadow-slate-200/70"
                >
                  {canUpdatePosition ? (
                    <DropdownMenuItem onClick={() => onAction('edit', pos)}>
                      <Edit className="mr-2 h-4 w-4 text-amber-500" />
                      {copy.actionLabels.edit}
                    </DropdownMenuItem>
                  ) : null}
                  {canDeletePosition ? (
                    <DropdownMenuItem className="text-rose-600 focus:text-rose-700" onClick={() => onAction('delete', pos)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {copy.actionLabels.delete}
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
