import * as React from 'react';

import { Card } from '../../../components/ui/card';
import { cn } from '../../../components/ui/utils';

export function ManagementActionBar({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-[26px] border border-slate-200/70 bg-white/72 p-3 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm',
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
        'mb-5 rounded-[26px] border border-slate-200/70 bg-white/72 p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm',
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
        'overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/88 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}
