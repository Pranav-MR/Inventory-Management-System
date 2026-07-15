import { useState, type FormEvent } from 'react';
import { useSetConsumptionRate } from '../../api/items';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ConsumptionRate, PeriodUnit } from '../../types/item';

const PERIOD_UNITS: PeriodUnit[] = ['DAY', 'WEEK', 'MONTH', 'YEAR'];

export function ConsumptionRateForm({ itemId, current }: { itemId: string; current: ConsumptionRate | null }) {
  const setRate = useSetConsumptionRate(itemId);
  const [ratePerPeriod, setRatePerPeriod] = useState(String(current?.ratePerPeriod ?? ''));
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>(current?.periodUnit ?? 'MONTH');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await setRate.mutateAsync({ ratePerPeriod: Number(ratePerPeriod), periodUnit });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rate-value" className="text-muted-foreground text-xs">
          Average consumption
        </Label>
        <Input
          id="rate-value"
          type="number"
          required
          min={0}
          step="any"
          value={ratePerPeriod}
          onChange={(e) => setRatePerPeriod(e.target.value)}
          className="w-28"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs">Per</Label>
        <Select value={periodUnit} onValueChange={(v) => setPeriodUnit(v as PeriodUnit)}>
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
      <Button type="submit" disabled={setRate.isPending}>
        {current ? 'Update' : 'Set'} rate
      </Button>
    </form>
  );
}
