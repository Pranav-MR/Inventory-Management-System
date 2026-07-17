import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { usePageTitle } from './usePageTitle';
import { AmbientBackground, appBlobs } from '@/components/AmbientBackground';
import { ItemsSearchProvider } from '@/context/ItemsSearchContext';

export function AppShell() {
  const title = usePageTitle();

  return (
    <div className="relative min-h-svh overflow-hidden">
      <AmbientBackground blobs={appBlobs} />
      <AppSidebar />
      <div className="relative z-10 flex min-h-svh flex-col md:pl-60">
        <TopBar title={title} />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <ItemsSearchProvider>
              <Outlet />
            </ItemsSearchProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
