"use client";

import * as React from "react";

import { cn } from "./utils";

interface TabsContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsListVariant;
  size?: TabsListSize;
}

const TabsContext = React.createContext<TabsContextValue>({});

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({
  className,
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '');
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

type TabsListVariant = 'default' | 'pill' | 'segmented';
type TabsListSize = 'sm' | 'default' | 'lg';

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TabsListVariant;
  size?: TabsListSize;
}

const tabsListVariantClasses: Record<TabsListVariant, string> = {
  default: 'bg-gradient-to-r from-slate-100/90 via-white/70 to-slate-100/90 text-muted-foreground rounded-2xl p-1 shadow-sm shadow-slate-200/30',
  pill: 'bg-muted/60 text-muted-foreground rounded-full p-1 shadow-sm shadow-slate-200/20',
  segmented: 'border border-border/70 bg-background/95 text-muted-foreground rounded-full p-1 shadow-sm shadow-slate-200/30',
};

const tabsTriggerVariantClasses: Record<TabsListVariant, string> = {
  default:
    'rounded-2xl data-[state=active]:bg-card dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 data-[state=active]:text-foreground data-[state=active]:shadow-sm',
  pill:
    'rounded-full data-[state=active]:bg-card data-[state=active]:text-foreground dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-sm',
  segmented:
    'rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground',
};

const tabsTriggerSizeClasses: Record<TabsListSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  default: 'px-3.5 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm',
};

function TabsList({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: TabsListProps) {
  const parentContext = React.useContext(TabsContext);

  return (
    <TabsContext.Provider
      value={{
        ...parentContext,
        variant,
        size,
      }}
    >
      <div
        data-slot="tabs-list"
        data-variant={variant}
        data-size={size}
        role="tablist"
        className={cn(
          'inline-flex w-fit items-center justify-center gap-1',
          tabsListVariantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function TabsTrigger({
  className,
  value,
  onClick,
  ...props
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange, variant = 'default', size = 'default' } =
    React.useContext(TabsContext);
  const isActive = selectedValue === value;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onValueChange?.(value);
    onClick?.(e);
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      data-slot="tabs-trigger"
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 border border-transparent font-medium whitespace-nowrap transition-[color,box-shadow,transform] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        tabsTriggerVariantClasses[variant],
        tabsTriggerSizeClasses[size],
        className,
      )}
      onClick={handleClick}
      {...props}
    />
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabsContent({
  className,
  value,
  ...props
}: TabsContentProps) {
  const { value: selectedValue } = React.useContext(TabsContext);
  const isActive = selectedValue === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      data-state={isActive ? 'active' : 'inactive'}
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
