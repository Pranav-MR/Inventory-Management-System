import { useState } from 'react';
import { format, parseISO, endOfMonth } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

export type DatePickerMode = 'full' | 'month';

function MonthYearGrid({
  selected,
  onSelect,
}: {
  selected?: Date;
  onSelect: (date: Date) => void;
}) {
  const [year, setYear] = useState(() => (selected ?? new Date()).getFullYear());
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setYear((y) => y - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-bold">{year}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setYear((y) => y + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {months.map((m) => {
          const isSelected = selected && selected.getFullYear() === year && selected.getMonth() === m;
          return (
            <Button
              key={m}
              type="button"
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              className="font-normal"
              onClick={() => onSelect(new Date(year, m, 1))}
            >
              {format(new Date(2000, m, 1), 'MMM')}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * A single calendar-style picker supporting two modes: `full` (day/month/year,
 * for fields like Received Date) and `month` (month+year only, for fields like
 * Expiry Date where packaging typically only prints "MM/YYYY") — a month
 * selection always resolves to the last day of that month.
 */
export function DatePicker({
  mode,
  value,
  onChange,
  id,
  placeholder = 'Pick a date',
}: {
  mode: DatePickerMode;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseISO(value) : undefined;

  const label = selectedDate ? format(selectedDate, mode === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy') : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn('w-full justify-start font-normal', !selectedDate && 'text-muted-foreground')}
        >
          <CalendarIcon className="size-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="start">
        {mode === 'month' ? (
          <MonthYearGrid
            selected={selectedDate}
            onSelect={(date) => {
              onChange(format(endOfMonth(date), 'yyyy-MM-dd'));
              setOpen(false);
            }}
          />
        ) : (
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }}
          />
        )}
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const today = new Date();
              onChange(format(mode === 'month' ? endOfMonth(today) : today, 'yyyy-MM-dd'));
              setOpen(false);
            }}
          >
            {mode === 'month' ? 'This month' : 'Today'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
