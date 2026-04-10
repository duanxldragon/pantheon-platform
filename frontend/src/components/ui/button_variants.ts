import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_28px_-18px_rgba(37,99,235,0.5)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:-translate-y-0.5 hover:bg-destructive/90 shadow-[0_8px_16px_-4px_rgba(239,68,68,0.25)]",
        success:
          "bg-success text-success-foreground hover:-translate-y-0.5 hover:bg-success/90 shadow-[0_8px_16px_-4px_rgba(16,185,129,0.25)]",
        warning:
          "bg-warning text-warning-foreground hover:-translate-y-0.5 hover:bg-warning/90 shadow-[0_8px_16px_-4px_rgba(245,158,11,0.25)]",
        outline:
          "border border-border/80 bg-background text-foreground shadow-sm shadow-slate-200/40 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        mono:
          "border border-border/70 bg-background text-foreground shadow-sm hover:-translate-y-0.5 hover:bg-accent/60 hover:text-foreground hover:shadow-md",
        "ghost-danger":
          "text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/15",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        icon: "size-10",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-10 rounded-full",
        pill: "h-10 rounded-full px-4 py-2 has-[>svg]:px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
