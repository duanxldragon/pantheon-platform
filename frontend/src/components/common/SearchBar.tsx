import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLanguageStore } from '../../stores/languageStore';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showFilter?: boolean;
  onFilter?: () => void;
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  showFilter = true,
  onFilter
}: SearchBarProps) {
  const { t } = useLanguageStore();
  const defaultPlaceholder = placeholder || t.topBar.searchPlaceholder;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={defaultPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      {showFilter && (
        <Button variant="outline" onClick={onFilter} className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300">
          {t.actions.filter}
        </Button>
      )}
    </div>
  );
}
