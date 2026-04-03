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
import { ManagementFilterPanel } from '../../../../../shared/components/ui/ManagementSurface';
import { getMenuManagementCopy } from '../menuManagementCopy';

interface MenuSearchFilters {
  type: string;
  status: string;
}

interface MenuSearchFormProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: MenuSearchFilters;
  onFilterChange: (filters: MenuSearchFilters) => void;
}

export const MenuSearchForm: React.FC<MenuSearchFormProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
}) => {
  const { language } = useLanguageStore();
  const searchCopy = getMenuManagementCopy(language).search;
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
    <ManagementFilterPanel>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={searchCopy.searchPlaceholder}
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
                <SelectValue placeholder={searchCopy.typePlaceholder} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <SelectItem value="all">{searchCopy.typeAll}</SelectItem>
              <SelectItem value="directory">{searchCopy.typeDirectory}</SelectItem>
              <SelectItem value="menu">{searchCopy.typeMenu}</SelectItem>
              <SelectItem value="button">{searchCopy.typeButton}</SelectItem>
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
                <SelectValue placeholder={searchCopy.statusPlaceholder} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <SelectItem value="all">{searchCopy.statusAll}</SelectItem>
              <SelectItem value="active">{searchCopy.statusEnabled}</SelectItem>
              <SelectItem value="inactive">{searchCopy.statusDisabled}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleReset}
          className="h-11 rounded-2xl border-slate-200/80 bg-white/90 px-5 text-slate-600 shadow-sm shadow-slate-200/50 transition-all active:scale-95 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-primary"
        >
          <RotateCcw className="w-4 h-4 mr-2 opacity-70" />
          {searchCopy.reset}
        </Button>
      </div>
    </ManagementFilterPanel>
  );
};
