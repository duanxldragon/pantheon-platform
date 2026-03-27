import React, { useMemo, useState } from 'react';
import { BookOpen, Hash, Plus, Search, ChevronRight } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { useLanguageStore } from '../../../../../stores/languageStore';

export interface DictTypeItem {
  id: string;
  code: string;
  name: string;
  itemCount?: number;
  status: 'active' | 'inactive';
  description?: string;
}

interface DictTypeSidebarProps {
  types: DictTypeItem[];
  selectedCode: string;
  onSelect: (code: string) => void;
  onAddType: () => void;
  canAddType?: boolean;
}

export const DictTypeSidebar: React.FC<DictTypeSidebarProps> = ({ types, selectedCode, onSelect, onAddType, canAddType = true }) => {
  const { t } = useLanguageStore();
  const [search, setSearch] = useState('');

  const filteredTypes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return types;
    return types.filter((it) => it.name.toLowerCase().includes(term) || it.code.toLowerCase().includes(term));
  }, [types, search]);

  return (
    <div className="w-72 flex flex-col gap-4 border-r border-gray-100 pr-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          {t.systemManagement.dictionary.typeTitle}
        </h3>
        {canAddType ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddType}
            className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
          >
            <Plus className="w-4 h-4" />
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          placeholder={t.systemManagement.dictionary.typeSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 border-gray-100 bg-gray-50/50 rounded-lg text-xs focus:bg-white transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
        {filteredTypes.map((item) => {
          const isActive = selectedCode === item.code;
          return (
            <button
              key={item.code}
              onClick={() => onSelect(item.code)}
              className={`w-full group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white'}`}>
                <Hash className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{item.name}</p>
                <p className={`text-[10px] font-mono mt-0.5 truncate ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{item.code}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  className={`px-1.5 py-0 text-[10px] border-none ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                  }`}
                >
                  {(item.itemCount ?? 0).toLocaleString()}
                </Badge>
                {isActive ? <ChevronRight className="w-3 h-3 text-white/50" /> : null}
              </div>
            </button>
          );
        })}

        {filteredTypes.length === 0 ? (
          <div className="py-10 text-center text-gray-400 italic text-xs">{t.systemManagement.dictionary.typeEmptyHint}</div>
        ) : null}
      </div>
    </div>
  );
};
