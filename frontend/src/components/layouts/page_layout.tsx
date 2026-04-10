import { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageLayout({ title, description, actions, children }: PageLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-background/95 p-5 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.3)] sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            {title}
          </h2>
          {description && (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
              {description}
            </p>
          )}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
