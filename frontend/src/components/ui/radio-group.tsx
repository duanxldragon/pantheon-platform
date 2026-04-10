"use client";

import * as React from "react";
import { cn } from "./utils";

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
        className={cn("grid gap-3.5", className)}
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
          "border-input/80 bg-input-background text-primary peer-aria-invalid:ring-destructive/20 dark:peer-aria-invalid:ring-destructive/40 peer-aria-invalid:border-destructive relative flex size-[1.15rem] shrink-0 cursor-pointer items-center justify-center rounded-full border shadow-[0_10px_24px_-18px_rgba(15,23,42,0.45)] transition-[border-color,background-color,box-shadow,transform] outline-none peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:border-primary/70 peer-checked:bg-primary/5",
          className,
        )}
      >
        {isChecked && (
          <span
            data-slot="radio-group-indicator"
            className="size-2.5 rounded-full bg-primary shadow-[0_0_0_4px_rgba(37,99,235,0.14)]"
          />
        )}
      </label>
    </div>
  );
}

export { RadioGroup, RadioGroupItem };
