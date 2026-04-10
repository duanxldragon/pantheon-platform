import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLanguageStore } from '../../stores/language_store';

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
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={defaultPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-2xl border-slate-200/80 bg-white/90 pl-10 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
        />
      </div>
      {showFilter && (
        <Button
          variant="outline"
          onClick={onFilter}
          className="h-11 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
        >
          {t.actions.filter}
        </Button>
      )}
    </div>
  );
}

