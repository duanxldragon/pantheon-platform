import { ReactNode } from 'react';

import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../components/ui/utils';

interface ManagementPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
  className?: string;
}

export function ManagementPageHeader({
  title,
  description,
  actions,
  eyebrow,
  meta,
  className,
}: ManagementPageHeaderProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-4 overflow-hidden rounded-[30px] border border-border/70 bg-gradient-to-br from-background/98 via-background/95 to-slate-50/72 p-5 shadow-[0_22px_52px_-34px_rgba(15,23,42,0.3)] ring-1 ring-white/60 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/85 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-3">
        {eyebrow ? (
          <div className="flex items-center gap-2">
            <Badge variant="mono">{eyebrow}</Badge>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200/80 to-transparent" />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-[24px] border border-slate-200/70 bg-white/80 p-2 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.22)] ring-1 ring-white/60 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
