import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  background: 'hsl(0 0% 100%)',
  foreground: 'hsl(222.2 84% 4.9%)',
  card: 'hsl(0 0% 100%)',
  cardForeground: 'hsl(222.2 84% 4.9%)',
  popover: 'hsl(0 0% 100%)',
  popoverForeground: 'hsl(222.2 84% 4.9%)',
  primary: 'hsl(222.2 47.4% 11.2%)',
  primaryForeground: 'hsl(210 40% 98%)',
  secondary: 'hsl(210 40% 96%)',
  secondaryForeground: 'hsl(222.2 84% 4.9%)',
  muted: 'hsl(210 40% 96%)',
  mutedForeground: 'hsl(215.4 16.3% 46.9%)',
  accent: 'hsl(210 40% 96%)',
  accentForeground: 'hsl(222.2 84% 4.9%)',
  destructive: 'hsl(0 84.2% 60.2%)',
  destructiveForeground: 'hsl(210 40% 98%)',
  border: 'hsl(214.3 31.8% 91.4%)',
  input: 'hsl(214.3 31.8% 91.4%)',
  ring: 'hsl(222.2 84% 4.9%)',
};

const darkColors: ThemeColors = {
  background: 'hsl(222.2 84% 4.9%)',
  foreground: 'hsl(210 40% 98%)',
  card: 'hsl(222.2 84% 4.9%)',
  cardForeground: 'hsl(210 40% 98%)',
  popover: 'hsl(222.2 84% 4.9%)',
  popoverForeground: 'hsl(210 40% 98%)',
  primary: 'hsl(210 40% 98%)',
  primaryForeground: 'hsl(222.2 47.4% 11.2%)',
  secondary: 'hsl(217.2 32.6% 17.5%)',
  secondaryForeground: 'hsl(210 40% 98%)',
  muted: 'hsl(217.2 32.6% 17.5%)',
  mutedForeground: 'hsl(215 20.2% 65.1%)',
  accent: 'hsl(217.2 32.6% 17.5%)',
  accentForeground: 'hsl(210 40% 98%)',
  destructive: 'hsl(0 62.8% 30.6%)',
  destructiveForeground: 'hsl(210 40% 98%)',
  border: 'hsl(217.2 32.6% 17.5%)',
  input: 'hsl(217.2 32.6% 17.5%)',
  ring: 'hsl(212.7 26.8% 83.9%)',
};

interface ThemeState {
  theme: Theme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  getEffectiveTheme: () => Theme;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: {
          mode: 'system',
          colors: lightColors, // Default to light colors, will be overridden by system preference
        },
        
        setTheme: (mode) => {
          const colors = getColorsForMode(mode);
          set({
            theme: {
              mode,
              colors,
            },
          });
          
          // Apply theme to document
          applyThemeToDocument(mode, colors);
        },
        
        toggleTheme: () => {
          const currentMode = get().theme.mode;
          let newMode: ThemeMode;
          
          if (currentMode === 'light') {
            newMode = 'dark';
          } else if (currentMode === 'dark') {
            newMode = 'system';
          } else {
            newMode = 'light';
          }
          
          get().setTheme(newMode);
        },
        
        getEffectiveTheme: () => {
          const { theme } = get();
          if (theme.mode === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return {
              mode: 'system',
              colors: prefersDark ? darkColors : lightColors,
            };
          }
          return theme;
        },
      }),
      {
        name: 'theme-storage',
        partialize: (state) => ({
          theme: state.theme,
        }),
      }
    ),
    {
      name: 'theme-store',
    }
  )
);

// Helper functions
function getColorsForMode(mode: ThemeMode): ThemeColors {
  if (mode === 'dark') {
    return darkColors;
  } else if (mode === 'light') {
    return lightColors;
  } else {
    // System mode - will be determined dynamically
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? darkColors : lightColors;
  }
}

function applyThemeToDocument(mode: ThemeMode, colors: ThemeColors) {
  const root = document.documentElement;
  
  // Apply color CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // Apply theme mode class
  root.classList.remove('light', 'dark');
  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(mode);
  }
}

// Initialize theme on app start
export const initializeTheme = () => {
  const themeStore = useThemeStore.getState();
  themeStore.setTheme(themeStore.theme.mode);
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (themeStore.theme.mode === 'system') {
      themeStore.setTheme('system');
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
};