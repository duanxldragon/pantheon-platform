/**
 * Tabs 组件 - 标签页
 * 优雅的标签页切换组件
 */

import { ReactNode, useState } from 'react';
import { useThemeStore } from '../../../stores/themeStore';

export interface Tab {
  key: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  type?: 'line' | 'card' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Tabs({
  tabs,
  defaultActiveKey,
  activeKey: controlledActiveKey,
  onChange,
  type = 'line',
  size = 'md',
  className = '',
}: TabsProps) {
  const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey || tabs[0]?.key);
  const { theme } = useThemeStore();

  const activeKey = controlledActiveKey ?? internalActiveKey;

  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return;
    setInternalActiveKey(key);
    onChange?.(key);
  };

  const activeTab = tabs.find(tab => tab.key === activeKey);

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-3',
  };

  const getTabStyles = (tab: Tab) => {
    const isActive = tab.key === activeKey;
    const baseStyles = `${sizeStyles[size]} font-medium transition-all duration-200 cursor-pointer flex items-center gap-2`;

    if (type === 'line') {
      return {
        className: `${baseStyles} border-b-2 ${isActive ? '' : 'border-transparent'} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary'}`,
        style: {
          color: isActive ? theme.colors.primary : theme.colors.textSecondary,
          borderBottomColor: isActive ? theme.colors.primary : 'transparent',
        },
      };
    }

    if (type === 'card') {
      return {
        className: `${baseStyles} rounded-t-lg border border-b-0 ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        style: {
          backgroundColor: isActive ? theme.colors.surface : theme.colors.background,
          color: isActive ? theme.colors.primary : theme.colors.textSecondary,
          borderColor: isActive ? theme.colors.border : 'transparent',
        },
      };
    }

    // pill
    return {
      className: `${baseStyles} rounded-full ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
      style: {
        backgroundColor: isActive ? theme.colors.primary : 'transparent',
        color: isActive ? '#ffffff' : theme.colors.textSecondary,
      },
    };
  };

  return (
    <div className={className}>
      {/* 标签头 */}
      <div
        className={`flex gap-2 ${type === 'line' ? 'border-b' : ''} ${type === 'pill' ? 'bg-muted/30 p-1 rounded-full inline-flex' : ''}`}
        style={type === 'line' ? { borderColor: theme.colors.border } : {}}
      >
        {tabs.map((tab) => {
          const styles = getTabStyles(tab);
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key, tab.disabled)}
              className={styles.className}
              style={styles.style}
              disabled={tab.disabled}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className="ml-1 px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: tab.key === activeKey ? 'rgba(255,255,255,0.2)' : theme.colors.primary,
                    color: tab.key === activeKey ? '#ffffff' : '#ffffff',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 标签内容 */}
      <div className="mt-4">
        {activeTab?.content}
      </div>
    </div>
  );
}
