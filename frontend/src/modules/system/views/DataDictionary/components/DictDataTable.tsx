import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Switch } from '../../../../../components/ui/switch';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Type,
  Code2,
  ListOrdered,
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

export interface DictItem {
  id: string;
  dictLabel: string;
  dictValue: string;
  sort: number;
  status: string;
  remark?: string;
  cssClass?: string;
}

interface DictDataTableProps {
  data: DictItem[];
  loading?: boolean;
  onAction: (action: string, item: DictItem) => void;
  onStatusChange: (item: DictItem, enabled: boolean) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export const DictDataTable: React.FC<DictDataTableProps> = ({
  data,
  loading,
  onAction,
  onStatusChange,
  canUpdate = true,
  canDelete = true,
}) => {
  const { t } = useLanguageStore();

  const columns: Column<DictItem>[] = [
    {
      key: 'dictLabel',
      label: t.systemManagement.dictionary.columns.label,
      width: '200px',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-100/80 bg-emerald-50 shadow-sm shadow-emerald-100/50">
            <Type className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="font-bold text-slate-900">{item.dictLabel}</span>
        </div>
      ),
    },
    {
      key: 'dictValue',
      label: t.systemManagement.dictionary.columns.value,
      width: '180px',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="rounded-full border border-blue-100/80 bg-blue-50/80 px-2.5 py-1 font-mono text-xs text-blue-600 shadow-sm shadow-blue-100/40">
            {item.dictValue}
          </span>
        </div>
      ),
    },
    {
      key: 'style',
      label: t.systemManagement.dictionary.columns.style,
      width: '120px',
      render: (item) => (
        item.cssClass ? (
          <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-[10px] shadow-sm ${item.cssClass}`}>
            {item.cssClass}
          </Badge>
        ) : (
          <span className="text-slate-300 text-xs">-</span>
        )
      ),
    },
    {
      key: 'sort',
      label: t.systemManagement.dictionary.columns.sort,
      width: '100px',
      align: 'center',
      render: (item) => (
        <div className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/90 px-2.5 py-1 text-slate-500 shadow-sm shadow-slate-200/40">
          <ListOrdered className="w-3 h-3 opacity-50" />
          <span className="font-mono text-xs">{item.sort}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: t.user.status,
      width: '100px',
      align: 'center',
      render: (item) => (
        <Switch
          checked={item.status === 'active'}
          onCheckedChange={(checked) => onStatusChange(item, checked)}
          disabled={!canUpdate}
          className="scale-90 data-[state=checked]:bg-emerald-500"
        />
      ),
    },
    {
      key: 'remark',
      label: t.systemManagement.dictionary.columns.remark,
      width: '220px',
      render: (item) => (
        <div className="flex items-start gap-1.5 text-slate-500/75">
          <FileText className="w-3 h-3 mt-1 flex-shrink-0" />
          <span className="text-xs truncate max-w-[180px]">{item.remark || '-'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: t.common.actions,
      width: '120px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          {canUpdate ? (
            <ActionButtons 
              actions={[
                {
                  icon: <Edit className="w-4 h-4 text-amber-500" />,
                  label: t.common.edit,
                  onClick: () => onAction('edit', item),
                },
              ]} 
            />
          ) : null}
          {canUpdate || canDelete ? (
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
                {canUpdate ? (
                  <DropdownMenuItem className="rounded-xl focus:bg-slate-100" onClick={() => onAction('edit', item)}>
                    <Edit className="w-4 h-4 mr-2 text-amber-500" />
                    {t.systemManagement.dictionary.actions.editItem}
                  </DropdownMenuItem>
                ) : null}
                {canDelete ? (
                  <DropdownMenuItem className="rounded-xl text-rose-600 focus:bg-rose-50 focus:text-rose-700" onClick={() => onAction('delete', item)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.common.delete}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <EnhancedDataTable
        columns={columns}
        data={data}
        rowKey={(item) => item.id}
        className="border-none shadow-none"
      />
      {data.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
          <div className="p-4 bg-slate-50 rounded-full">
            <Code2 className="w-8 h-8 opacity-20" />
          </div>
          <p className="text-sm italic">{t.systemManagement.dictionary.emptyHint}</p>
        </div>
      )}
    </div>
  );
};


