"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { type VariantProps } from "class-variance-authority";

import { toggleVariants } from "./toggle_variants";
import { cn } from "./utils";

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle };
