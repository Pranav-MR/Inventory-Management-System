import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const GLOW_DURATION_MS = 320;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [glowing, setGlowing] = useState(false);

  useEffect(() => {
    if (!glowing) return;
    const timeout = setTimeout(() => setGlowing(false), GLOW_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [glowing]);

  function toggleTheme() {
    setTheme(isDark ? 'light' : 'dark');
    setGlowing(true);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={cn(
        'relative transition-[background-color,border-color,box-shadow] duration-300 ease-in-out motion-reduce:transition-none',
        isDark ? 'border-primary/30 bg-primary/10' : 'border-[#f59e0b]/35 bg-[#fef3c7]/70',
        glowing &&
          (isDark
            ? 'shadow-[0_0_16px_rgba(56,189,248,0.55)]'
            : 'shadow-[0_0_16px_rgba(245,158,11,0.5)]'),
      )}
    >
      <span className="relative block size-4">
        <Sun
          aria-hidden
          className={cn(
            'absolute inset-0 size-4 text-[#f59e0b] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none motion-reduce:duration-0',
            isDark ? 'rotate-180 scale-90 opacity-0' : 'rotate-0 scale-100 opacity-100',
          )}
        />
        <Moon
          aria-hidden
          className={cn(
            'text-primary absolute inset-0 size-4 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none motion-reduce:duration-0',
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-90 opacity-0',
          )}
        />
      </span>
    </Button>
  );
}
