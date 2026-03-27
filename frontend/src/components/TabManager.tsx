import { X } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { Tab } from '../stores/uiStore';

interface TabManagerProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export function TabManager({ tabs, activeTab, onTabChange, onTabClose }: TabManagerProps) {
  const { theme } = useThemeStore();

  if (tabs.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 px-4 py-2 border-b overflow-x-auto"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <div
            key={tab.id}
            className="flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all duration-200 group min-w-fit"
            style={{
              backgroundColor: isActive ? theme.colors.background : 'transparent',
              borderBottom: isActive ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
              color: isActive ? theme.colors.primary : theme.colors.textSecondary,
            }}
            onClick={() => onTabChange(tab.id)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = theme.colors.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span className="text-sm whitespace-nowrap">{tab.label}</span>
            {tab.closable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 rounded p-0.5"
                style={{
                  color: theme.colors.textSecondary,
                }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}