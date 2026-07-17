import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-[22px] w-10 shrink-0 items-center rounded-full border transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=unchecked]:bg-muted-foreground/25 data-[state=unchecked]:border-muted-foreground/40 data-[state=unchecked]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]',
        'data-[state=checked]:border-transparent data-[state=checked]:bg-foreground data-[state=checked]:shadow-[0_0_10px_rgba(0,0,0,0.15)] dark:data-[state=checked]:shadow-[0_0_12px_rgba(255,255,255,0.55)]',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-4 translate-x-0.5 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[19px]',
          'data-[state=unchecked]:bg-foreground data-[state=unchecked]:shadow-[0_1px_3px_rgba(0,0,0,0.4)]',
          'data-[state=checked]:bg-background data-[state=checked]:shadow-[0_1px_2px_rgba(0,0,0,0.5)]',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
