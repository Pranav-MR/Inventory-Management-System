import { useState, type FormEvent } from 'react';
import { useSetRecurringSupply } from '../../api/items';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

function frequencyFromInterval(intervalValue: number, intervalUnit: PeriodUnit): Frequency {
  if (intervalUnit === 'WEEK' && intervalValue === 2) return 'FORTNIGHTLY';
  if (intervalUnit === 'WEEK') return 'WEEKLY';
  return 'MONTHLY';
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
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs">Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="next-delivery" className="text-muted-foreground text-xs">
              Next delivery
            </Label>
            <Input
              id="next-delivery"
              type="date"
              required
              value={nextExpectedDeliveryDate}
              onChange={(e) => setNextExpectedDeliveryDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
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
