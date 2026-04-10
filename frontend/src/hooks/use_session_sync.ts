import { useEffect } from 'react';
import { useAuthStore } from '../modules/auth/store/auth_store';
import { useSystemStore } from '../stores/system_store';
import { GlobalErrorHandler } from '../shared/utils/error_handler';
import { initializeSecurity } from '../shared/utils/security';

export function useSessionSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const enableMultiTenant = useAuthStore((state) => state.enableMultiTenant);
  const refreshTenantContext = useAuthStore((state) => state.refreshTenantContext);
  const syncSessionState = useAuthStore((state) => state.syncSessionState);

  useEffect(() => {
    initializeSecurity();

    GlobalErrorHandler.getInstance().register('session', (error, context) => {
      console.error(`[Session Error] ${context}:`, error);
    });

    return () => {
      GlobalErrorHandler.getInstance().unregister('session');
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
}







