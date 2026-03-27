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
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-within:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 cursor-pointer",
        checked ? "bg-green-500" : (uncheckedClassName || "bg-red-500"),
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
          "pointer-events-none block size-5 rounded-full ring-0 transition-transform duration-200 ease-in-out bg-white",
          checked 
            ? "translate-x-6" 
            : "translate-x-1"
        )}
      />
    </label>
  );
}

export { Switch };
