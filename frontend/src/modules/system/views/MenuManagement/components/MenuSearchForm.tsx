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

  const handleReset = () => {
    onSearchChange('');
    onFilterChange({
      type: 'all',
      status: 'all',
    });
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t.systemManagement.menuManagement.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 border-gray-200 focus:border-primary/40 focus:ring-primary/10 transition-all rounded-xl bg-white/50"
          />
        </div>

        <div className="w-40">
          <Select
            value={filters.type || 'all'}
            onValueChange={(val) => onFilterChange({ ...filters, type: val })}
          >
            <SelectTrigger className="h-11 border-gray-200 rounded-xl bg-white/50">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder={t.systemManagement.menuManagement.typePlaceholder} />
              </div>
            </SelectTrigger>
            <SelectContent>
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
            <SelectTrigger className="h-11 border-gray-200 rounded-xl bg-white/50">
              <div className="flex items-center gap-2">
                <ToggleLeft className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder={t.user.status} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.systemManagement.menuManagement.statusAll}</SelectItem>
              <SelectItem value="active">{t.status.enabled}</SelectItem>
              <SelectItem value="inactive">{t.status.disabled}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleReset}
          className="h-11 px-5 border-gray-200 text-gray-600 hover:bg-white hover:text-primary rounded-xl transition-all shadow-sm active:scale-95"
        >
          <RotateCcw className="w-4 h-4 mr-2 opacity-70" />
          {t.common.reset}
        </Button>
      </div>
    </div>
  );
};

