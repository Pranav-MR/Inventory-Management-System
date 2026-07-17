import { useState, type FormEvent, type ReactNode } from 'react';
import { useCreateConsumptionEntry, useUpdateConsumptionEntry, type ConsumptionEntry } from '../../api/consumption';
import { roundQty } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ConsumptionEntryDialog({
  itemId,
  entry,
  trigger,
}: {
  itemId: string;
  entry?: ConsumptionEntry;
  trigger: ReactNode;
}) {
  const createEntry = useCreateConsumptionEntry(itemId);
  const updateEntry = useUpdateConsumptionEntry(itemId);
  const isEditing = !!entry;

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setDate(entry ? entry.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setQuantity(entry ? String(roundQty(entry.quantity)) : '');
      setError(null);
    }
    setOpen(next);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const qty = roundQty(Number(quantity));
    if (!qty || !date) return;
    setError(null);

    try {
      if (entry) {
        await updateEntry.mutateAsync({
          entryId: entry.id,
          input: { date: new Date(date).toISOString(), quantity: qty },
        });
      } else {
        await createEntry.mutateAsync({ date: new Date(date).toISOString(), quantity: qty });
      }
      setOpen(false);
    } catch {
      setError(`Could not ${isEditing ? 'update' : 'add'} this entry. Please try again.`);
    }
  }

  const isPending = createEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit consumption entry' : 'Add consumption entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="consumption-date">Date</Label>
            <DatePicker id="consumption-date" mode="full" value={date} onChange={setDate} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="consumption-quantity">Quantity consumed</Label>
            <Input
              id="consumption-quantity"
              type="number"
              required
              min={0}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Add entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
