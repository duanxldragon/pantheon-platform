import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow,transform] overflow-hidden shadow-sm shadow-slate-200/30",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        success:
          "border-transparent bg-success/15 text-success [a&]:hover:bg-success/20",
        warning:
          "border-transparent bg-warning/15 text-warning [a&]:hover:bg-warning/20",
        info:
          "border-transparent bg-primary/10 text-primary [a&]:hover:bg-primary/15",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border/80 bg-white/85 text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        mono:
          "border-border/70 bg-muted/40 font-medium uppercase tracking-[0.12em] text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
