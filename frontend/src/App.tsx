import { useEffect } from 'react';
import { Toaster } from 'sonner';

import { BreadcrumbNav } from './components/BreadcrumbNav';
import { Footer } from './components/Footer';
import { SidebarNew } from './components/SidebarNew';
import { TabManager } from './components/TabManager';
import { TopBar } from './components/TopBar';
import { Login } from './modules/auth';
import { TenantSetupWizard } from './modules/tenant';
import { useAuthStore } from './modules/auth/store/authStore';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { ViewManager, useViewManager } from './shared/components/ViewManager';
import { initializeApiInterceptor } from './shared/utils/apiInterceptor';
import { GlobalErrorHandler } from './shared/utils/errorHandler';
import { initializeSecurity } from './shared/utils/security';
import { useLanguageStore } from './stores/languageStore';
import { useSystemStore } from './stores/systemStore';
import { useThemeStore } from './stores/themeStore';
import { useUIStore } from './stores/uiStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tenantSetupRequired = useAuthStore((state) => state.tenantSetupRequired);
  const enableMultiTenant = useAuthStore((state) => state.enableMultiTenant);
  const refreshTenantContext = useAuthStore((state) => state.refreshTenantContext);
  const syncSessionState = useAuthStore((state) => state.syncSessionState);

  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const { tabs, activeTab, removeTab, setActiveTab } = useUIStore();
  const { navigateToView } = useViewManager();
  const { renderView, updateAllTabs } = ViewManager();

  useEffect(() => {
    initializeSecurity();
    initializeApiInterceptor();

    GlobalErrorHandler.getInstance().register('app', (error, context) => {
      console.error(`[App Error] ${context}:`, error);
    });

    return () => {
      GlobalErrorHandler.getInstance().unregister('app');
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (enableMultiTenant) {
      void refreshTenantContext();
      return;
    }

    void useSystemStore.getState().initialize();
  }, [enableMultiTenant, isAuthenticated, refreshTenantContext]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let disposed = false;
    let syncing = false;

    const runSessionSync = async () => {
      if (disposed || syncing) {
        return;
      }

      syncing = true;
      try {
        await syncSessionState();
      } finally {
        syncing = false;
      }
    };

    const handleWindowFocus = () => {
      void runSessionSync();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void runSessionSync();
      }
    };

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        void runSessionSync();
      }
    }, 60000);

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, syncSessionState]);

  useEffect(() => {
    updateAllTabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  if (!isAuthenticated) {
    return <Login />;
  }

  if (enableMultiTenant && tenantSetupRequired) {
    return (
      <>
        <TenantSetupWizard />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  const handleNavigate = (viewId: string) => {
    navigateToView(viewId);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      <div className="flex h-screen overflow-hidden">
        <SidebarNew onNavigate={handleNavigate} />

        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar onNavigate={handleNavigate} />
          <BreadcrumbNav />
          <TabManager
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onTabClose={removeTab}
          />

          <main className="flex-1 overflow-y-auto p-6">
            <ErrorBoundary>{renderView()}</ErrorBoundary>
          </main>

          <Footer />
        </div>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
