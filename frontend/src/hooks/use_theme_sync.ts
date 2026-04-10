import { useEffect } from 'react';
import { useThemeStore } from '../stores/theme_store';
import { useTheme } from 'next-themes';

export function useThemeSync() {
  const theme = useThemeStore((state) => state.theme);
  const themeType = useThemeStore((state) => state.themeType);
  const { setTheme: setNextTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const colors = theme.colors;
    
    // Sync themeStore to CSS variables
    // This supports the dynamic color switching from themeStore
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--card', colors.surface);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--destructive', colors.error);
    root.style.setProperty('--info', colors.info);
    
    // Support legacy text colors if any
    root.style.setProperty('--foreground', colors.text);
    
    // Sync dark mode to next-themes
    if (themeType === 'dark') {
      setNextTheme('dark');
    } else {
      setNextTheme('light');
    }
  }, [theme, themeType, setNextTheme]);
}

