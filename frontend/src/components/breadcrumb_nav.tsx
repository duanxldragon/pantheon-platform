import { ChevronRight, Home } from 'lucide-react';
import { useUIStore } from '../stores/ui_store';
import { cn } from './ui/utils';

export function BreadcrumbNav() {
  const { tabs, activeTab, setActiveTab } = useUIStore();

  // 获取当前激活标签页的面包屑路径
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const breadcrumbPath = currentTab?.path || [];

  // 如果没有面包屑路径，不显示面包屑区域
  if (breadcrumbPath.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-6 py-2.5 border-b bg-background border-border">
      {/* 首页图标 */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className="flex items-center transition-all duration-200 p-1 rounded hover:bg-muted text-muted-foreground"
        title="返回首页"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {/* 面包屑路径 */}
      {breadcrumbPath.map((item, index) => {
        const isLast = index === breadcrumbPath.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-border" />
            <span
              className={cn(
                "text-xs transition-colors",
                isLast ? "text-foreground font-medium" : "text-muted-foreground font-normal"
              )}
            >
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
  }
