import { ReactNode } from 'react';
import { Button } from '../../../components/ui/button';
import { useThemeStore } from '../../../stores/theme_store';

interface ThemedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function ThemedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  className = '',
  type = 'button',
}: ThemedButtonProps) {
  const { theme } = useThemeStore();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(239,68,68,0.2)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: theme.colors.text,
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${getSizeStyles()} ${className}`}
      style={getVariantStyles()}
    >
      {icon}
      {children}
    </Button>
  );
}
