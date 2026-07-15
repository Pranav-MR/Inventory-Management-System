import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { usePageTitle } from './usePageTitle';

export function AppShell() {
  const title = usePageTitle();

  return (
    <div className="bg-background min-h-svh">
      <AppSidebar />
      <div className="flex min-h-svh flex-col md:pl-60">
        <TopBar title={title} />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
