import { Outlet } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function AuthLayout() {
  return (
    <div className="bg-muted/40 relative flex min-h-svh items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Boxes className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Inventory</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
