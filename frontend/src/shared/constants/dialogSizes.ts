export const DIALOG_SIZES = {
  xs: '400px',
  sm: '460px',
  md: '560px',
  lg: '720px',
  xl: '880px',
  '2xl': '1040px',
  '3xl': '1180px',
  '4xl': '1320px',
  '5xl': '1440px',
  full: '96vw',
} as const;

export type DialogSize = keyof typeof DIALOG_SIZES;

export const DIALOG_SIZE_RECOMMENDATIONS = {
  confirmation: 'sm',
  simpleForm: 'md',
  standardForm: 'lg',
  complexForm: '2xl',
  details: 'xl',
  tabs: '3xl',
  profile: '4xl',
  editor: '5xl',
} as const satisfies Record<string, DialogSize>;

export const DIALOG_COMMON_STYLES = {
  maxHeight: 'max-h-[92vh]',
  overflow: 'overflow-hidden',
  radius: 'rounded-[28px]',
  surface:
    'border-none bg-white text-slate-950 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/70 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800/70',
} as const;

export function getDialogSize(size: DialogSize = 'lg'): string {
  return DIALOG_SIZES[size];
}

export function getDialogStyle(size: DialogSize = 'lg') {
  return {
    width: '100%',
    maxWidth: DIALOG_SIZES[size],
    maxHeight: '92vh',
  } as const;
}

export function getDialogClassName(size: DialogSize = 'lg', additionalClasses?: string): string {
  const baseClasses = [
    DIALOG_COMMON_STYLES.maxHeight,
    DIALOG_COMMON_STYLES.overflow,
    DIALOG_COMMON_STYLES.radius,
    DIALOG_COMMON_STYLES.surface,
  ].join(' ');

  return additionalClasses ? `${baseClasses} ${additionalClasses}` : baseClasses;
}

export const DIALOG_POSITIONS = {
  center: 'center',
} as const;
