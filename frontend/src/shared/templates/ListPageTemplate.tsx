import { ReactNode, useState } from 'react';
import { ThemedPageLayout, ThemedButton, ThemedCard, ThemedSearchBar } from '../components/ui';
import { DataTable, Column } from '../../components/common/DataTable';
import { Plus } from 'lucide-react';
import { useLanguageStore } from '../../stores/languageStore';

interface ListPageTemplateProps<T> {
  title: string;
  description?: string;
  searchPlaceholder?: string;
  addButtonText?: string;
  columns: Column<T>[];
  data: T[];
  rowKey: (item: T) => string;
  onAdd?: () => void;
  extraActions?: ReactNode;
  extraFilters?: ReactNode;
  onSearch?: (query: string) => void;
}

/**
 * List page template
 * Includes: title, search bar, data table, add button
 */
export function ListPageTemplate<T>({
  title,
  description,
  searchPlaceholder,
  addButtonText,
  columns,
  data,
  rowKey,
  onAdd,
  extraActions,
  extraFilters,
  onSearch,
}: ListPageTemplateProps<T>) {
  const { t } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const defaultSearchPlaceholder = searchPlaceholder || t.topBar.searchPlaceholder;
  const defaultAddButtonText = addButtonText || t.actions.add;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <ThemedPageLayout
      title={title}
      description={description}
      action={
        <div className="flex gap-2">
          {extraActions}
          {onAdd && (
            <ThemedButton icon={<Plus className="w-4 h-4" />} onClick={onAdd}>
              {defaultAddButtonText}
            </ThemedButton>
          )}
        </div>
      }
    >
      <ThemedCard className="p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <ThemedSearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={defaultSearchPlaceholder}
            />
          </div>
          {extraFilters && <div className="flex gap-2">{extraFilters}</div>}
        </div>

        <DataTable columns={columns} data={data} rowKey={rowKey} />
      </ThemedCard>
    </ThemedPageLayout>
  );
}
