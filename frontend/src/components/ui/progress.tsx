"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "bg-slate-200/70 dark:bg-slate-800/70 relative h-2.5 w-full overflow-hidden rounded-full ring-1 ring-slate-200/70 shadow-inner shadow-slate-300/25 dark:ring-slate-700/60",
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 rounded-full bg-gradient-to-r from-primary via-primary to-sky-400 shadow-[0_10px_24px_-16px_rgba(37,99,235,0.65)] transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
