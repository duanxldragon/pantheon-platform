/**
 * Dropdown 组件 - 下拉菜单
 * 简单实用的下拉菜单组件
 */

import { ReactNode, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: ReactNode;
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  className?: string;
}

export function Dropdown({
  items,
  trigger,
  placement = 'bottom-left',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  const placementStyles = {
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* 触发器 */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button
            className="px-4 py-2 rounded-lg border flex items-center gap-2 transition-all hover:shadow-md"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          >
            <span>操作</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className={`absolute z-50 ${placementStyles[placement]} min-w-40 py-1 rounded-lg border shadow-lg`}
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          {items.map((item) => (
            <div key={item.key}>
              {item.divider ? (
                <div
                  className="my-1 h-px"
                  style={{ backgroundColor: theme.colors.border }}
                />
              ) : (
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted/50 cursor-pointer'
                  }`}
                  style={{
                    color: item.danger ? '#ef4444' : theme.colors.text,
                  }}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 选择下拉菜单（带选中状态）
 */
export function SelectDropdown({
  items,
  value,
  onChange,
  placeholder = '请选择',
  className = '',
}: {
  items: DropdownItem[];
  value?: string;
  onChange: (key: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeStore();

  const selectedItem = items.find(item => item.key === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (key: string) => {
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* 选择器 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 rounded-lg border flex items-center justify-between gap-2 transition-all hover:shadow-md"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: selectedItem ? theme.colors.text : theme.colors.textSecondary,
        }}
      >
        <span className="flex items-center gap-2">
          {selectedItem?.icon}
          {selectedItem?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉选项 */}
      {isOpen && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-2 py-1 rounded-lg border shadow-lg max-h-60 overflow-auto"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key)}
              disabled={item.disabled}
              className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-muted/50 cursor-pointer'
              }`}
              style={{
                color: theme.colors.text,
                backgroundColor: value === item.key ? theme.colors.primary + '10' : 'transparent',
              }}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {value === item.key && (
                <Check className="w-4 h-4" style={{ color: theme.colors.primary }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
