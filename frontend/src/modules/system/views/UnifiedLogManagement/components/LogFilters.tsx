import React from 'react';
import { Download, Filter, Search, Trash2, Upload } from 'lucide-react';

import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { useLanguageStore } from '../../../../../stores/languageStore';

type LogTab = 'login' | 'operation';
type StatusFilter = 'all' | 'success' | 'failure';

interface LogFiltersProps {
  activeTab: LogTab;
  onTabChange: (tab: LogTab) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (val: StatusFilter) => void;
  selectedCount: number;
  onBatchDelete: () => void;
  onImport?: () => void;
  onExport: () => void;
  canBatchDelete?: boolean;
  canImport?: boolean;
  canExport?: boolean;
}

export const LogFilters: React.FC<LogFiltersProps> = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  selectedCount,
  onBatchDelete,
  onImport,
  onExport,
  canBatchDelete = true,
  canImport = true,
  canExport = true,
}) => {
  const { t } = useLanguageStore();

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl w-fit">
          <button
            type="button"
            onClick={() => onTabChange('login')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === 'login' ? 'bg-white text-primary shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            {t.systemManagement.logs.tabLogin}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('operation')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === 'operation'
                ? 'bg-white text-primary shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            {t.systemManagement.logs.tabOperation}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {canBatchDelete && selectedCount > 0 && (
            <Button
              variant="outline"
              onClick={onBatchDelete}
              className="h-10 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t.systemManagement.logs.deleteSelected} ({selectedCount})
            </Button>
          )}

          {canImport && onImport ? (
            <Button
              variant="outline"
              onClick={onImport}
              className="h-10 border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
            >
              <Upload className="w-4 h-4 mr-2 text-gray-400" />
              {t.actions.import}
            </Button>
          ) : null}
          {canExport ? (
            <Button
              variant="outline"
              onClick={onExport}
              className="h-10 border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
            >
              <Download className="w-4 h-4 mr-2 text-gray-400" />
              {t.actions.export}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap bg-white/50 backdrop-blur-md p-3 rounded-2xl border border-gray-100">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t.systemManagement.logs.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 border-gray-200 bg-white/80 focus:bg-white focus:border-primary/40 focus:ring-primary/10 transition-all rounded-xl"
          />
        </div>

        <div className="w-44">
          <Select value={statusFilter} onValueChange={(val) => onStatusChange(val as StatusFilter)}>
            <SelectTrigger className="h-11 border-gray-200 rounded-xl bg-white/80">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <SelectValue placeholder={t.systemManagement.logs.statusAll} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.systemManagement.logs.statusAll}</SelectItem>
              <SelectItem value="success">{t.modules.deploy.status.success}</SelectItem>
              <SelectItem value="failure">{t.modules.deploy.status.failed}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
