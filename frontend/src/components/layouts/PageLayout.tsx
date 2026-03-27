import { ReactNode } from 'react';
import { useThemeStore } from '../../stores/themeStore';

interface PageLayoutProps {
  title: string;
  description?: string; // Made optional
  actions?: ReactNode; // Changed from 'action' to 'actions'
  children: ReactNode;
}

export function PageLayout({ title, description, actions, children }: PageLayoutProps) {
  const { theme } = useThemeStore();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: theme.colors.text }}>{title}</h2>
          {description && (
            <p className="mt-1" style={{ color: theme.colors.textSecondary }}>{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}