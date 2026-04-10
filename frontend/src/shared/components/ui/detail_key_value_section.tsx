import { ReactNode } from 'react';

import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../components/ui/utils';

interface DetailSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  eyebrow?: string;
  className?: string;
}

interface DetailItemProps {
  label: string;
  value?: ReactNode;
  hint?: ReactNode;
  className?: string;
  valueClassName?: string;
}

export function DetailKeyValueSection({
  title,
  description,
  children,
  eyebrow,
  className,
}: DetailSectionProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-border/70 bg-gradient-to-br from-white/96 via-white/92 to-slate-50/78 p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] ring-1 ring-white/60 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/85',
        className,
      )}
    >
      <div className="mb-4 space-y-2">
        {eyebrow ? <Badge variant="mono">{eyebrow}</Badge> : null}
        <div>
          <h3 className="text-base font-semibold tracking-tight text-card-foreground">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function DetailKeyValueItem({
  label,
  value,
  hint,
  className,
  valueClassName,
}: DetailItemProps) {
  return (
    <div
      className={cn(
        'space-y-1.5 rounded-2xl border border-border/60 bg-gradient-to-br from-slate-50/90 via-white/85 to-slate-50/75 px-4 py-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.16)]',
        className,
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className={cn('break-words text-sm font-medium text-foreground', valueClassName)}>
        {value ?? '-'}
      </div>
      {hint ? <div className="text-xs leading-5 text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
