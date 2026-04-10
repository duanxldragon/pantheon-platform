import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Hash, Plus, Search } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { useLanguageStore } from '../../../../../stores/language_store';
import { getDataDictionaryCopy } from '../data_dictionary_copy';

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
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const dictionaryCopy = getDataDictionaryCopy(language);
  const copy = dictionaryCopy.sidebar;
  const [search, setSearch] = useState('');

  const filteredTypes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return types;
    return types.filter((it) => it.name.toLowerCase().includes(term) || it.code.toLowerCase().includes(term));
  }, [types, search]);
  const activeTypeCount = filteredTypes.filter((item) => item.status === 'active').length;

  const getScaleLabel = (count: number) => {
    if (count >= 20) return zh ? '大' : 'L';
    if (count >= 8) return zh ? '中' : 'M';
    return zh ? '小' : 'S';
  };

  return (
    <div className="flex h-full w-72 flex-col gap-4 rounded-[28px] border border-slate-200/70 bg-slate-50/80 p-4 shadow-inner shadow-slate-100/80">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <BookOpen className="h-4 w-4 text-primary" />
          {copy.typeTitle}
        </h3>
        {canAddType ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddType}
            className="h-10 w-10 rounded-2xl border border-slate-200/80 bg-white/90 text-primary shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={copy.typeSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-2xl border-slate-200/80 bg-white/90 pl-10 text-sm shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-200/70 bg-white/88 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {zh ? '类型数量' : 'Types'}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{filteredTypes.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/88 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {zh ? '启用数量' : 'Enabled'}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{activeTypeCount}</div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto pr-1">
        {filteredTypes.map((item) => {
          const isActive = selectedCode === item.code;
          const count = item.itemCount ?? 0;
          const scaleLabel = getScaleLabel(count);
          return (
            <button
              key={item.code}
              onClick={() => onSelect(item.code)}
              className={`group flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                isActive
                  ? 'scale-[1.01] border-primary/20 bg-primary text-white shadow-lg shadow-primary/20'
                  : 'border-transparent bg-white/65 text-slate-600 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm'
              }`}
            >
              <div className={`rounded-2xl border p-2 transition-colors ${isActive ? 'border-white/10 bg-white/20' : 'border-slate-200/70 bg-slate-100 group-hover:bg-white'}`}>
                <Hash className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-2 w-2 rounded-full ${item.status === 'active' ? (isActive ? 'bg-white' : 'bg-emerald-500') : isActive ? 'bg-white/80' : 'bg-amber-500'}`} />
                  <p className="truncate text-sm font-semibold leading-tight">{item.name}</p>
                </div>
                <p className={`mt-0.5 truncate font-mono text-[10px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{item.code}</p>
                {item.description ? (
                  <p className={`mt-1 line-clamp-2 text-[11px] leading-5 ${isActive ? 'text-white/75' : 'text-slate-500'}`}>
                    {item.description}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={`rounded-full px-2 py-0.5 text-[10px] border-none ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                  {count.toLocaleString()}
                </Badge>
                <Badge className={`rounded-full border-none px-2 py-0.5 text-[10px] ${isActive ? 'bg-white/15 text-white/90' : item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {item.status === 'active' ? dictionaryCopy.dialog.statusEnabled : dictionaryCopy.dialog.statusDisabled}
                </Badge>
                <Badge className={`rounded-full border-none px-2 py-0.5 text-[10px] ${isActive ? 'bg-white/10 text-white/80' : 'bg-slate-100 text-slate-500'}`}>
                  {zh ? `${scaleLabel}规模` : `${scaleLabel} scale`}
                </Badge>
                {isActive ? <ChevronRight className="w-3 h-3 text-white/50" /> : null}
              </div>
            </button>
          );
        })}

        {filteredTypes.length === 0 ? (
          <div className="py-10 text-center text-xs italic text-slate-400">{copy.typeEmptyHint}</div>
        ) : null}
      </div>
    </div>
  );
};




