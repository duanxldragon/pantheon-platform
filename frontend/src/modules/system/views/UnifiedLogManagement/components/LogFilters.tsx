import React from 'react';
import { Download, FileText, Filter, LogIn, Search, Trash2, Upload } from 'lucide-react';

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
  onClearLogs: () => void;
  onImport?: () => void;
  onExport: () => void;
  canClearLogs?: boolean;
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
  onClearLogs,
  onImport,
  onExport,
  canClearLogs = true,
  canImport = true,
  canExport = true,
}) => {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const loginTabLabel = zh ? '\u767b\u5f55\u65e5\u5fd7' : 'Login Logs';
  const operationTabLabel = zh ? '\u64cd\u4f5c\u65e5\u5fd7' : 'Operation Logs';
  const clearLogsLabel = zh ? '\u6e05\u7a7a\u64cd\u4f5c\u65e5\u5fd7' : 'Clear Operation Logs';
  const loginTabDescription = zh
    ? '\u67e5\u770b\u767b\u5f55\u6210\u529f\u3001\u5931\u8d25\u4e0e\u8bbe\u5907\u73af\u5883'
    : 'Review sign-ins, failures, and device context';
  const operationTabDescription = zh
    ? '\u8ddf\u8e2a\u914d\u7f6e\u53d8\u66f4\u3001\u6388\u6743\u64cd\u4f5c\u4e0e\u5ba1\u8ba1\u8bb0\u5f55'
    : 'Track configuration changes, authorization actions, and audits';

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onTabChange('login')}
            className={`flex min-h-[92px] items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${
              activeTab === 'login'
                ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm shadow-blue-100/60'
                : 'border-slate-200 bg-white/85 text-slate-600 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div
              className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                activeTab === 'login' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <LogIn className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{loginTabLabel}</div>
              <div className={`mt-1 text-xs leading-5 ${activeTab === 'login' ? 'text-blue-600/90' : 'text-slate-400'}`}>
                {loginTabDescription}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('operation')}
            className={`flex min-h-[92px] items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${
              activeTab === 'operation'
                ? 'border-violet-200 bg-gradient-to-br from-violet-50 to-white text-violet-700 shadow-sm shadow-violet-100/60'
                : 'border-slate-200 bg-white/85 text-slate-600 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div
              className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                activeTab === 'operation' ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{operationTabLabel}</div>
              <div
                className={`mt-1 text-xs leading-5 ${
                  activeTab === 'operation' ? 'text-violet-600/90' : 'text-slate-400'
                }`}
              >
                {operationTabDescription}
              </div>
            </div>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canClearLogs && activeTab === 'operation' && (
            <Button
              variant="outline"
              onClick={onClearLogs}
              className="h-11 rounded-2xl border-rose-200/80 bg-rose-50/80 px-4 text-rose-600 shadow-sm shadow-rose-100/50 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {clearLogsLabel}
            </Button>
          )}

          {canImport && onImport ? (
            <Button
              variant="outline"
              onClick={onImport}
              className="h-11 rounded-2xl border-slate-200/80 bg-white/90 px-4 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Upload className="w-4 h-4 mr-2 text-slate-400" />
              {t.actions.import}
            </Button>
          ) : null}
          {canExport ? (
            <Button
              variant="outline"
              onClick={onExport}
              className="h-11 rounded-2xl border-slate-200/80 bg-white/90 px-4 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="w-4 h-4 mr-2 text-slate-400" />
              {t.actions.export}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-slate-200/70 bg-white/72 p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t.systemManagement.logs.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 rounded-2xl border-slate-200/80 bg-white/90 pl-10 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
          />
        </div>

        <div className="w-44">
          <Select value={statusFilter} onValueChange={(val) => onStatusChange(val as StatusFilter)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <SelectValue placeholder={t.systemManagement.logs.statusAll} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
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


