"use client";

import * as React from "react";
import { cn } from "./utils";

const Circle = ({ className, ...props }: React.ComponentProps<"svg">) => (
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
    <circle cx="12" cy="12" r="10" />
  </svg>
)

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

function RadioGroup({
  className,
  value,
  onValueChange,
  name,
  ...props
}: RadioGroupProps) {
  const generatedName = React.useId();
  const radioName = name || generatedName;

  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name: radioName }}>
      <div
        data-slot="radio-group"
        role="radiogroup"
        className={cn("grid gap-3", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
}

function RadioGroupItem({
  className,
  value: itemValue,
  id,
  ...props
}: RadioGroupItemProps) {
  const { value, onValueChange, name } = React.useContext(RadioGroupContext);
  const isChecked = value === itemValue;
  const generatedId = React.useId();
  const inputId = id || `radio-${generatedId}`;

  return (
    <div className="relative inline-flex">
      <input
        type="radio"
        id={inputId}
        name={name}
        value={itemValue}
        checked={isChecked}
        onChange={() => onValueChange?.(itemValue)}
        className="peer sr-only"
        {...props}
      />
      <label
        htmlFor={inputId}
        data-slot="radio-group-item"
        className={cn(
          "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 peer-aria-invalid:ring-destructive/20 dark:peer-aria-invalid:ring-destructive/40 peer-aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none peer-focus-visible:ring-[3px] peer-disabled:cursor-not-allowed peer-disabled:opacity-50 cursor-pointer flex items-center justify-center",
          className,
        )}
      >
        {isChecked && (
          <span
            data-slot="radio-group-indicator"
            className="relative flex items-center justify-center"
          >
            <Circle className="fill-primary absolute size-2" />
          </span>
        )}
      </label>
    </div>
  );
}

export { RadioGroup, RadioGroupItem };