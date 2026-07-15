import { SidebarNav } from './SidebarNav';

export function AppSidebar() {
  return (
    <aside
      className="bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-60 border-r backdrop-blur-xl md:block"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <SidebarNav />
    </aside>
  );
}
