"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button_variants";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={locale || undefined}
      showOutsideDays={showOutsideDays}
      className={cn("rounded-[22px] border border-border/60 bg-gradient-to-br from-white/96 via-white/92 to-slate-50/85 p-3 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.28)] ring-1 ring-white/70 dark:border-slate-800/70 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900", className)}
      classNames={{
        months: "flex flex-col gap-3 sm:flex-row",
        month: "flex flex-col gap-4",
        caption: "relative flex w-full items-center justify-center pt-1",
        caption_label: "text-sm font-semibold tracking-[0.01em]",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 rounded-xl bg-white/75 p-0 opacity-80 shadow-sm hover:opacity-100 dark:bg-slate-900/70",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground w-9 rounded-md font-medium text-[0.78rem]",
        row: "mt-2 flex w-full",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary/8 [&:has([aria-selected].day-range-end)]:rounded-r-xl",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-xl [&:has(>.day-range-start)]:rounded-l-xl first:[&:has([aria-selected])]:rounded-l-xl last:[&:has([aria-selected])]:rounded-r-xl"
            : "[&:has([aria-selected])]:rounded-xl",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 rounded-xl p-0 font-medium aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground shadow-[0_12px_24px_-16px_rgba(37,99,235,0.55)] hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent/80 text-accent-foreground ring-1 ring-border/60",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => (
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} {...props} />
          ) : (
            <ChevronRight className={cn("size-4", className)} {...props} />
          )
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
