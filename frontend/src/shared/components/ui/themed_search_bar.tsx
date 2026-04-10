import * as React from 'react';
import { useThemeStore } from '../../../stores/theme_store';
import { Input } from '../../../components/ui/input';

interface ThemedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const Search = ({ className, style, ...props }: React.ComponentProps<"svg">) => (
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
    style={style}
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export function ThemedSearchBar({
  value,
  onChange,
  placeholder = '搜索...',
  className = '',
}: ThemedSearchBarProps) {
  const { theme } = useThemeStore();

  return (
    <div className={`relative ${className}`}>
      <Search
        className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: theme.colors.textSecondary }}
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-2xl border-slate-200/80 bg-white/90 pl-10 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.text,
        }}
      />
    </div>
  );
}
