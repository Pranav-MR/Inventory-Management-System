import { SidebarNav } from './SidebarNav';

export function AppSidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border glow-shadow fixed top-3 bottom-3 left-3 z-30 hidden w-60 overflow-hidden rounded-[1.5rem] border backdrop-blur-xl md:block dark:backdrop-blur-none">
      <SidebarNav />
    </aside>
  );
}
