import { useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import { useUpdateBatch } from '../../api/batches';
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
import type { Batch } from '../../types/item';

export function EditBatchDialog({ itemId, batch }: { itemId: string; batch: Batch }) {
  const updateBatch = useUpdateBatch(itemId);

  const [open, setOpen] = useState(false);
  const [batchLabel, setBatchLabel] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantityReceived, setQuantityReceived] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setBatchLabel(batch.batchLabel ?? '');
      setReceivedDate(batch.receivedDate.slice(0, 10));
      setExpiryDate(batch.expiryDate.slice(0, 10));
      setQuantityReceived(String(roundQty(batch.quantityReceived)));
      setError(null);
    }
    setOpen(next);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const quantity = roundQty(Number(quantityReceived));
    if (!quantity || !receivedDate || !expiryDate) return;
    setError(null);

    try {
      await updateBatch.mutateAsync({
        batchId: batch.id,
        input: {
          batchLabel: batchLabel || null,
          receivedDate: new Date(receivedDate).toISOString(),
          expiryDate: new Date(expiryDate).toISOString(),
          quantityReceived: quantity,
        },
      });
      setOpen(false);
    } catch {
      setError('Could not update this batch. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary size-7 border border-transparent"
          aria-label={`Edit ${batch.batchLabel ?? 'batch'}`}
        >
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-batch-label">Label (optional)</Label>
            <Input
              id="edit-batch-label"
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              placeholder="e.g. July batch"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-batch-received">Received</Label>
              <DatePicker id="edit-batch-received" mode="full" value={receivedDate} onChange={setReceivedDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-batch-expiry">Expiry</Label>
              <DatePicker id="edit-batch-expiry" mode="month" value={expiryDate} onChange={setExpiryDate} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-batch-quantity">Quantity</Label>
            <Input
              id="edit-batch-quantity"
              type="number"
              required
              min={0}
              step="1"
              value={quantityReceived}
              onChange={(e) => setQuantityReceived(e.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={updateBatch.isPending}>
              {updateBatch.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
