import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router';
import { useLanguageStore } from './stores/language_store';
import { useThemeSync } from './hooks/use_theme_sync';
import { useSessionSync } from './hooks/use_session_sync';
import { queryClient } from './shared/utils/tanstack_query';

function AppContent() {
  const language = useLanguageStore((state) => state.language);

  // Custom hooks for synchronization
  useThemeSync();
  useSessionSync();

  useEffect(() => {
    // 这里可以添加语言变化时的逻辑
    // 比如更新文档的lang属性
    document.documentElement.lang = language;
  }, [language]);

  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
