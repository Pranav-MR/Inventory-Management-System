import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "font-heading inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default:
          'bg-[linear-gradient(135deg,#38bdf8,#3b82f6_60%,#2563eb)] text-white shadow-[0_4px_20px_rgba(56,189,248,0.45)] hover:scale-[1.04] hover:shadow-[0_6px_28px_rgba(56,189,248,0.65)] dark:shadow-[0_4px_20px_rgba(56,189,248,0.45)] not-dark:shadow-[0_4px_16px_rgba(59,130,246,0.3)]',
        destructive:
          'bg-destructive/10 text-destructive border border-destructive/40 shadow-[0_0_20px_rgba(251,113,133,0.2)] hover:scale-[1.04] hover:shadow-[0_0_30px_rgba(251,113,133,0.4)] dark:shadow-none dark:hover:shadow-none',
        outline:
          'border border-input bg-transparent hover:scale-[1.03] hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground border border-border hover:scale-[1.03] hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary font-medium underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
