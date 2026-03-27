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
import { useLanguageStore } from '../../../../../stores/languageStore';
import { Department, Role } from '../../../types';

interface UserSearchFormProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: {
    departmentId?: string;
    roleId?: string;
    status?: string;
  };
  onFilterChange: (filters: any) => void;
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
  const { t } = useLanguageStore();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleReset = () => {
    onSearchChange('');
    onFilterChange({
      departmentId: 'all',
      roleId: 'all',
      status: 'all'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm transition-all duration-300">
      <div className="flex flex-wrap items-center gap-4">
        {/* 鍏抽敭瀛楁悳绱?*/}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t.topBar.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 border-gray-200 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
          />
        </div>

        {/* 部门筛选 */}
        <div className="w-48">
          <Select 
            value={filters.departmentId || 'all'} 
            onValueChange={(val) => onFilterChange({ ...filters, departmentId: val })}
          >
              <SelectTrigger className="h-10 border-gray-200 rounded-lg">
              <SelectValue placeholder={t.user.department} />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">{t.common.all}{t.user.department}</SelectItem>
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
            <SelectTrigger className="h-10 border-gray-200 rounded-lg">
              <SelectValue placeholder={t.user.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.all}{t.user.status}</SelectItem>
              <SelectItem value="active">{t.status.enabled}</SelectItem>
              <SelectItem value="inactive">{t.status.disabled}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="h-10 px-4 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 mr-2 opacity-70" />
            {t.common.reset}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`h-10 px-3 rounded-lg transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'text-gray-500'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            {t.common.info}
            <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* More Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 ml-1">{t.user.role}</label>
            <Select 
              value={filters.roleId || 'all'} 
              onValueChange={(val) => onFilterChange({ ...filters, roleId: val })}
            >
              <SelectTrigger className="h-10 border-gray-100 bg-gray-50/50 rounded-lg">
                <SelectValue placeholder={t.user.role} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}{t.user.role}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Reserved for more filters in future (e.g. phone/email exact match). */}
        </div>
      )}
    </div>
  );
};

