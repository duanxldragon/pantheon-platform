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

  const handleReset = () => {
    onSearchChange('');
    onFilterChange({
      departmentId: 'all',
      level: 'all',
      status: 'all',
    });
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t.topBar.searchPlaceholder}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9 h-10 border-gray-200 focus:border-primary/50 transition-all rounded-lg"
          />
        </div>

        <div className="w-48">
          <Select
            value={filters.departmentId || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, departmentId: value })}
          >
            <SelectTrigger className="h-10 border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  <SelectValue placeholder={t.user.department} />
                </div>
              </SelectTrigger>
              <SelectContent>
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
            <SelectTrigger className="h-10 border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  <SelectValue placeholder={t.systemManagement.positions.level} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.systemManagement.positions.levelAll}</SelectItem>
                <SelectItem value="1">{t.systemManagement.positions.levelL1}</SelectItem>
                <SelectItem value="2">{t.systemManagement.positions.levelL2}</SelectItem>
                <SelectItem value="3">{t.systemManagement.positions.levelL3}</SelectItem>
              </SelectContent>
            </Select>
          </div>

        <div className="w-32">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, status: value })}
          >
            <SelectTrigger className="h-10 border-gray-200 rounded-lg">
              <SelectValue placeholder={t.user.status} />
            </SelectTrigger>
            <SelectContent>
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
          className="h-10 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          <RotateCcw className="w-4 h-4 mr-2 opacity-70" />
          {t.common.reset}
        </Button>
      </div>
    </div>
  );
};
