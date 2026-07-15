import { useState, type FormEvent } from 'react';
import { useDeleteRecurringSupply, useSetRecurringSupply } from '../../api/items';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PeriodUnit, RecurringSupplySchedule } from '../../types/item';

const PERIOD_UNITS: PeriodUnit[] = ['DAY', 'WEEK', 'MONTH', 'YEAR'];

export function RecurringSupplyForm({ itemId, current }: { itemId: string; current: RecurringSupplySchedule | null }) {
  const setSchedule = useSetRecurringSupply(itemId);
  const deleteSchedule = useDeleteRecurringSupply(itemId);

  const [intervalValue, setIntervalValue] = useState(String(current?.intervalValue ?? '1'));
  const [intervalUnit, setIntervalUnit] = useState<PeriodUnit>(current?.intervalUnit ?? 'MONTH');
  const [quantityPerDelivery, setQuantityPerDelivery] = useState(String(current?.quantityPerDelivery ?? ''));
  const [nextExpectedDeliveryDate, setNextExpectedDeliveryDate] = useState(
    current?.nextExpectedDeliveryDate.slice(0, 10) ?? '',
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await setSchedule.mutateAsync({
      intervalValue: Number(intervalValue),
      intervalUnit,
      quantityPerDelivery: Number(quantityPerDelivery),
      nextExpectedDeliveryDate: new Date(nextExpectedDeliveryDate).toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="interval-value" className="text-muted-foreground text-xs">
          Every
        </Label>
        <Input
          id="interval-value"
          type="number"
          required
          min={1}
          value={intervalValue}
          onChange={(e) => setIntervalValue(e.target.value)}
          className="w-20"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs">Unit</Label>
        <Select value={intervalUnit} onValueChange={(v) => setIntervalUnit(v as PeriodUnit)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_UNITS.map((u) => (
              <SelectItem key={u} value={u}>
                {u.charAt(0) + u.slice(1).toLowerCase()}
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
          step="any"
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
      <Button type="submit" disabled={setSchedule.isPending}>
        {current ? 'Update' : 'Set'} schedule
      </Button>
      {current && (
        <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteSchedule.mutate()}>
          Remove
        </Button>
      )}
    </form>
  );
}
