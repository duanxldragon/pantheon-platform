import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BreadcrumbNav } from '../../components/breadcrumb_nav';
import { Footer } from '../../components/footer';
import { SidebarNew } from '../../components/sidebar_new';
import { TabManager } from '../../components/tab_manager';
import { TopBar } from '../../components/top_bar';
import { ErrorBoundary } from '../../shared/components/error_boundary';
import { getViewIdByPath } from '../../shared/constants/views_config';
import { useUIStore } from '../../stores/ui_store';
import { useViewManager } from '../../shared/components/use_view_manager';

export function MainLayout() {
  const { tabs, activeTab, removeTab, setActiveTab } = useUIStore();
  const { navigateToView } = useViewManager();
  const location = useLocation();

  const handleNavigate = (viewId: string) => {
    navigateToView(viewId);
  };

  useEffect(() => {
    const currentViewId = getViewIdByPath(location.pathname);
    if (currentViewId && currentViewId !== activeTab) {
      navigateToView(currentViewId);
    }
  }, [activeTab, location.pathname, navigateToView]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigateToView(tabId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen overflow-hidden">
        <SidebarNew onNavigate={handleNavigate} />

        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar onNavigate={handleNavigate} />
          <BreadcrumbNav />
          <TabManager
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onTabClose={removeTab}
          />

          <main className="flex-1 overflow-y-auto p-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

