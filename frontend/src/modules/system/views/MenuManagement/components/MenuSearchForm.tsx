import React from 'react';
import { Input } from '../../../../../components/ui/input';
import { Button } from '../../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Search, RotateCcw, LayoutGrid, ToggleLeft } from 'lucide-react';
import { useLanguageStore } from '../../../../../stores/languageStore';

interface MenuSearchFormProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: {
    type?: string;
    status?: string;
  };
  onFilterChange: (filters: any) => void;
}

export const MenuSearchForm: React.FC<MenuSearchFormProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
}) => {
  const { t } = useLanguageStore();
  const fieldClassName =
    'h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

  const handleReset = () => {
    onSearchChange('');
    onFilterChange({
      type: 'all',
      status: 'all',
    });
  };

  return (
    <div className="mb-5 rounded-[26px] border border-slate-200/70 bg-white/72 p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={t.systemManagement.menuManagement.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`${fieldClassName} pl-10`}
          />
        </div>

        <div className="w-40">
          <Select
            value={filters.type || 'all'}
            onValueChange={(val) => onFilterChange({ ...filters, type: val })}
          >
            <SelectTrigger className={fieldClassName}>
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder={t.systemManagement.menuManagement.typePlaceholder} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <SelectItem value="all">{t.systemManagement.menuManagement.typeAll}</SelectItem>
              <SelectItem value="directory">{t.systemManagement.menuManagement.typeDirectory}</SelectItem>
              <SelectItem value="menu">{t.systemManagement.menuManagement.typeMenu}</SelectItem>
              <SelectItem value="button">{t.systemManagement.menuManagement.typeButton}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filters.status || 'all'}
            onValueChange={(val) => onFilterChange({ ...filters, status: val })}
          >
            <SelectTrigger className={fieldClassName}>
              <div className="flex items-center gap-2">
                <ToggleLeft className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder={t.user.status} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <SelectItem value="all">{t.systemManagement.menuManagement.statusAll}</SelectItem>
              <SelectItem value="active">{t.status.enabled}</SelectItem>
              <SelectItem value="inactive">{t.status.disabled}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleReset}
          className="h-11 rounded-2xl border-slate-200/80 bg-white/90 px-5 text-slate-600 shadow-sm shadow-slate-200/50 transition-all active:scale-95 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-primary"
        >
          <RotateCcw className="w-4 h-4 mr-2 opacity-70" />
          {t.common.reset}
        </Button>
      </div>
    </div>
  );
};
