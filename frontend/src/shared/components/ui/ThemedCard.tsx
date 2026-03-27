import { ReactNode } from 'react';
import { Card } from '../../../components/ui/card';
import { useThemeStore } from '../../../stores/themeStore';

interface ThemedCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ThemedCard({ children, className = '', style = {} }: ThemedCardProps) {
  const { theme } = useThemeStore();

  return (
    <Card
      className={`transition-all duration-200 ${className}`}
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