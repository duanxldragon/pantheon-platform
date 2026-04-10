import React from 'react';
import { Input } from '../../../../../components/ui/input';
import { Button } from '../../../../../components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../../components/ui/select';
import { 
  Search, 
  RotateCcw, 
  ChevronDown, 
  Filter 
} from '../../../../../shared/components/ui/icons';
import { useLanguageStore } from '../../../../../stores/language_store';
import { ManagementFilterPanel } from '../../../../../shared/components/ui/management_surface';
import { Department, Role } from '../../../types';
import { getUserManagementCopy } from '../user_management_copy';

interface UserSearchFilters {
  departmentId?: string;
  roleId?: string;
  status?: string;
}

interface UserSearchFormProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: UserSearchFilters;
  onFilterChange: (filters: UserSearchFilters) => void;
  departments: Department[];
  roles: Role[];
}

export const UserSearchForm: React.FC<UserSearchFormProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  departments,
  roles
}) => {
  const { language } = useLanguageStore();
  const copy = getUserManagementCopy(language).search;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const fieldClassName =
    'h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

  const handleReset = () => {
    onSearchChange('');
    onFilterChange({
      departmentId: 'all',
      roleId: 'all',
      status: 'all'
    });
  };

  return (
    <ManagementFilterPanel className="transition-all duration-300">
      <div className="flex flex-wrap items-center gap-4">
        {/* Keyword Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={copy.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`${fieldClassName} pl-10`}
          />
        </div>

        {/* 部门筛选 */}
        <div className="w-48">
          <Select 
            value={filters.departmentId || 'all'} 
            onValueChange={(val) => onFilterChange({ ...filters, departmentId: val })}
          >
              <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder={copy.departmentPlaceholder} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <SelectItem value="all">{copy.departmentAll}</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-36">
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(val) => onFilterChange({ ...filters, status: val })}
          >
            <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder={copy.statusPlaceholder} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <SelectItem value="all">{copy.statusAll}</SelectItem>
              <SelectItem value="active">{copy.statusEnabled}</SelectItem>
              <SelectItem value="inactive">{copy.statusDisabled}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-1">
          <Button 
            variant="mono"
            size="pill"
            onClick={handleReset}
            className="h-11 rounded-full px-5 text-slate-600 active:scale-95"
          >
            <RotateCcw className="w-4 h-4 mr-2 opacity-70" />
            {copy.reset}
          </Button>
          <Button 
            variant="mono"
            size="pill"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`h-11 rounded-full px-4 transition-all ${isExpanded ? 'border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/10' : 'text-slate-500'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            {copy.filter}
            <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* More Filters */}
      {isExpanded && (
        <div className="mt-4 grid animate-in grid-cols-1 gap-4 border-t border-slate-200/80 pt-4 duration-300 fade-in slide-in-from-top-2 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-medium text-slate-500">{copy.roleLabel}</label>
            <Select 
              value={filters.roleId || 'all'} 
              onValueChange={(val) => onFilterChange({ ...filters, roleId: val })}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder={copy.rolePlaceholder} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
                <SelectItem value="all">{copy.roleAll}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </ManagementFilterPanel>
  );
};








