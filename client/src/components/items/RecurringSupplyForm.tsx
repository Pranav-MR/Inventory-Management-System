import { useState, type FormEvent } from 'react';
import { format, getDay, addDays, parseISO } from 'date-fns';
import { useSetRecurringSupply } from '../../api/items';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roundQty } from '@/lib/format';
import type { PeriodUnit, RecurringSupplySchedule } from '../../types/item';

type Frequency = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';

const FREQUENCY_TO_INTERVAL: Record<Frequency, { intervalValue: number; intervalUnit: PeriodUnit }> = {
  WEEKLY: { intervalValue: 1, intervalUnit: 'WEEK' },
  FORTNIGHTLY: { intervalValue: 2, intervalUnit: 'WEEK' },
  MONTHLY: { intervalValue: 1, intervalUnit: 'MONTH' },
};

const FREQUENCY_LABELS: Record<Frequency, string> = {
  WEEKLY: 'Weekly',
  FORTNIGHTLY: 'Fortnightly',
  MONTHLY: 'Monthly',
};

// Display order per spec (week starting Monday); values match date-fns/JS getDay() (0 = Sunday).
const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

function frequencyFromInterval(intervalValue: number, intervalUnit: PeriodUnit): Frequency {
  if (intervalUnit === 'WEEK' && intervalValue === 2) return 'FORTNIGHTLY';
  if (intervalUnit === 'WEEK') return 'WEEKLY';
  return 'MONTHLY';
}

/** The next date on/after `from` that falls on `weekday` (0 = Sunday .. 6 = Saturday). */
function nextOccurrenceOfWeekday(weekday: number, from: Date): Date {
  const diff = (weekday - getDay(from) + 7) % 7;
  return addDays(from, diff);
}

export function RecurringSupplyForm({ itemId, current }: { itemId: string; current: RecurringSupplySchedule | null }) {
  const setSchedule = useSetRecurringSupply(itemId);

  const [enabled, setEnabled] = useState(current?.isActive ?? false);
  const [frequency, setFrequency] = useState<Frequency>(
    current ? frequencyFromInterval(current.intervalValue, current.intervalUnit) : 'MONTHLY',
  );
  const [quantityPerDelivery, setQuantityPerDelivery] = useState(String(current?.quantityPerDelivery ?? ''));
  const [nextExpectedDeliveryDate, setNextExpectedDeliveryDate] = useState(
    current?.nextExpectedDeliveryDate.slice(0, 10) ?? '',
  );
  const [weeklyDayOfWeek, setWeeklyDayOfWeek] = useState<number>(() =>
    current && frequencyFromInterval(current.intervalValue, current.intervalUnit) === 'WEEKLY'
      ? getDay(parseISO(current.nextExpectedDeliveryDate))
      : getDay(new Date()),
  );

  function handleFrequencyChange(next: Frequency) {
    setFrequency(next);
    if (next === 'WEEKLY') {
      setNextExpectedDeliveryDate(format(nextOccurrenceOfWeekday(weeklyDayOfWeek, new Date()), 'yyyy-MM-dd'));
    }
  }

  function handleWeekdayChange(day: number) {
    setWeeklyDayOfWeek(day);
    setNextExpectedDeliveryDate(format(nextOccurrenceOfWeekday(day, new Date()), 'yyyy-MM-dd'));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { intervalValue, intervalUnit } = FREQUENCY_TO_INTERVAL[frequency];
    await setSchedule.mutateAsync({
      intervalValue,
      intervalUnit,
      quantityPerDelivery: roundQty(Number(quantityPerDelivery)),
      nextExpectedDeliveryDate: new Date(nextExpectedDeliveryDate).toISOString(),
      isActive: enabled,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Checkbox id="recurring-enabled" checked={enabled} onCheckedChange={(v) => setEnabled(v === true)} />
        <Label htmlFor="recurring-enabled" className="cursor-pointer">
          Recurring Supply
        </Label>
      </div>

      {enabled && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground text-xs">Frequency</Label>
              <Select value={frequency} onValueChange={(v) => handleFrequencyChange(v as Frequency)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FREQUENCY_TO_INTERVAL) as Frequency[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {FREQUENCY_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qty-per-delivery" className="text-muted-foreground text-xs">
                Quantity per delivery
              </Label>
              <Input
                id="qty-per-delivery"
                type="number"
                required
                min={0}
                step="1"
                value={quantityPerDelivery}
                onChange={(e) => setQuantityPerDelivery(e.target.value)}
                className="w-32"
              />
            </div>

            {frequency === 'WEEKLY' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="weekly-day" className="text-muted-foreground text-xs">
                  Day of week
                </Label>
                <Select value={String(weeklyDayOfWeek)} onValueChange={(v) => handleWeekdayChange(Number(v))}>
                  <SelectTrigger id="weekly-day" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency === 'FORTNIGHTLY' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fortnightly-start" className="text-muted-foreground text-xs">
                  Start date
                </Label>
                <DatePicker
                  id="fortnightly-start"
                  mode="full"
                  value={nextExpectedDeliveryDate}
                  onChange={setNextExpectedDeliveryDate}
                />
              </div>
            )}

            {frequency === 'MONTHLY' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="next-delivery" className="text-muted-foreground text-xs">
                  Next delivery
                </Label>
                <DatePicker
                  id="next-delivery"
                  mode="full"
                  value={nextExpectedDeliveryDate}
                  onChange={setNextExpectedDeliveryDate}
                />
              </div>
            )}
          </div>
          {frequency === 'FORTNIGHTLY' && nextExpectedDeliveryDate && (
            <span className="text-muted-foreground -mt-2 text-xs">
              Falls on {format(parseISO(nextExpectedDeliveryDate), 'EEEE')}s, every 14 days
            </span>
          )}
        </>
      )}

      {(enabled || current) && (
        <div>
          <Button type="submit" disabled={setSchedule.isPending}>
            {current ? 'Update' : 'Set'} schedule
          </Button>
        </div>
      )}
    </form>
  );
}
