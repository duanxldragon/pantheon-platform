import { ReactNode } from 'react';
import { useThemeStore } from '../../../stores/themeStore';

interface ThemedPageLayoutProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  breadcrumb?: ReactNode;
}

export function ThemedPageLayout({
  title,
  description,
  action,
  children,
  breadcrumb,
}: ThemedPageLayoutProps) {
  const { theme } = useThemeStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl mb-1"
              style={{ color: theme.colors.text }}
            >
              {title}
            </h1>
            {description && (
              <p
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
}