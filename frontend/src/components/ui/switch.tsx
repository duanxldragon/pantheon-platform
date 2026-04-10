"use client";

import * as React from "react";

import { cn } from "./utils";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  uncheckedClassName?: string;
}

function Switch({
  className,
  checked,
  onCheckedChange,
  onChange,
  id,
  uncheckedClassName,
  ...props
}: SwitchProps) {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
    onChange?.(e);
  };

  return (
    <label
      htmlFor={switchId}
      data-slot="switch"
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border/70 p-0.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_-18px_rgba(15,23,42,0.35)] transition-all outline-none focus-within:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50",
        checked
          ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500 to-emerald-400"
          : (uncheckedClassName || "bg-gradient-to-r from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-600"),
        props.disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        type="checkbox"
        id={switchId}
        checked={checked}
        onChange={handleChange}
        className="sr-only"
        {...props}
      />
      <span
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white ring-0 shadow-[0_8px_18px_-10px_rgba(15,23,42,0.45)] transition-transform duration-200 ease-in-out",
          checked 
            ? "translate-x-5"
            : "translate-x-0"
        )}
      />
    </label>
  );
}

export { Switch };
