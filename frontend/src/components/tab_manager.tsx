import { X } from 'lucide-react';
import { Tab } from '../stores/ui_store';
import { cn } from './ui/utils';

interface TabManagerProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export function TabManager({ tabs, activeTab, onTabChange, onTabClose }: TabManagerProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b overflow-x-auto bg-card border-border">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all duration-200 group min-w-fit border-b-2",
              isActive 
                ? "bg-background border-primary text-primary" 
                : "bg-transparent border-transparent text-muted-foreground hover:bg-muted"
            )}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="text-sm whitespace-nowrap">{tab.label}</span>
            {tab.closable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted-foreground/20 rounded p-0.5 text-muted-foreground"
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
