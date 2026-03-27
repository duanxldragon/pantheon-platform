import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'blue' | 'dark' | 'green' | 'purple' | 'orange';

export interface Theme {
  name: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    hover: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
}

export const themes: Record<ThemeType, Theme> = {
  blue: {
    name: '蓝色主题',
    colors: {
      primary: '#3b82f6',
      primaryLight: '#dbeafe',
      primaryDark: '#1e40af',
      secondary: '#8b5cf6',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      hover: '#f1f5f9',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
      info: '#3b82f6',
    },
  },
  dark: {
    name: '暗色主题',
    colors: {
      primary: '#60a5fa',
      primaryLight: '#1e3a8a',
      primaryDark: '#93c5fd',
      secondary: '#a78bfa',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      hover: '#334155',
      error: '#f87171',
      warning: '#fbbf24',
      success: '#34d399',
      info: '#60a5fa',
    },
  },
  green: {
    name: '绿色主题',
    colors: {
      primary: '#10b981',
      primaryLight: '#d1fae5',
      primaryDark: '#047857',
      secondary: '#14b8a6',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      hover: '#f1f5f9',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
      info: '#3b82f6',
    },
  },
  purple: {
    name: '紫色主题',
    colors: {
      primary: '#8b5cf6',
      primaryLight: '#ede9fe',
      primaryDark: '#6d28d9',
      secondary: '#ec4899',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      hover: '#f1f5f9',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
      info: '#3b82f6',
    },
  },
  orange: {
    name: '橙色主题',
    colors: {
      primary: '#f97316',
      primaryLight: '#ffedd5',
      primaryDark: '#c2410c',
      secondary: '#f59e0b',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      hover: '#f1f5f9',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
      info: '#3b82f6',
    },
  },
};

interface ThemeState {
  theme: Theme;
  themeType: ThemeType;
  setTheme: (type: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: themes.blue,
      themeType: 'blue',
      
      setTheme: (type: ThemeType) => {
        set({ theme: themes[type], themeType: type });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
