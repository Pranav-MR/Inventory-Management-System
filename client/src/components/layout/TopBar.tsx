import { useState } from 'react';
import { LogOut, Menu, Settings } from 'lucide-react';
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

export function TopBar({ title }: { title?: string }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm md:px-6">
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

      <h1 className="font-heading flex-1 truncate text-sm font-bold md:text-base">{title}</h1>

      <ThemeToggle />

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full p-[2px] outline-none [background:linear-gradient(135deg,#4ade80,#3b82f6)]">
              <Avatar className="bg-background size-8">
                <AvatarFallback className="text-foreground bg-transparent text-xs font-bold">
                  {initialsFrom(user.name ?? user.email)}
                </AvatarFallback>
              </Avatar>
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

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
