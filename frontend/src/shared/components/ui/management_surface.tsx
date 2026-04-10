import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

import { Card } from '../../../components/ui/card';
import { cn } from '../../../components/ui/utils';

export function ManagementActionBar({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative flex flex-wrap items-center gap-2 overflow-hidden rounded-[26px] border border-border/70 bg-gradient-to-br from-white/92 via-white/82 to-slate-50/78 p-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)] ring-1 ring-white/60 backdrop-blur-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/80 dark:border-slate-800/70 dark:bg-slate-900/72 dark:ring-slate-800/50 dark:before:bg-slate-700/80',
        className,
      )}
      {...props}
    />
  );
}

export function ManagementFilterPanel({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative mb-5 overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-white/92 via-white/84 to-slate-50/78 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)] ring-1 ring-white/60 backdrop-blur-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/80 dark:border-slate-800/70 dark:bg-slate-900/72 dark:ring-slate-800/50 dark:before:bg-slate-700/80',
        className,
      )}
      {...props}
    />
  );
}

export function ManagementContentCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-[30px] border border-border/70 bg-gradient-to-br from-white/96 via-white/90 to-slate-50/82 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] ring-1 ring-white/60 backdrop-blur-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/85 dark:border-slate-800/70 dark:bg-slate-900/88 dark:ring-slate-800/50 dark:before:bg-slate-700/80',
        className,
      )}
      {...props}
    />
  );
}

export function ManagementMetricCard({
  className,
  label,
  value,
  hint,
  ...props
}: React.ComponentProps<typeof Card> & {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        'h-full rounded-[24px] border border-slate-200/70 bg-white/88 p-5 shadow-[0_20px_48px_-32px_rgba(15,23,42,0.25)] backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-2 text-[11px] text-slate-400">{hint}</div> : null}
    </Card>
  );
}

export function ManagementFocusCard({
  className,
  icon: Icon,
  eyebrow,
  title,
  value,
  hint,
  badge,
  action,
  ...props
}: React.ComponentProps<typeof Card> & {
  icon: LucideIcon;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        'h-full rounded-[28px] border border-slate-200/70 bg-white/92 p-5 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{eyebrow}</div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Icon className="h-4 w-4 text-slate-500" />
            <span className="truncate">{title}</span>
          </div>
        </div>
        {badge}
      </div>
      <div className="mt-4 text-base font-semibold text-slate-950">{value}</div>
      {hint ? <div className="mt-2 text-xs leading-5 text-slate-500">{hint}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
