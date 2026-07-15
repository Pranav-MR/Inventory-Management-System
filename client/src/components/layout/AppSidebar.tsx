import { SidebarNav } from './SidebarNav';

export function AppSidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-60 border-r md:block">
      <SidebarNav />
    </aside>
  );
}
