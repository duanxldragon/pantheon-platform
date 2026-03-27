"use client";

import * as React from "react";
import { cn } from "./utils";

const Check = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({
  className,
  checked,
  onCheckedChange,
  onChange,
  id,
  ...props
}: CheckboxProps) {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
    onChange?.(e);
  };

  return (
    <div className="relative inline-flex">
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={handleChange}
        className="peer sr-only"
        {...props}
      />
      <label
        htmlFor={checkboxId}
        className={cn(
          "border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs border shadow-sm transition-colors hover:border-primary/80 peer-focus-visible:ring-[3px] peer-focus-visible:outline-hidden peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          checked && "bg-primary border-primary text-primary-foreground",
          className,
        )}
      >
        {checked && <Check className="size-3" />}
      </label>
    </div>
  );
}

export { Checkbox };
