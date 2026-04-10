/**
 * Tooltip 组件 - 文字提示
 * 简单易用的提示工具
 */

import { ReactNode, useState } from 'react';
import { useThemeStore } from '../../../stores/theme_store';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 200,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { theme } = useThemeStore();

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const placementStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-8 border-x-8 border-x-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-8 border-x-8 border-x-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-8 border-y-8 border-y-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-8 border-y-8 border-y-transparent',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          className={`absolute z-50 ${placementStyles[placement]} pointer-events-none`}
          style={{ minWidth: 'max-content' }}
        >
          <div
            className="px-3 py-2 text-sm rounded-lg shadow-lg max-w-xs"
            style={{
              backgroundColor: theme.colors.text,
              color: theme.colors.surface,
            }}
          >
            {content}
          </div>
          
          {/* 箭头 */}
          <div
            className={`absolute w-0 h-0 ${arrowStyles[placement]}`}
            style={{
              borderTopColor: placement === 'top' ? theme.colors.text : 'transparent',
              borderBottomColor: placement === 'bottom' ? theme.colors.text : 'transparent',
              borderLeftColor: placement === 'left' ? theme.colors.text : 'transparent',
              borderRightColor: placement === 'right' ? theme.colors.text : 'transparent',
            }}
          />
        </div>
      )}
    </div>
  );
}
