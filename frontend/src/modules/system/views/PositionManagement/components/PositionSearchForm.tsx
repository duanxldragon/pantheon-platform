import React from 'react';

import { Building, Layers, RotateCcw, Search } from 'lucide-react';

import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { useLanguageStore } from '../../../../../stores/languageStore';

import type { Department } from '../../../types';

interface PositionSearchFormProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: {
    departmentId?: string;
    level?: string;
    status?: string;
  };
  onFilterChange: (filters: any) => void;
  departments: Department[];
}

export const PositionSearchForm: React.FC<PositionSearchFormProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  departments,
}) => {
  const { t } = useLanguageStore();
  const fieldClassName =
    'h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

  const handleReset = () => {
    onSearchChange('');
    onFilterChange({
      departmentId: 'all',
      level: 'all',
      status: 'all',
    });
  };

  return (
    <div className="mb-5 rounded-[26px] border border-slate-200/70 bg-white/72 p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={t.topBar.searchPlaceholder}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className={`${fieldClassName} pl-10`}
          />
        </div>

        <div className="w-48">
          <Select
            value={filters.departmentId || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, departmentId: value })}
          >
            <SelectTrigger className={fieldClassName}>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder={t.user.department} />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
                <SelectItem value="all">
                  {t.common.all}
                  {t.user.department}
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filters.level || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, level: value })}
          >
            <SelectTrigger className={fieldClassName}>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder={t.systemManagement.positions.level} />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
                <SelectItem value="all">{t.systemManagement.positions.levelAll}</SelectItem>
                <SelectItem value="1">{t.systemManagement.positions.levelL1}</SelectItem>
                <SelectItem value="2">{t.systemManagement.positions.levelL2}</SelectItem>
                <SelectItem value="3">{t.systemManagement.positions.levelL3}</SelectItem>
              </SelectContent>
            </Select>
          </div>

        <div className="w-36">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, status: value })}
          >
            <SelectTrigger className={fieldClassName}>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder={t.user.status} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <SelectItem value="all">
                {t.common.all}
                {t.user.status}
              </SelectItem>
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
