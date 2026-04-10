"use client";

import * as React from "react";

import { cn } from "./utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

function Label({
  className,
  ...props
}: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-foreground/90 flex items-center gap-2 text-[13px] leading-none font-medium tracking-[0.01em] select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
