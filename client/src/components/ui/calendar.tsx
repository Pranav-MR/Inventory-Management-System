import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

function Calendar({ className, classNames, showOutsideDays = true, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col gap-4',
        month: 'flex flex-col gap-3',
        month_caption: 'flex justify-center items-center h-9 relative',
        caption_label: 'text-sm font-bold',
        nav: 'flex items-center gap-1 absolute inset-x-0 justify-between px-1',
        button_previous: cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-7'),
        button_next: cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-7'),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-muted-foreground w-9 text-[0.75rem] font-medium',
        week: 'flex w-full mt-1',
        day: 'p-0 text-center text-sm relative size-9',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-9 rounded-md p-0 font-normal aria-selected:opacity-100',
        ),
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:shadow-[0_0_14px_rgba(56,189,248,0.4)]',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:font-bold',
        outside: 'text-muted-foreground opacity-40',
        disabled: 'text-muted-foreground opacity-30',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('size-4', chevronClassName)} {...chevronProps} />
          ) : (
            <ChevronRight className={cn('size-4', chevronClassName)} {...chevronProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
