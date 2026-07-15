import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AmbientBackground, loginBlobs } from '@/components/AmbientBackground';

export function AuthLayout() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
      <AmbientBackground blobs={loginBlobs} />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#38bdf8,#3b82f6_60%,#2563eb)] shadow-[0_8px_24px_rgba(56,189,248,0.5)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 3l8 9-8 9-8-9z" />
            </svg>
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">Inventory</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
