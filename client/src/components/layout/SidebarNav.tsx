import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-items';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex size-8 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#38bdf8,#3b82f6_60%,#2563eb)] shadow-[0_6px_16px_rgba(56,189,248,0.5)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 3l8 9-8 9-8-9z" />
          </svg>
        </div>
        <span className="font-heading text-[15px] font-bold tracking-tight">Inventory</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-[linear-gradient(135deg,rgba(59,130,246,0.95),rgba(34,211,238,0.9))] text-white shadow-[0_4px_18px_rgba(59,130,246,0.35)] dark:shadow-[0_4px_18px_rgba(59,130,246,0.5)]'
                  : 'text-sidebar-foreground hover:scale-[1.02] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
