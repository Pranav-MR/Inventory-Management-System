import { useState } from 'react';
import { ChevronDown, LogOut, Menu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { SidebarNav } from './SidebarNav';
import { useAuth } from '@/context/AuthContext';

function initialsFrom(nameOrEmail: string) {
  const base = nameOrEmail.split('@')[0];
  const parts = base.split(/[.\s_-]+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase());
  return initials.join('') || base.slice(0, 2).toUpperCase();
}

export function TopBar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="bg-background/80 border-border glow-shadow sticky top-3 z-20 mt-3 mr-3 ml-auto flex h-14 w-fit items-center gap-3 self-end rounded-[1.5rem] border px-4 backdrop-blur-sm md:gap-4 md:px-6 dark:bg-background dark:backdrop-blur-none">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
          <Menu className="size-5" />
        </Button>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-3 md:gap-4">
        <ThemeToggle />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:bg-accent flex items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none transition-colors">
                <div className="rounded-full p-[2px] [background:linear-gradient(135deg,#4ade80,#3b82f6)]">
                  <Avatar className="bg-background size-8">
                    <AvatarFallback className="text-foreground bg-transparent text-xs font-bold">
                      {initialsFrom(user.name ?? user.email)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="hidden flex-col items-start leading-tight sm:flex">
                  <span className="text-sm font-semibold">{user.name ?? 'Account'}</span>
                  <span className="text-muted-foreground max-w-[140px] truncate text-xs">{user.email}</span>
                </div>
                <ChevronDown className="text-muted-foreground size-4 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{user.name ?? 'Account'}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => logout()}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
