import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer focus-visible:border-ring focus-visible:ring-ring/50 size-4 shrink-0 rounded-[4px] border outline-none transition-colors focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        'border-border bg-transparent',
        'data-[state=checked]:border-transparent data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=checked]:shadow-[0_0_10px_rgba(0,0,0,0.15)] dark:data-[state=checked]:shadow-[0_0_12px_rgba(255,255,255,0.55)]',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
