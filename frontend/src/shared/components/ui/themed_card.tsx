import { ReactNode } from 'react';
import { Card } from '../../../components/ui/card';
import { useThemeStore } from '../../../stores/theme_store';

interface ThemedCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function ThemedCard({ children, className = '', style = {}, onClick }: ThemedCardProps) {
  const { theme } = useThemeStore();

  return (
    <Card
      className={`transition-all duration-200 ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        color: theme.colors.text,
        ...style,
      }}
    >
      {children}
    </Card>
  );
}

